from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count, Sum, Max, F, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from decimal import Decimal
import datetime

from .models import UserProfile, SalesTeam, LeadForm, Lead, LeadActivity, FollowUp, Task, Commission
from .serializers import (
    UserSerializer, UserProfileSerializer, SalesTeamSerializer,
    LeadFormSerializer, LeadSerializer, LeadActivitySerializer,
    FollowUpSerializer, TaskSerializer, CommissionSerializer
)

# Custom Permissions
class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN'


class IsAdminOrLeaderUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role in ['ADMIN', 'LEADER']


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN'


# Auth Views
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            serializer = UserSerializer(user)
            return Response({
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'user': serializer.data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    def post(self, request):
        return Response({'success': 'Logged out successfully'})


class MeView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# Agents View
class AgentsView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUserRole()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        user = request.user
        if user.profile.role == 'ADMIN':
            agents = User.objects.filter(profile__role='AGENT', is_active=True)
        elif user.profile.role == 'LEADER':
            led_teams = user.led_teams.all()
            agents = User.objects.filter(sales_teams__in=led_teams, profile__role='AGENT', is_active=True).distinct()
        else:
            agents = User.objects.none()
        serializer = UserSerializer(agents, many=True)
        return Response(serializer.data)

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email', '')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        commission_rate = request.data.get('commission_rate', '10.00')

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Profile is created via post_save signal. We update its role & commission rate.
        profile = user.profile
        profile.role = 'AGENT'
        profile.commission_rate = Decimal(str(commission_rate))
        profile.save()

        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# Lead ViewSet
class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Lead.objects.none()
        if user.profile.role == 'ADMIN':
            return Lead.objects.all().order_by('-created_at')
        if user.profile.role == 'LEADER':
            led_teams = user.led_teams.all()
            member_ids = User.objects.filter(sales_teams__in=led_teams).values_list('id', flat=True)
            return Lead.objects.filter(Q(owner=user) | Q(owner_id__in=member_ids) | Q(owner__isnull=True)).order_by('-created_at')
        return Lead.objects.filter(owner=user).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        owner = serializer.validated_data.get('owner')
        
        # If agent creates a lead, default owner is themselves
        if user.profile.role == 'AGENT':
            owner = user
            
        lead = serializer.save(owner=owner)
        
        # Log activity
        LeadActivity.objects.create(
            lead=lead,
            user=user,
            activity_type='CREATED',
            description=f"Lead created by {user.username}."
        )

    def perform_update(self, serializer):
        lead = self.get_object()
        old_status = lead.status
        old_owner = lead.owner
        old_value = lead.value

        updated_lead = serializer.save()
        user = self.request.user

        # Track changes and log activities
        changes = []
        if old_status != updated_lead.status:
            changes.append(f"status changed from '{old_status}' to '{updated_lead.status}'")
            LeadActivity.objects.create(
                lead=updated_lead,
                user=user,
                activity_type='STATUS_CHANGE',
                description=f"Status changed from {old_status} to {updated_lead.status}."
            )
            
            # Handle automatic commissions on WON status asynchronously
            if updated_lead.status == 'WON':
                if updated_lead.owner:
                    from .tasks import calculate_commission_task
                    calculate_commission_task.delay(updated_lead.id)
            # If changed away from WON, delete any pending commissions
            elif old_status == 'WON':
                Commission.objects.filter(lead=updated_lead, status='PENDING').delete()

        if old_owner != updated_lead.owner:
            owner_name = updated_lead.owner.username if updated_lead.owner else "Unassigned"
            changes.append(f"assigned to {owner_name}")
            LeadActivity.objects.create(
                lead=updated_lead,
                user=user,
                activity_type='ASSIGNMENT',
                description=f"Lead assigned to {owner_name}."
            )

        if old_value != updated_lead.value:
            changes.append(f"value updated to ${updated_lead.value}")
            # If commission exists and is pending, recalculate it
            commissions = Commission.objects.filter(lead=updated_lead, status='PENDING')
            for comm in commissions:
                comm.amount = updated_lead.value * (comm.rate / Decimal('100.0'))
                comm.save()

    @action(detail=True, methods=['post'])
    def notes(self, request, pk=None):
        lead = self.get_object()
        note_text = request.data.get('note')
        if not note_text:
            return Response({'error': 'Note text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        activity = LeadActivity.objects.create(
            lead=lead,
            user=request.user,
            activity_type='NOTE_ADDED',
            description=note_text
        )
        serializer = LeadActivitySerializer(activity)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):
        lead = self.get_object()
        activities = lead.activities.all().order_by('-created_at')
        serializer = LeadActivitySerializer(activities, many=True)
        return Response(serializer.data)


# Sales Team ViewSet
class SalesTeamViewSet(viewsets.ModelViewSet):
    serializer_class = SalesTeamSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return SalesTeam.objects.all().order_by('name')


# Lead Form ViewSet
class LeadFormViewSet(viewsets.ModelViewSet):
    serializer_class = LeadFormSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return LeadForm.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# Public Form APIs (No Authentication Required)
class PublicFormDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            form = LeadForm.objects.get(pk=pk, is_active=True)
            serializer = LeadFormSerializer(form)
            return Response(serializer.data)
        except LeadForm.DoesNotExist:
            return Response({'error': 'Active lead form not found'}, status=status.HTTP_404_NOT_FOUND)


class PublicFormSubmitView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        try:
            form = LeadForm.objects.get(pk=pk, is_active=True)
        except LeadForm.DoesNotExist:
            return Response({'error': 'Active lead form not found'}, status=status.HTTP_404_NOT_FOUND)

        name = request.data.get('name')
        email = request.data.get('email', '')
        phone = request.data.get('phone', '')
        company = request.data.get('company', '')
        notes = request.data.get('notes', '')
        value = Decimal(str(request.data.get('value', '0.00') or '0.00'))

        if not name:
            return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)

        lead = Lead.objects.create(
            name=name,
            email=email,
            phone=phone,
            company=company,
            status='NEW',
            source=f"Form: {form.name}",
            value=value,
            form=form
        )

        LeadActivity.objects.create(
            lead=lead,
            user=None,
            activity_type='CREATED',
            description=f"Lead submitted via Web Form '{form.name}'."
        )

        if notes:
            LeadActivity.objects.create(
                lead=lead,
                user=None,
                activity_type='NOTE_ADDED',
                description=f"Form Submission Notes: {notes}"
            )

        # Round Robin routing via Celery background task
        assigned_user_name = "Unassigned"
        if form.assignment_mode == 'ROUND_ROBIN':
            from .tasks import assign_lead_round_robin_task
            assign_lead_round_robin_task.delay(lead.id)
            assigned_user_name = "Routing in progress (Celery)..."

        serializer = LeadSerializer(lead)
        return Response({
            'success': True,
            'lead': serializer.data,
            'assigned_to': assigned_user_name
        }, status=status.HTTP_201_CREATED)


# Task ViewSet
class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Task.objects.none()
        if user.profile.role == 'ADMIN':
            return Task.objects.all().order_by('due_date')
        if user.profile.role == 'LEADER':
            led_teams = user.led_teams.all()
            member_ids = User.objects.filter(sales_teams__in=led_teams).values_list('id', flat=True)
            return Task.objects.filter(Q(assigned_to=user) | Q(created_by=user) | Q(assigned_to_id__in=member_ids)).order_by('due_date')
        return Task.objects.filter(Q(assigned_to=user) | Q(created_by=user)).order_by('due_date')

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)
        if task.lead:
            LeadActivity.objects.create(
                lead=task.lead,
                user=self.request.user,
                activity_type='TASK_CREATED',
                description=f"Task '{task.title}' created and assigned to {task.assigned_to.username}."
            )

    def perform_update(self, serializer):
        task = self.get_object()
        old_status = task.status
        updated_task = serializer.save()

        if old_status != updated_task.status and updated_task.lead:
            LeadActivity.objects.create(
                lead=updated_task.lead,
                user=self.request.user,
                activity_type='TASK_COMPLETED' if updated_task.status == 'COMPLETED' else 'TASK_REOPENED',
                description=f"Task '{updated_task.title}' marked as {updated_task.status}."
            )


# FollowUp ViewSet
class FollowUpViewSet(viewsets.ModelViewSet):
    serializer_class = FollowUpSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return FollowUp.objects.none()
        if user.profile.role == 'ADMIN':
            return FollowUp.objects.all().order_by('scheduled_time')
        if user.profile.role == 'LEADER':
            led_teams = user.led_teams.all()
            member_ids = User.objects.filter(sales_teams__in=led_teams).values_list('id', flat=True)
            return FollowUp.objects.filter(Q(lead__owner=user) | Q(lead__owner_id__in=member_ids)).order_by('scheduled_time')
        return FollowUp.objects.filter(lead__owner=user).order_by('scheduled_time')

    def perform_create(self, serializer):
        followup = serializer.save(created_by=self.request.user)
        LeadActivity.objects.create(
            lead=followup.lead,
            user=self.request.user,
            activity_type='FOLLOW_UP_SCHEDULED',
            description=f"Follow-up scheduled for {followup.scheduled_time.strftime('%Y-%m-%d %H:%M')}."
        )

    def perform_update(self, serializer):
        followup = self.get_object()
        old_completed = followup.completed
        updated = serializer.save()
        if old_completed != updated.completed:
            LeadActivity.objects.create(
                lead=updated.lead,
                user=self.request.user,
                activity_type='FOLLOW_UP_COMPLETED' if updated.completed else 'FOLLOW_UP_REOPENED',
                description=f"Follow-up scheduled for {updated.scheduled_time} marked as {'completed' if updated.completed else 'pending'}."
            )


# Commission ViewSet
class CommissionViewSet(viewsets.ModelViewSet):
    serializer_class = CommissionSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Commission.objects.none()
        if user.profile.role == 'ADMIN':
            return Commission.objects.all().order_by('-calculated_at')
        if user.profile.role == 'LEADER':
            led_teams = user.led_teams.all()
            member_ids = User.objects.filter(sales_teams__in=led_teams).values_list('id', flat=True)
            return Commission.objects.filter(Q(agent=user) | Q(agent_id__in=member_ids)).order_by('-calculated_at')
        return Commission.objects.filter(agent=user).order_by('-calculated_at')

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrLeaderUserRole])
    def approve(self, request, pk=None):
        comm = self.get_object()
        comm.status = 'APPROVED'
        comm.approved_by = request.user
        comm.approved_at = timezone.now()
        comm.save()
        LeadActivity.objects.create(
            lead=comm.lead,
            user=request.user,
            activity_type='COMMISSION_APPROVED',
            description=f"Commission of ${comm.amount:.2f} approved for {comm.agent.username}."
        )
        return Response(CommissionSerializer(comm).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def pay(self, request, pk=None):
        comm = self.get_object()
        comm.status = 'PAID'
        comm.save()
        LeadActivity.objects.create(
            lead=comm.lead,
            user=request.user,
            activity_type='COMMISSION_PAID',
            description=f"Commission of ${comm.amount:.2f} paid to {comm.agent.username}."
        )
        return Response(CommissionSerializer(comm).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrLeaderUserRole])
    def reject(self, request, pk=None):
        comm = self.get_object()
        comm.status = 'REJECTED'
        comm.save()
        LeadActivity.objects.create(
            lead=comm.lead,
            user=request.user,
            activity_type='COMMISSION_REJECTED',
            description=f"Commission of ${comm.amount:.2f} for {comm.agent.username} was rejected."
        )
        return Response(CommissionSerializer(comm).data)


# Dashboard Views
class DashboardStatsView(APIView):
    def get(self, request):
        user = request.user
        role = user.profile.role

        if role == 'ADMIN':
            leads_qs = Lead.objects.all()
            tasks_qs = Task.objects.all()
            commissions_qs = Commission.objects.all()
            followups_qs = FollowUp.objects.all()
        elif role == 'LEADER':
            led_teams = user.led_teams.all()
            member_ids = User.objects.filter(sales_teams__in=led_teams).values_list('id', flat=True)
            leads_qs = Lead.objects.filter(Q(owner=user) | Q(owner_id__in=member_ids) | Q(owner__isnull=True))
            tasks_qs = Task.objects.filter(Q(assigned_to=user) | Q(assigned_to_id__in=member_ids))
            commissions_qs = Commission.objects.filter(Q(agent=user) | Q(agent_id__in=member_ids))
            followups_qs = FollowUp.objects.filter(Q(lead__owner=user) | Q(lead__owner_id__in=member_ids))
        else:
            leads_qs = Lead.objects.filter(owner=user)
            tasks_qs = Task.objects.filter(assigned_to=user)
            commissions_qs = Commission.objects.filter(agent=user)
            followups_qs = FollowUp.objects.filter(lead__owner=user)

        total_leads = leads_qs.count()
        pending_followups = followups_qs.filter(completed=False).count()
        earned_commissions = commissions_qs.filter(status__in=['APPROVED', 'PAID']).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        won_leads = leads_qs.filter(status='WON').count()
        conversion_rate = (won_leads / total_leads * 100) if total_leads > 0 else 0.0

        status_breakdown = leads_qs.values('status').annotate(count=Count('id'))
        status_map = {item['status']: item['count'] for item in status_breakdown}
        for s, _ in Lead.STATUS_CHOICES:
            if s not in status_map:
                status_map[s] = 0

        source_breakdown = leads_qs.values('source').annotate(count=Count('id')).order_by('-count')[:5]
        pipeline_value = leads_qs.exclude(status__in=['LOST', 'WON']).aggregate(total=Sum('value'))['total'] or Decimal('0.00')

        return Response({
            'totalLeads': total_leads,
            'pendingFollowups': pending_followups,
            'earnedCommissions': float(earned_commissions),
            'conversionRate': round(conversion_rate, 2),
            'pipelineValue': float(pipeline_value),
            'statusBreakdown': status_map,
            'sourceBreakdown': {item['source']: item['count'] for item in source_breakdown}
        })


class DashboardChartsView(APIView):
    def get(self, request):
        user = request.user
        role = user.profile.role

        if role == 'ADMIN':
            leads_qs = Lead.objects.all()
        elif role == 'LEADER':
            led_teams = user.led_teams.all()
            member_ids = User.objects.filter(sales_teams__in=led_teams).values_list('id', flat=True)
            leads_qs = Lead.objects.filter(Q(owner=user) | Q(owner_id__in=member_ids) | Q(owner__isnull=True))
        else:
            leads_qs = Lead.objects.filter(owner=user)

        end_date = timezone.now().date()
        start_date = end_date - datetime.timedelta(days=14)

        daily_leads = leads_qs.filter(
            created_at__date__gte=start_date
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')

        daily_map = {item['date'].strftime('%Y-%m-%d'): item['count'] for item in daily_leads if item['date']}
        leads_timeline = []
        curr = start_date
        while curr <= end_date:
            date_str = curr.strftime('%Y-%m-%d')
            leads_timeline.append({
                'date': curr.strftime('%b %d'),
                'count': daily_map.get(date_str, 0)
            })
            curr += datetime.timedelta(days=1)

        leaderboard = []
        if role in ['ADMIN', 'LEADER']:
            if role == 'ADMIN':
                agents = User.objects.filter(profile__role='AGENT', is_active=True)
            else:
                led_teams = user.led_teams.all()
                agents = User.objects.filter(sales_teams__in=led_teams, profile__role='AGENT', is_active=True).distinct()
            
            for agent in agents:
                agent_leads = Lead.objects.filter(owner=agent)
                won_count = agent_leads.filter(status='WON').count()
                total_value = agent_leads.filter(status='WON').aggregate(total=Sum('value'))['total'] or Decimal('0.00')
                leaderboard.append({
                    'agent': f"{agent.first_name} {agent.last_name}".strip() or agent.username,
                    'username': agent.username,
                    'wonLeads': won_count,
                    'revenue': float(total_value)
                })
            leaderboard = sorted(leaderboard, key=lambda x: x['revenue'], reverse=True)[:5]

        monthly_rev = []
        six_months_ago = timezone.now().date() - datetime.timedelta(days=180)
        
        monthly_leads = leads_qs.filter(
            status='WON',
            updated_at__date__gte=six_months_ago
        ).values('updated_at__year', 'updated_at__month').annotate(
            revenue=Sum('value')
        ).order_by('updated_at__year', 'updated_at__month')

        for item in monthly_leads:
            year = item['updated_at__year']
            month = item['updated_at__month']
            dt = datetime.date(year, month, 1)
            monthly_rev.append({
                'month': dt.strftime('%b %Y'),
                'revenue': float(item['revenue'] or 0.0)
            })

        return Response({
            'leadsTimeline': leads_timeline,
            'leaderboard': leaderboard,
            'monthlyRevenue': monthly_rev
        })
