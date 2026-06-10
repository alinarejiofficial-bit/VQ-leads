from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Lead, LeadActivity, CallLog, LeadNote, LeadEmail, FollowUp
from .serializers import LeadActivitySerializer, CallLogSerializer, LeadNoteSerializer, LeadEmailSerializer, FollowUpSerializer


def user_can_access_lead(user, lead):
    if user.profile.role == 'ADMIN':
        return True
    return lead.owner_id == user.id or lead.owner_id is None


def log_activity(lead, activity_type, description, user):
    LeadActivity.objects.create(
        lead=lead,
        user=user,
        activity_type=activity_type,
        description=description,
    )


class ActivitiesTimelineView(APIView):
    def get(self, request):
        user = request.user
        activity_type = request.query_params.get('activity_type')
        agent_id = request.query_params.get('agent')
        lead_id = request.query_params.get('lead')
        status_filter = request.query_params.get('status')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = min(max(int(request.query_params.get('page_size', 20)), 1), 100)

        qs = LeadActivity.objects.select_related('lead', 'user').all()
        if user.profile.role != 'ADMIN':
            qs = qs.filter(Q(lead__owner=user) | Q(lead__owner__isnull=True))
        if activity_type:
            qs = qs.filter(activity_type=activity_type)
        if agent_id:
            qs = qs.filter(user_id=agent_id)
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if status_filter:
            qs = qs.filter(lead__status=status_filter)

        qs = qs.order_by('-created_at')
        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        items = qs[start:end]
        serializer = LeadActivitySerializer(items, many=True)

        return Response({
            'results': serializer.data,
            'page': page,
            'page_size': page_size,
            'total': total,
            'has_next': end < total,
        })


class CallLogViewSet(viewsets.ModelViewSet):
    serializer_class = CallLogSerializer

    def get_queryset(self):
        user = self.request.user
        qs = CallLog.objects.select_related('lead', 'agent').all()
        if user.profile.role != 'ADMIN':
            qs = qs.filter(Q(agent=user) | Q(lead__owner=user))

        lead_id = self.request.query_params.get('lead')
        agent_id = self.request.query_params.get('agent')
        call_status = self.request.query_params.get('call_status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        query = self.request.query_params.get('q')

        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        if agent_id:
            qs = qs.filter(agent_id=agent_id)
        if call_status:
            qs = qs.filter(call_status=call_status)
        if date_from:
            qs = qs.filter(call_date__date__gte=date_from)
        if date_to:
            qs = qs.filter(call_date__date__lte=date_to)
        if query:
            qs = qs.filter(Q(notes__icontains=query) | Q(lead__name__icontains=query))
        return qs.order_by('-call_date')

    def perform_create(self, serializer):
        call = serializer.save(agent=self.request.user)
        log_activity(
            call.lead,
            'CALL_LOGGED',
            f"Call logged ({call.call_type}, {call.call_status}) by {self.request.user.username}.",
            self.request.user
        )

    def perform_update(self, serializer):
        call = serializer.save()
        log_activity(
            call.lead,
            'CALL_UPDATED',
            f"Call log updated by {self.request.user.username}.",
            self.request.user
        )


class LeadNoteViewSet(viewsets.ModelViewSet):
    serializer_class = LeadNoteSerializer

    def get_queryset(self):
        user = self.request.user
        qs = LeadNote.objects.select_related('lead', 'created_by').prefetch_related('mentions')
        if user.profile.role != 'ADMIN':
            qs = qs.filter(Q(created_by=user) | Q(lead__owner=user))
        lead_id = self.request.query_params.get('lead')
        created_by = self.request.query_params.get('created_by')
        pinned = self.request.query_params.get('pinned')
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        if created_by:
            qs = qs.filter(created_by_id=created_by)
        if pinned == 'true':
            qs = qs.filter(is_pinned=True)
        return qs.order_by('-is_pinned', '-created_at')

    def perform_create(self, serializer):
        note = serializer.save(created_by=self.request.user)
        log_activity(
            note.lead,
            'NOTE_ADDED',
            f"Note '{note.title}' added by {self.request.user.username}.",
            self.request.user
        )

    def perform_update(self, serializer):
        note = serializer.save()
        log_activity(
            note.lead,
            'NOTE_UPDATED',
            f"Note '{note.title}' updated by {self.request.user.username}.",
            self.request.user
        )

    def perform_destroy(self, instance):
        lead = instance.lead
        title = instance.title
        super().perform_destroy(instance)
        log_activity(
            lead,
            'NOTE_DELETED',
            f"Note '{title}' deleted by {self.request.user.username}.",
            self.request.user
        )


class LeadEmailViewSet(viewsets.ModelViewSet):
    serializer_class = LeadEmailSerializer

    def get_queryset(self):
        user = self.request.user
        qs = LeadEmail.objects.select_related('lead')
        if user.profile.role != 'ADMIN':
            qs = qs.filter(lead__owner=user)
        lead_id = self.request.query_params.get('lead')
        direction = self.request.query_params.get('direction')
        status_val = self.request.query_params.get('status')
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        if direction:
            qs = qs.filter(direction=direction)
        if status_val:
            qs = qs.filter(status=status_val)
        return qs.order_by('-sent_at')

    def perform_create(self, serializer):
        email = serializer.save()
        activity_type = 'EMAIL_SENT' if email.direction == 'SENT' else 'EMAIL_RECEIVED'
        log_activity(
            email.lead,
            activity_type,
            f"Email '{email.subject}' {email.direction.lower()} ({email.status.lower()}).",
            self.request.user
        )

    def perform_update(self, serializer):
        email = serializer.save()
        log_activity(
            email.lead,
            'EMAIL_UPDATED',
            f"Email '{email.subject}' updated to {email.status.lower()}.",
            self.request.user
        )


class ActivityWidgetStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        activities_qs = LeadActivity.objects.all()
        calls_qs = CallLog.objects.all()
        notes_qs = LeadNote.objects.all()
        emails_qs = LeadEmail.objects.all()
        followups_qs = FollowUp.objects.all()
        if user.profile.role != 'ADMIN':
            activities_qs = activities_qs.filter(Q(lead__owner=user) | Q(user=user))
            calls_qs = calls_qs.filter(agent=user)
            notes_qs = notes_qs.filter(created_by=user)
            emails_qs = emails_qs.filter(lead__owner=user)
            followups_qs = followups_qs.filter(Q(lead__owner=user) | Q(assigned_agent=user))

        pending_followups = followups_qs.filter(completed=False, scheduled_time__gte=timezone.now()).count()
        overdue_followups = followups_qs.filter(completed=False, scheduled_time__lt=timezone.now()).count()

        return Response({
            'totalActivities': activities_qs.count(),
            'callsMadeToday': calls_qs.filter(call_date__date=today).count(),
            'notesAddedToday': notes_qs.filter(created_at__date=today).count(),
            'emailsSentToday': emails_qs.filter(sent_at__date=today, direction='SENT').count(),
            'pendingFollowUps': pending_followups,
            'overdueFollowUps': overdue_followups,
        })
