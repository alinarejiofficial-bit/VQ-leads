from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, SalesTeam, LeadForm, Lead, LeadActivity, FollowUp, Task, Commission

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'commission_rate']


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
