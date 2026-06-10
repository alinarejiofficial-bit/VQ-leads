from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Task, TaskComment, TaskHistory, LeadActivity
from .serializers import TaskCommentSerializer, TaskHistorySerializer


def record_task_history(task, action, old_value, new_value, user):
    TaskHistory.objects.create(
        task=task,
        action=action,
        old_value=str(old_value),
        new_value=str(new_value),
        performed_by=user,
    )


class TaskCommentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCommentSerializer

    def get_queryset(self):
        user = self.request.user
        task_id = self.request.query_params.get('task')
        qs = TaskComment.objects.select_related('user', 'task').all()
        if user.profile.role != 'ADMIN':
            qs = qs.filter(Q(task__assigned_to=user) | Q(task__created_by=user))
        if task_id:
            qs = qs.filter(task_id=task_id)
        return qs.order_by('created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TaskHistorySerializer

    def get_queryset(self):
        user = self.request.user
        task_id = self.request.query_params.get('task')
        qs = TaskHistory.objects.select_related('performed_by', 'task').all()
        if user.profile.role != 'ADMIN':
            qs = qs.filter(Q(task__assigned_to=user) | Q(task__created_by=user))
        if task_id:
            qs = qs.filter(task_id=task_id)
        return qs.order_by('-created_at')


class TaskWidgetStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        now = timezone.now()

        qs = Task.objects.all()
        if user.profile.role != 'ADMIN':
            qs = qs.filter(Q(assigned_to=user) | Q(created_by=user))

        total = qs.count()
        pending = qs.filter(status__in=['PENDING', 'IN_PROGRESS']).count()
        completed = qs.filter(status='COMPLETED').count()
        overdue = qs.filter(status__in=['PENDING', 'IN_PROGRESS'], due_date__lt=now).count()
        due_today = qs.filter(
            status__in=['PENDING', 'IN_PROGRESS'],
            due_date__date=today
        ).count()
        high_priority = qs.filter(
            status__in=['PENDING', 'IN_PROGRESS'],
            priority__in=['HIGH', 'URGENT']
        ).count()

        # Completed stats
        completed_today = qs.filter(status='COMPLETED', completed_at__date=today).count()
        completed_this_week = qs.filter(
            status='COMPLETED',
            completed_at__week=now.isocalendar()[1],
            completed_at__year=now.year
        ).count()
        completed_this_month = qs.filter(
            status='COMPLETED',
            completed_at__year=now.year,
            completed_at__month=now.month
        ).count()

        return Response({
            'totalTasks': total,
            'pendingTasks': pending,
            'completedTasks': completed,
            'overdueTasks': overdue,
            'tasksDueToday': due_today,
            'highPriorityTasks': high_priority,
            'completedToday': completed_today,
            'completedThisWeek': completed_this_week,
            'completedThisMonth': completed_this_month,
        })
