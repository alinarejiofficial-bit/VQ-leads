import datetime

from django.db.models import Avg, Count, F, Q
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FollowUp, FollowUpHistory, Lead
from .serializers import FollowUpHistorySerializer


def record_followup_history(followup, action, old_value, new_value, user):
    FollowUpHistory.objects.create(
        followup=followup,
        action=action,
        old_value=str(old_value),
        new_value=str(new_value),
        performed_by=user,
    )


def followups_visible_to(user):
    qs = FollowUp.objects.select_related('lead', 'assigned_agent', 'created_by', 'completed_by')
    if user.profile.role == 'ADMIN':
        return qs
    return qs.filter(Q(assigned_agent=user) | Q(created_by=user) | Q(lead__owner=user)).distinct()


class FollowUpHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FollowUpHistorySerializer

    def get_queryset(self):
        user = self.request.user
        followup_id = self.request.query_params.get('followup')
        qs = FollowUpHistory.objects.select_related('performed_by', 'followup').all()
        if user.profile.role != 'ADMIN':
            qs = qs.filter(
                Q(followup__assigned_agent=user) |
                Q(followup__created_by=user) |
                Q(followup__lead__owner=user)
            )
        if followup_id:
            qs = qs.filter(followup_id=followup_id)
        return qs.order_by('-created_at')


class FollowUpWidgetStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        today = timezone.localtime(now).date()

        qs = followups_visible_to(user)
        active = qs.filter(status='SCHEDULED')

        total = qs.count()
        completed = qs.filter(status='COMPLETED').count()
        overdue = active.filter(scheduled_time__lt=now).count()
        due_today = active.filter(scheduled_time__date=today).count()
        upcoming = active.filter(scheduled_time__gte=now).exclude(scheduled_time__date=today).count()
        completed_today = qs.filter(status='COMPLETED', completed_at__date=today).count()
        pending_today = active.filter(scheduled_time__date=today, scheduled_time__gte=now).count()

        finished = completed + qs.filter(status='CANCELLED').count() + overdue
        success_rate = round((completed / finished) * 100, 1) if finished > 0 else 0.0

        return Response({
            'totalFollowups': total,
            'upcomingFollowups': upcoming,
            'todayFollowups': due_today,
            'overdueFollowups': overdue,
            'completedFollowups': completed,
            'successRate': success_rate,
            'completedToday': completed_today,
            'pendingToday': pending_today,
        })


class FollowUpAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        qs = followups_visible_to(user)

        # By agent
        by_agent = []
        agent_rows = (
            qs.filter(assigned_agent__isnull=False)
            .values('assigned_agent__username', 'assigned_agent__first_name', 'assigned_agent__last_name')
            .annotate(
                total=Count('id'),
                completed=Count('id', filter=Q(status='COMPLETED')),
                overdue=Count('id', filter=Q(status='SCHEDULED', scheduled_time__lt=now)),
            )
            .order_by('-total')
        )
        for row in agent_rows:
            name = f"{row['assigned_agent__first_name']} {row['assigned_agent__last_name']}".strip()
            by_agent.append({
                'agent': name or row['assigned_agent__username'],
                'username': row['assigned_agent__username'],
                'total': row['total'],
                'completed': row['completed'],
                'overdue': row['overdue'],
                'completionRate': round((row['completed'] / row['total']) * 100, 1) if row['total'] else 0,
            })

        # By status (effective)
        active = qs.filter(status='SCHEDULED')
        today = timezone.localtime(now).date()
        by_status = {
            'UPCOMING': active.filter(scheduled_time__gte=now).exclude(scheduled_time__date=today).count(),
            'TODAY': active.filter(scheduled_time__date=today).count(),
            'OVERDUE': active.filter(scheduled_time__lt=now).exclude(scheduled_time__date=today).count(),
            'COMPLETED': qs.filter(status='COMPLETED').count(),
            'CANCELLED': qs.filter(status='CANCELLED').count(),
        }

        # By lead source
        by_source = [
            {'source': row['lead__source'], 'count': row['count']}
            for row in qs.values('lead__source').annotate(count=Count('id')).order_by('-count')[:8]
        ]

        # Conversion rate after follow-up: leads with >=1 completed follow-up that are WON
        leads_with_completed = Lead.objects.filter(
            followups__status='COMPLETED'
        ).distinct()
        followed_total = leads_with_completed.count()
        followed_won = leads_with_completed.filter(status='WON').count()
        conversion_after_followup = round((followed_won / followed_total) * 100, 1) if followed_total else 0.0

        # Average completion time (scheduled -> completed) in hours
        avg_delta = qs.filter(
            status='COMPLETED', completed_at__isnull=False
        ).annotate(delta=F('completed_at') - F('created_at')).aggregate(avg=Avg('delta'))['avg']
        avg_completion_hours = round(avg_delta.total_seconds() / 3600, 1) if avg_delta else 0.0

        # Daily trend, last 14 days (scheduled vs completed)
        daily_trend = []
        for i in range(13, -1, -1):
            day = today - datetime.timedelta(days=i)
            daily_trend.append({
                'date': day.strftime('%b %d'),
                'scheduled': qs.filter(scheduled_time__date=day).count(),
                'completed': qs.filter(status='COMPLETED', completed_at__date=day).count(),
            })

        # Monthly performance, last 6 months
        monthly = []
        month_cursor = today.replace(day=1)
        for _ in range(6):
            month_qs = qs.filter(
                scheduled_time__year=month_cursor.year,
                scheduled_time__month=month_cursor.month,
            )
            monthly.append({
                'month': month_cursor.strftime('%b %Y'),
                'total': month_qs.count(),
                'completed': month_qs.filter(status='COMPLETED').count(),
            })
            month_cursor = (month_cursor - datetime.timedelta(days=1)).replace(day=1)
        monthly.reverse()

        return Response({
            'byAgent': by_agent,
            'byStatus': by_status,
            'bySource': by_source,
            'conversionAfterFollowup': conversion_after_followup,
            'avgCompletionHours': avg_completion_hours,
            'dailyTrend': daily_trend,
            'monthlyPerformance': monthly,
        })
