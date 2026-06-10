from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, SalesTeam, LeadForm, Lead, LeadActivity, FollowUp, FollowUpHistory, Task,
    Commission, Notification, ImportHistory, ImportLog, ImportMappingTemplate, ExportHistory,
    CallLog, LeadNote, LeadEmail, TaskComment, TaskHistory, AuditLog
)

class UserProfileSerializer(serializers.ModelSerializer):
    effective_commission_rate = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )

    class Meta:
        model = UserProfile
        fields = ['role', 'commission_rate', 'effective_commission_rate']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'full_name', 'is_active']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username


class SalesTeamSerializer(serializers.ModelSerializer):
    leader_details = UserSerializer(source='leader', read_only=True)
    members_details = UserSerializer(source='members', many=True, read_only=True)

    class Meta:
        model = SalesTeam
        fields = ['id', 'name', 'description', 'leader', 'leader_details', 'members', 'members_details', 'created_at']


class LeadFormSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = LeadForm
        fields = [
            'id', 'name', 'description', 'assignment_mode', 'is_active',
            'source_name', 'submission_count',
            'form_fields', 'multi_step_enabled', 'thank_you_mode', 'thank_you_message', 'thank_you_redirect_url',
            'created_at', 'created_by', 'created_by_name'
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name if name else obj.created_by.username
        return "System"

    def get_submission_count(self, obj):
        if hasattr(obj, 'submission_count'):
            return obj.submission_count
        return obj.leads.count()


class LeadSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    form_details = LeadFormSerializer(source='form', read_only=True)
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            'id', 'name', 'email', 'phone', 'company', 'status',
            'source', 'value', 'owner', 'owner_details', 'owner_name',
            'form', 'form_details', 'created_at', 'updated_at'
        ]

    def get_owner_name(self, obj):
        if obj.owner:
            name = f"{obj.owner.first_name} {obj.owner.last_name}".strip()
            return name if name else obj.owner.username
        return "Unassigned"


class LeadActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    lead_name = serializers.SerializerMethodField()

    class Meta:
        model = LeadActivity
        fields = ['id', 'lead', 'lead_name', 'user', 'user_name', 'activity_type', 'description', 'created_at']

    def get_lead_name(self, obj):
        return obj.lead.name if obj.lead else ''

    def get_user_name(self, obj):
        if obj.user:
            name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return name if name else obj.user.username
        return "System"


class FollowUpHistorySerializer(serializers.ModelSerializer):
    performed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = FollowUpHistory
        fields = ['id', 'followup', 'action', 'old_value', 'new_value', 'performed_by', 'performed_by_name', 'created_at']

    def get_performed_by_name(self, obj):
        if obj.performed_by:
            name = f"{obj.performed_by.first_name} {obj.performed_by.last_name}".strip()
            return name if name else obj.performed_by.username
        return 'System'


class FollowUpSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    completed_by_name = serializers.SerializerMethodField()
    lead_name = serializers.ReadOnlyField(source='lead.name')
    lead_phone = serializers.ReadOnlyField(source='lead.phone')
    lead_email = serializers.ReadOnlyField(source='lead.email')
    lead_source = serializers.ReadOnlyField(source='lead.source')
    assigned_agent_details = UserSerializer(source='assigned_agent', read_only=True)
    effective_status = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()

    class Meta:
        model = FollowUp
        fields = [
            'id', 'lead', 'lead_name', 'lead_phone', 'lead_email', 'lead_source',
            'scheduled_time', 'followup_type', 'priority', 'reminder_time', 'notes',
            'status', 'effective_status', 'days_overdue', 'completed',
            'completed_at', 'completed_by', 'completed_by_name',
            'created_by', 'created_by_name', 'assigned_agent', 'assigned_agent_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['completed_at', 'completed_by', 'created_by']

    def get_created_by_name(self, obj):
        name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return name if name else obj.created_by.username

    def get_completed_by_name(self, obj):
        if obj.completed_by:
            name = f"{obj.completed_by.first_name} {obj.completed_by.last_name}".strip()
            return name if name else obj.completed_by.username
        return ''

    def get_effective_status(self, obj):
        # COMPLETED / CANCELLED are persisted; UPCOMING / TODAY / OVERDUE derive from schedule
        if obj.status == 'COMPLETED' or obj.completed:
            return 'COMPLETED'
        if obj.status == 'CANCELLED':
            return 'CANCELLED'
        from django.utils import timezone
        now = timezone.now()
        local_scheduled = timezone.localtime(obj.scheduled_time)
        if obj.scheduled_time < now:
            return 'OVERDUE'
        if local_scheduled.date() == timezone.localtime(now).date():
            return 'TODAY'
        return 'UPCOMING'

    def get_days_overdue(self, obj):
        if obj.status != 'SCHEDULED' or obj.completed:
            return 0
        from django.utils import timezone
        now = timezone.now()
        if obj.scheduled_time >= now:
            return 0
        return (now - obj.scheduled_time).days


class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'comment', 'user', 'user_name', 'created_at']
        read_only_fields = ['user']

    def get_user_name(self, obj):
        name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return name if name else obj.user.username


class TaskHistorySerializer(serializers.ModelSerializer):
    performed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskHistory
        fields = ['id', 'task', 'action', 'old_value', 'new_value', 'performed_by', 'performed_by_name', 'created_at']

    def get_performed_by_name(self, obj):
        if obj.performed_by:
            name = f"{obj.performed_by.first_name} {obj.performed_by.last_name}".strip()
            return name if name else obj.performed_by.username
        return 'System'


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    completed_by_name = serializers.SerializerMethodField()
    lead_name = serializers.ReadOnlyField(source='lead.name')
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'lead', 'lead_name', 'title', 'description', 'task_type', 'priority',
            'due_date', 'reminder_time', 'notes',
            'assigned_to', 'assigned_to_details', 'status', 'is_overdue',
            'completed_at', 'completed_by', 'completed_by_name',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name if name else obj.created_by.username
        return "System"

    def get_completed_by_name(self, obj):
        if obj.completed_by:
            name = f"{obj.completed_by.first_name} {obj.completed_by.last_name}".strip()
            return name if name else obj.completed_by.username
        return ""

    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.status in ('COMPLETED', 'CANCELLED'):
            return False
        return bool(obj.due_date and obj.due_date < timezone.now())


class CommissionSerializer(serializers.ModelSerializer):
    agent_details = UserSerializer(source='agent', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    lead_name = serializers.ReadOnlyField(source='lead.name')
    lead_value = serializers.ReadOnlyField(source='lead.value')

    class Meta:
        model = Commission
        fields = [
            'id', 'lead', 'lead_name', 'lead_value', 'agent', 'agent_details',
            'amount', 'rate', 'status', 'calculated_at', 'approved_at',
            'approved_by', 'approved_by_name'
        ]

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            name = f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip()
            return name if name else obj.approved_by.username
        return ""


class NotificationSerializer(serializers.ModelSerializer):
    lead_name = serializers.SerializerMethodField()
    task_title = serializers.SerializerMethodField()
    commission_amount = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'is_read', 'is_archived', 'created_at',
            'lead', 'lead_name', 'task', 'task_title', 'commission', 'commission_amount'
        ]

    def get_lead_name(self, obj):
        return obj.lead.name if obj.lead else ''

    def get_task_title(self, obj):
        return obj.task.title if obj.task else ''

    def get_commission_amount(self, obj):
        return str(obj.commission.amount) if obj.commission else ''


class ImportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportLog
        fields = ['id', 'row_number', 'status', 'error_message', 'row_data', 'created_at']


class ImportHistorySerializer(serializers.ModelSerializer):
    imported_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ImportHistory
        fields = [
            'id', 'file_name', 'file_type', 'total_records', 'success_count',
            'failed_count', 'duplicate_count', 'imported_by', 'imported_by_name',
            'status', 'duplicate_strategy', 'column_mapping', 'created_at'
        ]

    def get_imported_by_name(self, obj):
        if obj.imported_by:
            name = f"{obj.imported_by.first_name} {obj.imported_by.last_name}".strip()
            return name if name else obj.imported_by.username
        return ''


class ImportHistoryDetailSerializer(ImportHistorySerializer):
    logs = ImportLogSerializer(many=True, read_only=True)

    class Meta(ImportHistorySerializer.Meta):
        fields = ImportHistorySerializer.Meta.fields + ['logs']


class ImportMappingTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportMappingTemplate
        fields = ['id', 'name', 'mapping', 'created_at']


class ExportHistorySerializer(serializers.ModelSerializer):
    exported_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ExportHistory
        fields = [
            'id', 'file_name', 'file_type', 'exported_by', 'exported_by_name',
            'total_records', 'filters_applied', 'status', 'created_at'
        ]

    def get_exported_by_name(self, obj):
        if obj.exported_by:
            name = f"{obj.exported_by.first_name} {obj.exported_by.last_name}".strip()
            return name if name else obj.exported_by.username
        return ''


class CallLogSerializer(serializers.ModelSerializer):
    lead_name = serializers.ReadOnlyField(source='lead.name')
    agent_name = serializers.SerializerMethodField()

    class Meta:
        model = CallLog
        fields = [
            'id', 'lead', 'lead_name', 'agent', 'agent_name', 'call_date', 'duration',
            'call_type', 'call_status', 'outcome', 'notes', 'created_at', 'updated_at'
        ]

    def get_agent_name(self, obj):
        name = f"{obj.agent.first_name} {obj.agent.last_name}".strip()
        return name if name else obj.agent.username


class LeadNoteSerializer(serializers.ModelSerializer):
    lead_name = serializers.ReadOnlyField(source='lead.name')
    created_by_name = serializers.SerializerMethodField()
    mention_user_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = LeadNote
        fields = [
            'id', 'lead', 'lead_name', 'title', 'content', 'is_pinned',
            'created_by', 'created_by_name', 'mention_user_ids', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by']

    def get_created_by_name(self, obj):
        name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return name if name else obj.created_by.username

    def create(self, validated_data):
        mention_ids = validated_data.pop('mention_user_ids', [])
        note = super().create(validated_data)
        if mention_ids:
            note.mentions.set(User.objects.filter(id__in=mention_ids))
        return note

    def update(self, instance, validated_data):
        mention_ids = validated_data.pop('mention_user_ids', None)
        note = super().update(instance, validated_data)
        if mention_ids is not None:
            note.mentions.set(User.objects.filter(id__in=mention_ids))
        return note


class LeadEmailSerializer(serializers.ModelSerializer):
    lead_name = serializers.ReadOnlyField(source='lead.name')

    class Meta:
        model = LeadEmail
        fields = [
            'id', 'lead', 'lead_name', 'subject', 'sender', 'recipient', 'status',
            'direction', 'content', 'attachments', 'sent_at', 'created_at', 'updated_at'
        ]


class AuditLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    module_display = serializers.CharField(source='get_module_display', read_only=True)
    device = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'role', 'module', 'module_display',
            'action', 'action_display', 'record_type', 'record_id', 'summary',
            'old_values', 'new_values', 'ip_address', 'user_agent', 'device',
            'created_at',
        ]

    def get_device(self, obj):
        from .audit import parse_device
        return parse_device(obj.user_agent)
