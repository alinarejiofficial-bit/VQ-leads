from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, SalesTeam, LeadForm, Lead, LeadActivity, FollowUp, Task,
    Commission, Notification, ImportHistory, ImportLog, ImportMappingTemplate, ExportHistory
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

    class Meta:
        model = LeadForm
        fields = ['id', 'name', 'description', 'assignment_mode', 'is_active', 'source_name', 'created_at', 'created_by', 'created_by_name']

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name if name else obj.created_by.username
        return "System"


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


class FollowUpSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    lead_name = serializers.ReadOnlyField(source='lead.name')

    class Meta:
        model = FollowUp
        fields = ['id', 'lead', 'lead_name', 'scheduled_time', 'notes', 'completed', 'created_by', 'created_by_name', 'created_at']

    def get_created_by_name(self, obj):
        name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return name if name else obj.created_by.username


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    lead_name = serializers.ReadOnlyField(source='lead.name')

    class Meta:
        model = Task
        fields = [
            'id', 'lead', 'lead_name', 'title', 'description', 'due_date',
            'assigned_to', 'assigned_to_details', 'status', 'created_by',
            'created_by_name', 'created_at'
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name if name else obj.created_by.username
        return "System"


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
