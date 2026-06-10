"""API views for the Audit Logs module: list, filter, paginate, stats, export."""
import io
from datetime import datetime

from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .audit import parse_device
from .models import AuditLog
from .serializers import AuditLogSerializer
from .reports_views import to_csv_bytes, to_xlsx_bytes, to_pdf_bytes


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'ADMIN'
        )


# System-change actions used by the "System Changes Today" widget.
SYSTEM_CHANGE_ACTIONS = {
    'LEAD_CREATED', 'LEAD_UPDATED', 'LEAD_DELETED', 'LEAD_ASSIGNED',
    'LEAD_STATUS_CHANGED', 'LEAD_CLAIMED', 'TASK_CREATED', 'TASK_UPDATED',
    'TASK_COMPLETED', 'TASK_DELETED', 'FOLLOWUP_SCHEDULED', 'FOLLOWUP_UPDATED',
    'FOLLOWUP_COMPLETED', 'TEAM_MEMBER_ADDED', 'TEAM_MEMBER_UPDATED',
    'ROLE_CHANGED', 'COMMISSION_UPDATED', 'IMPORT_PERFORMED', 'EXPORT_PERFORMED',
    'SETTINGS_UPDATED', 'PROFILE_UPDATED', 'PASSWORD_CHANGED',
    'FORM_CREATED', 'FORM_UPDATED', 'FORM_DELETED',
}


def filtered_logs(request):
    """Apply search and filters from query params to the AuditLog queryset."""
    qs = AuditLog.objects.select_related('user').all()
    params = request.query_params

    search = params.get('q') or params.get('search')
    if search:
        qs = qs.filter(
            Q(user_name__icontains=search)
            | Q(summary__icontains=search)
            | Q(record_type__icontains=search)
            | Q(record_id__icontains=search)
            | Q(ip_address__icontains=search)
        )

    if params.get('user'):
        qs = qs.filter(user_id=params['user'])
    if params.get('role'):
        qs = qs.filter(role=params['role'])
    if params.get('module'):
        qs = qs.filter(module=params['module'])
    if params.get('action'):
        qs = qs.filter(action=params['action'])

    date_from = params.get('dateFrom') or params.get('date_from')
    date_to = params.get('dateTo') or params.get('date_to')
    if date_from:
        qs = qs.filter(created_at__date__gte=date_from)
    if date_to:
        qs = qs.filter(created_at__date__lte=date_to)

    return qs.order_by('-created_at')


class AuditLogListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        qs = filtered_logs(request)
        total = qs.count()

        try:
            page = max(int(request.query_params.get('page', 1)), 1)
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = min(max(int(request.query_params.get('pageSize', 25)), 1), 200)
        except (TypeError, ValueError):
            page_size = 25

        start = (page - 1) * page_size
        end = start + page_size
        results = qs[start:end]
        serializer = AuditLogSerializer(results, many=True)
        return Response({
            'count': total,
            'page': page,
            'pageSize': page_size,
            'numPages': (total + page_size - 1) // page_size if page_size else 1,
            'results': serializer.data,
        })


class AuditLogWidgetsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        now = timezone.now()
        today = timezone.localtime(now).date()
        today_qs = AuditLog.objects.filter(created_at__date=today)

        recent = AuditLog.objects.select_related('user').all()[:10]

        return Response({
            'totalActivities': AuditLog.objects.count(),
            'userLoginsToday': today_qs.filter(action='USER_LOGIN').count(),
            'failedLoginsToday': today_qs.filter(action='LOGIN_FAILED').count(),
            'systemChangesToday': today_qs.filter(action__in=SYSTEM_CHANGE_ACTIONS).count(),
            'recentActivities': AuditLogSerializer(recent, many=True).data,
        })


class AuditLogFiltersView(APIView):
    """Distinct values to populate the advanced filter dropdowns."""
    permission_classes = [IsAdminRole]

    def get(self, request):
        users = (
            AuditLog.objects.filter(user__isnull=False)
            .values('user_id', 'user_name')
            .distinct()
            .order_by('user_name')
        )
        seen = {}
        for u in users:
            seen.setdefault(u['user_id'], u['user_name'])
        return Response({
            'users': [{'id': uid, 'name': name} for uid, name in seen.items()],
            'roles': [r for r in AuditLog.objects.values_list('role', flat=True).distinct() if r],
            'modules': [{'value': v, 'label': l} for v, l in AuditLog.MODULE_CHOICES],
            'actions': [{'value': v, 'label': l} for v, l in AuditLog.ACTION_CHOICES],
        })


def _flatten_changes(values):
    if not values:
        return ''
    return '; '.join(f"{k}={v}" for k, v in values.items())


class AuditLogExportView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        file_type = (request.data.get('fileType') or 'csv').lower()
        if file_type not in {'csv', 'xlsx', 'pdf'}:
            return Response({'error': 'Unsupported format'}, status=400)

        # Reuse the same filter logic, reading filters from the JSON body.
        class _Req:
            query_params = request.data.get('filters') or {}
        qs = filtered_logs(_Req())

        limit = 5000
        rows = []
        for log in qs[:limit]:
            rows.append({
                'Timestamp': timezone.localtime(log.created_at).strftime('%Y-%m-%d %H:%M:%S'),
                'User': log.user_name,
                'Role': log.role,
                'Module': log.get_module_display(),
                'Action': log.get_action_display(),
                'Record Type': log.record_type,
                'Record ID': log.record_id,
                'Summary': log.summary,
                'Old Values': _flatten_changes(log.old_values),
                'New Values': _flatten_changes(log.new_values),
                'IP Address': log.ip_address or '',
                'Device': parse_device(log.user_agent),
            })

        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        file_name = f'audit_logs_{timestamp}.{file_type}'

        try:
            if file_type == 'csv':
                content = to_csv_bytes(rows)
                content_type = 'text/csv'
            elif file_type == 'xlsx':
                content = to_xlsx_bytes(rows)
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            else:
                content = to_pdf_bytes(rows, 'Audit Logs')
                content_type = 'application/pdf'
        except ValueError as exc:
            return Response({'error': str(exc)}, status=400)

        response = HttpResponse(content, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response
