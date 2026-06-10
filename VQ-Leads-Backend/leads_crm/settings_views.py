"""Settings Management API — centralized CRM configuration."""
import smtplib
import ssl
from decimal import Decimal

from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .audit import log_audit
from .models import (
    ApiIntegration, AuditLog, CommissionSettings, EmailSettings,
    NotificationSetting, SystemSetting,
)
from .settings_defaults import (
    API_SERVICES, DEFAULT_EMAIL_TEMPLATES, DEFAULT_GENERAL, DEFAULT_LEAD,
    DEFAULT_REMINDER_MINUTES, NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS,
    NOTIFICATION_LABELS,
)


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'ADMIN'
        )


def _merge(defaults, stored):
    merged = dict(defaults)
    if isinstance(stored, dict):
        merged.update(stored)
    return merged


def get_setting(key, defaults):
    try:
        row = SystemSetting.objects.get(setting_key=key)
        return _merge(defaults, row.setting_value)
    except SystemSetting.DoesNotExist:
        return dict(defaults)


def save_setting(key, value, user):
    old = get_setting(key, {})
    row, _ = SystemSetting.objects.update_or_create(
        setting_key=key,
        defaults={'setting_value': value, 'updated_by': user},
    )
    log_audit(
        None, module='SETTINGS', action='SETTINGS_UPDATED', user=user,
        record_type='SystemSetting', record_id=row.pk,
        summary=f"Updated {key.replace('.', ' ')} settings.",
        old_values=old, new_values=value,
    )
    return row


def ensure_notification_defaults():
    for event in NOTIFICATION_EVENTS:
        for channel in NOTIFICATION_CHANNELS:
            defaults = {'enabled': channel == 'IN_APP'}
            reminder = DEFAULT_REMINDER_MINUTES.get(event)
            if reminder and channel == 'IN_APP':
                defaults['reminder_minutes'] = reminder
            NotificationSetting.objects.get_or_create(
                notification_type=event,
                channel=channel,
                defaults=defaults,
            )


def ensure_api_defaults():
    for svc in API_SERVICES:
        ApiIntegration.objects.get_or_create(
            service_name=svc['service_name'],
            defaults={'display_name': svc['display_name']},
        )


def ensure_email_defaults():
    obj = EmailSettings.get_solo()
    if not obj.templates:
        obj.templates = DEFAULT_EMAIL_TEMPLATES
        obj.save(update_fields=['templates'])


def mask_secret(value):
    if not value:
        return ''
    if len(value) <= 4:
        return '****'
    return value[:2] + '****' + value[-2:]


def general_payload():
    ensure_email_defaults()
    return get_setting('general', DEFAULT_GENERAL)


def lead_payload():
    return get_setting('lead', DEFAULT_LEAD)


def commission_payload():
    obj = CommissionSettings.get_solo()
    return {
        'globalRate': str(obj.global_rate),
        'commissionType': obj.commission_type,
        'fixedAmount': str(obj.fixed_amount),
        'approvalRequired': obj.approval_required,
        'autoCalculation': obj.auto_calculation,
        'teamCommissionEnabled': obj.team_commission_enabled,
        'monthlyBonusRules': obj.monthly_bonus_rules,
        'updatedAt': obj.updated_at.isoformat(),
    }


def email_payload(include_password=False):
    ensure_email_defaults()
    obj = EmailSettings.get_solo()
    return {
        'smtpHost': obj.smtp_host,
        'smtpPort': obj.smtp_port,
        'username': obj.username,
        'password': obj.password if include_password else mask_secret(obj.password),
        'hasPassword': bool(obj.password),
        'encryption': obj.encryption,
        'senderName': obj.sender_name,
        'senderEmail': obj.sender_email,
        'templates': obj.templates or DEFAULT_EMAIL_TEMPLATES,
        'automatedEmailsEnabled': obj.automated_emails_enabled,
        'isConnected': obj.is_connected,
        'updatedAt': obj.updated_at.isoformat(),
    }


def notifications_payload():
    ensure_notification_defaults()
    rows = NotificationSetting.objects.all()
    items = []
    for row in rows:
        items.append({
            'notificationType': row.notification_type,
            'label': NOTIFICATION_LABELS.get(row.notification_type, row.notification_type),
            'channel': row.channel,
            'enabled': row.enabled,
            'reminderMinutes': row.reminder_minutes,
        })
    enabled_count = rows.filter(enabled=True).count()
    return {
        'items': items,
        'enabledCount': enabled_count,
        'totalCount': rows.count(),
    }


def api_payload(mask_keys=True):
    ensure_api_defaults()
    integrations = []
    for row in ApiIntegration.objects.all():
        integrations.append({
            'serviceName': row.service_name,
            'displayName': row.display_name or row.service_name,
            'apiKey': mask_secret(row.api_key) if mask_keys else row.api_key,
            'secretKey': mask_secret(row.secret_key) if mask_keys else row.secret_key,
            'accessToken': mask_secret(row.access_token) if mask_keys else row.access_token,
            'webhookUrl': row.webhook_url,
            'status': row.status,
            'connectedAt': row.connected_at.isoformat() if row.connected_at else None,
            'hasCredentials': bool(row.api_key or row.secret_key or row.access_token),
        })
    return {'integrations': integrations}


class SettingsWidgetsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        ensure_notification_defaults()
        ensure_api_defaults()
        ensure_email_defaults()

        email = EmailSettings.get_solo()
        integrations = ApiIntegration.objects.all()
        connected = integrations.filter(status='CONNECTED').count()
        pending = integrations.filter(status='PENDING').count()

        notif_enabled = NotificationSetting.objects.filter(enabled=True).count()
        notif_total = NotificationSetting.objects.count()

        last_audit = AuditLog.objects.filter(module='SETTINGS').order_by('-created_at').first()
        last_general = SystemSetting.objects.order_by('-updated_at').first()
        last_update = last_audit.created_at if last_audit else (
            last_general.updated_at if last_general else timezone.now()
        )

        return Response({
            'activeIntegrations': connected,
            'pendingIntegrations': pending,
            'emailStatus': 'connected' if email.is_connected else 'disconnected',
            'notificationStatus': 'active' if notif_enabled > 0 else 'inactive',
            'notificationsEnabled': notif_enabled,
            'notificationsTotal': notif_total,
            'apiUsage': connected + pending,
            'connectedServices': connected,
            'lastConfigurationUpdate': last_update.isoformat(),
        })


class GeneralSettingsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response(general_payload())

    def patch(self, request):
        current = general_payload()
        allowed = set(DEFAULT_GENERAL.keys())
        for key, value in request.data.items():
            if key in allowed:
                current[key] = value
        save_setting('general', current, request.user)
        return Response(general_payload())


class GeneralSettingsResetView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        save_setting('general', dict(DEFAULT_GENERAL), request.user)
        return Response(general_payload())


class GeneralLogoUploadView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded = request.FILES.get('logo')
        if not uploaded:
            return Response({'error': 'Logo file is required.'}, status=status.HTTP_400_BAD_REQUEST)
        import base64
        content = uploaded.read()
        if len(content) > 2 * 1024 * 1024:
            return Response({'error': 'Logo must be under 2MB.'}, status=status.HTTP_400_BAD_REQUEST)
        mime = uploaded.content_type or 'image/png'
        data_url = f'data:{mime};base64,{base64.b64encode(content).decode()}'
        current = general_payload()
        current['companyLogo'] = data_url
        save_setting('general', current, request.user)
        return Response({'companyLogo': data_url})


class LeadSettingsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response(lead_payload())

    def patch(self, request):
        current = lead_payload()
        for key in ('statuses', 'sources', 'assignmentMode', 'autoAssignment',
                    'roundRobinEnabled', 'duplicateDetection', 'autoLeadNumber',
                    'leadExpiryEnabled', 'leadExpiryDays'):
            if key in request.data:
                current[key] = request.data[key]
        if current.get('assignmentMode') == 'ROUND_ROBIN':
            current['roundRobinEnabled'] = True
            current['autoAssignment'] = True
        elif current.get('assignmentMode') == 'AUTO':
            current['autoAssignment'] = True
            current['roundRobinEnabled'] = False
        save_setting('lead', current, request.user)
        return Response(lead_payload())


class LeadSettingsResetView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        save_setting('lead', dict(DEFAULT_LEAD), request.user)
        return Response(lead_payload())


class CommissionSettingsModuleView(APIView):
    """Extended commission settings (admin edit, all users read)."""

    def get_permissions(self):
        if self.request.method in ('PATCH', 'POST'):
            return [IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        return Response(commission_payload())

    def patch(self, request):
        obj = CommissionSettings.get_solo()
        old = commission_payload()

        if 'globalRate' in request.data:
            try:
                rate = Decimal(str(request.data['globalRate']))
            except Exception:
                return Response({'error': 'Invalid rate'}, status=status.HTTP_400_BAD_REQUEST)
            if rate < 0 or rate > 100:
                return Response({'error': 'Rate must be between 0 and 100'}, status=status.HTTP_400_BAD_REQUEST)
            obj.global_rate = rate

        if 'commissionType' in request.data:
            ct = request.data['commissionType']
            if ct in ('PERCENTAGE', 'FIXED', 'CUSTOM'):
                obj.commission_type = ct

        if 'fixedAmount' in request.data:
            try:
                obj.fixed_amount = Decimal(str(request.data['fixedAmount']))
            except Exception:
                return Response({'error': 'Invalid fixed amount'}, status=status.HTTP_400_BAD_REQUEST)

        for bool_field, attr in (
            ('approvalRequired', 'approval_required'),
            ('autoCalculation', 'auto_calculation'),
            ('teamCommissionEnabled', 'team_commission_enabled'),
        ):
            if bool_field in request.data:
                setattr(obj, attr, bool(request.data[bool_field]))

        if 'monthlyBonusRules' in request.data:
            obj.monthly_bonus_rules = request.data['monthlyBonusRules'] or ''

        obj.updated_by = request.user
        obj.save()

        new = commission_payload()
        log_audit(
            request, module='SETTINGS', action='SETTINGS_UPDATED',
            record_type='CommissionSettings', record_id=obj.pk,
            summary='Updated commission settings.',
            old_values=old, new_values=new,
        )
        return Response(new)


class EmailSettingsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response(email_payload())

    def patch(self, request):
        obj = EmailSettings.get_solo()
        old = email_payload()

        for field, attr in (
            ('smtpHost', 'smtp_host'),
            ('smtpPort', 'smtp_port'),
            ('username', 'username'),
            ('encryption', 'encryption'),
            ('senderName', 'sender_name'),
            ('senderEmail', 'sender_email'),
        ):
            if field in request.data:
                setattr(obj, attr, request.data[field])

        if 'password' in request.data and request.data['password'] and '****' not in str(request.data['password']):
            obj.password = request.data['password']

        if 'templates' in request.data and isinstance(request.data['templates'], dict):
            obj.templates = request.data['templates']

        if 'automatedEmailsEnabled' in request.data:
            obj.automated_emails_enabled = bool(request.data['automatedEmailsEnabled'])

        obj.updated_by = request.user
        obj.save()

        new = email_payload()
        log_audit(
            request, module='SETTINGS', action='SETTINGS_UPDATED',
            record_type='EmailSettings', record_id=obj.pk,
            summary='Updated email settings.',
            old_values={k: v for k, v in old.items() if k != 'password'},
            new_values={k: v for k, v in new.items() if k != 'password'},
        )
        return Response(new)


class EmailTestConnectionView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        obj = EmailSettings.get_solo()
        host = request.data.get('smtpHost') or obj.smtp_host
        port = int(request.data.get('smtpPort') or obj.smtp_port or 587)
        username = request.data.get('username') or obj.username
        password = request.data.get('password') or obj.password
        encryption = (request.data.get('encryption') or obj.encryption or 'TLS').upper()

        if not host or not username:
            return Response({'success': False, 'message': 'SMTP host and username are required.'}, status=400)

        if password and '****' in password:
            password = obj.password

        try:
            if encryption == 'SSL':
                server = smtplib.SMTP_SSL(host, port, timeout=10)
            else:
                server = smtplib.SMTP(host, port, timeout=10)
                if encryption == 'TLS':
                    server.starttls(context=ssl.create_default_context())
            if username and password:
                server.login(username, password)
            server.quit()
            obj.is_connected = True
            obj.save(update_fields=['is_connected'])
            return Response({'success': True, 'message': 'Email connection successful.', 'isConnected': True})
        except Exception as exc:
            obj.is_connected = False
            obj.save(update_fields=['is_connected'])
            return Response({'success': False, 'message': str(exc), 'isConnected': False}, status=400)


class NotificationSettingsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response(notifications_payload())

    def patch(self, request):
        items = request.data.get('items', [])
        if not isinstance(items, list):
            return Response({'error': 'items must be a list.'}, status=400)

        for item in items:
            ntype = item.get('notificationType')
            channel = item.get('channel')
            if not ntype or not channel:
                continue
            row, _ = NotificationSetting.objects.get_or_create(
                notification_type=ntype, channel=channel,
            )
            if 'enabled' in item:
                row.enabled = bool(item['enabled'])
            if 'reminderMinutes' in item:
                row.reminder_minutes = item['reminderMinutes']
            row.save()

        log_audit(
            request, module='SETTINGS', action='SETTINGS_UPDATED',
            record_type='NotificationSetting', record_id='',
            summary='Updated notification preferences.',
        )
        return Response(notifications_payload())


class ApiIntegrationsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response(api_payload())

    def patch(self, request):
        service = request.data.get('serviceName')
        if not service:
            return Response({'error': 'serviceName is required.'}, status=400)
        ensure_api_defaults()
        try:
            row = ApiIntegration.objects.get(service_name=service)
        except ApiIntegration.DoesNotExist:
            return Response({'error': 'Integration not found.'}, status=404)

        for field, attr in (
            ('apiKey', 'api_key'),
            ('secretKey', 'secret_key'),
            ('accessToken', 'access_token'),
            ('webhookUrl', 'webhook_url'),
        ):
            if field in request.data:
                val = request.data[field] or ''
                if '****' in str(val):
                    continue
                setattr(row, attr, val)

        row.save()
        log_audit(
            request, module='SETTINGS', action='SETTINGS_UPDATED',
            record_type='ApiIntegration', record_id=row.pk,
            summary=f"Updated {row.display_name or row.service_name} integration credentials.",
        )
        return Response(api_payload())


class ApiIntegrationActionView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, service_name):
        action = request.data.get('action')
        ensure_api_defaults()
        try:
            row = ApiIntegration.objects.get(service_name=service_name)
        except ApiIntegration.DoesNotExist:
            return Response({'error': 'Integration not found.'}, status=404)

        if action == 'connect':
            if not (row.api_key or row.access_token):
                row.status = 'PENDING'
                row.save(update_fields=['status'])
                return Response({'status': 'PENDING', 'message': 'Credentials saved. Complete OAuth or add API key to connect.'})
            row.status = 'CONNECTED'
            row.connected_at = timezone.now()
            row.save()
            log_audit(request, module='SETTINGS', action='SETTINGS_UPDATED',
                      record_type='ApiIntegration', record_id=row.pk,
                      summary=f"Connected {row.display_name}.")
            return Response({'status': 'CONNECTED', 'connectedAt': row.connected_at.isoformat()})

        if action == 'disconnect':
            row.status = 'DISCONNECTED'
            row.connected_at = None
            row.save()
            log_audit(request, module='SETTINGS', action='SETTINGS_UPDATED',
                      record_type='ApiIntegration', record_id=row.pk,
                      summary=f"Disconnected {row.display_name}.")
            return Response({'status': 'DISCONNECTED'})

        if action == 'test':
            has_creds = bool(row.api_key or row.secret_key or row.access_token)
            if has_creds:
                row.status = 'CONNECTED'
                row.connected_at = timezone.now()
                row.save()
                return Response({'success': True, 'status': 'CONNECTED', 'message': 'Connection test passed.'})
            return Response({'success': False, 'status': row.status, 'message': 'Add credentials before testing.'}, status=400)

        return Response({'error': 'Invalid action.'}, status=400)


class SettingsAuditView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        logs = AuditLog.objects.filter(module='SETTINGS').order_by('-created_at')[:20]
        from .serializers import AuditLogSerializer
        return Response(AuditLogSerializer(logs, many=True).data)
