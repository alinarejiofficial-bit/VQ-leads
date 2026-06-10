from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal

class CommissionSettings(models.Model):
    """Singleton storing the global commission configuration."""
    global_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('2.00')
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Commission Settings'
        verbose_name_plural = 'Commission Settings'

    def __str__(self):
        return f"Global commission rate: {self.global_rate}%"

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(
        max_length=10,
        choices=[('ADMIN', 'Admin'), ('LEADER', 'Team Leader'), ('AGENT', 'Agent')],
        default='AGENT'
    )
    # Null means "use the global commission rate"; a value is a user-specific override.
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        default=None
    )

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    @property
    def effective_commission_rate(self):
        if self.commission_rate is not None:
            return self.commission_rate
        return CommissionSettings.get_solo().global_rate

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


class SalesTeam(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    leader = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_teams'
    )
    members = models.ManyToManyField(User, related_name='sales_teams', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class LeadForm(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    assignment_mode = models.CharField(
        max_length=20,
        choices=[('MANUAL', 'Manual'), ('ROUND_ROBIN', 'Round Robin')],
        default='MANUAL'
    )
    is_active = models.BooleanField(default=True)
    source_name = models.CharField(max_length=100, default='Website Form')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_forms'
    )

    def __str__(self):
        return self.name


class Lead(models.Model):
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('CONTACTED', 'Contacted'),
        ('IN_PROGRESS', 'In Progress'),
        ('QUALIFIED', 'Qualified'),
        ('LOST', 'Lost'),
        ('WON', 'Won'),
    ]

    name = models.CharField(max_length=150)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    company = models.CharField(max_length=150, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    source = models.CharField(max_length=100, default='Direct')
    value = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leads'
    )
    form = models.ForeignKey(
        LeadForm,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leads'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.status}"


class LeadActivity(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    activity_type = models.CharField(max_length=50)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lead.name}: {self.activity_type} at {self.created_at}"


class CallLog(models.Model):
    CALL_TYPE_CHOICES = [('INCOMING', 'Incoming'), ('OUTGOING', 'Outgoing')]
    CALL_STATUS_CHOICES = [
        ('ANSWERED', 'Answered'),
        ('MISSED', 'Missed'),
        ('BUSY', 'Busy'),
        ('NO_RESPONSE', 'No Response'),
    ]
    OUTCOME_CHOICES = [
        ('INTERESTED', 'Interested'),
        ('NOT_INTERESTED', 'Not Interested'),
        ('CALLBACK_REQUESTED', 'Callback Requested'),
        ('CONVERTED', 'Converted'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='call_logs')
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='call_logs')
    call_date = models.DateTimeField()
    duration = models.PositiveIntegerField(default=0, help_text='Duration in seconds')
    call_type = models.CharField(max_length=20, choices=CALL_TYPE_CHOICES, default='OUTGOING')
    call_status = models.CharField(max_length=20, choices=CALL_STATUS_CHOICES, default='ANSWERED')
    outcome = models.CharField(max_length=30, choices=OUTCOME_CHOICES, blank=True, default='')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.lead.name} - {self.agent.username} ({self.call_date})"


class LeadNote(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='lead_notes')
    title = models.CharField(max_length=150)
    content = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lead_notes')
    is_pinned = models.BooleanField(default=False)
    mentions = models.ManyToManyField(User, blank=True, related_name='mentioned_in_notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.lead.name} - {self.title}"


class LeadEmail(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('OPENED', 'Opened'),
        ('FAILED', 'Failed'),
    ]
    DIRECTION_CHOICES = [('SENT', 'Sent'), ('RECEIVED', 'Received')]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='lead_emails')
    subject = models.CharField(max_length=200)
    sender = models.EmailField()
    recipient = models.EmailField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SENT')
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES, default='SENT')
    content = models.TextField()
    attachments = models.TextField(blank=True, help_text='Comma separated attachment names/urls')
    sent_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.lead.name} - {self.subject}"


class FollowUp(models.Model):
    FOLLOWUP_TYPE_CHOICES = [
        ('CALL', 'Call'),
        ('MEETING', 'Meeting'),
        ('EMAIL', 'Email'),
        ('WHATSAPP', 'WhatsApp'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='followups')
    scheduled_time = models.DateTimeField()
    followup_type = models.CharField(max_length=20, choices=FOLLOWUP_TYPE_CHOICES, default='CALL')
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    assigned_agent = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_followups'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Follow-up for {self.lead.name} at {self.scheduled_time}"


class Task(models.Model):
    TASK_TYPE_CHOICES = [
        ('CALL_LEAD', 'Call Lead'),
        ('FOLLOW_UP', 'Follow-Up'),
        ('MEETING', 'Meeting'),
        ('SITE_VISIT', 'Site Visit'),
        ('SEND_EMAIL', 'Send Email'),
        ('SEND_QUOTATION', 'Send Quotation'),
        ('DOCUMENT_COLLECTION', 'Document Collection'),
        ('PAYMENT_FOLLOW_UP', 'Payment Follow-Up'),
        ('CUSTOM', 'Custom Task'),
    ]
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('OVERDUE', 'Overdue'),
    ]

    lead = models.ForeignKey(
        Lead,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    task_type = models.CharField(max_length=30, choices=TASK_TYPE_CHOICES, default='CUSTOM')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    due_date = models.DateTimeField(null=True, blank=True)
    reminder_time = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='assigned_tasks'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_tasks'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    comment = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_comments')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment on {self.task.title} by {self.user.username}"


class TaskHistory(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=100)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='task_history')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} on {self.task.title}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('NEW_LEAD_AVAILABLE', 'New Lead Available'),
        ('LEAD_ASSIGNED', 'Lead Assigned'),
        ('LEAD_CLAIMED', 'Lead Claimed'),
        ('TASK_ASSIGNED', 'Task Assigned'),
        ('FOLLOWUP_REMINDER', 'Follow-up Reminder'),
        ('CONVERSION_APPROVED', 'Conversion Approved'),
        ('COMMISSION_APPROVED', 'Commission Approved'),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=40, choices=TYPE_CHOICES)
    title = models.CharField(max_length=180)
    message = models.TextField()
    lead = models.ForeignKey(Lead, null=True, blank=True, on_delete=models.SET_NULL, related_name='notifications')
    task = models.ForeignKey(Task, null=True, blank=True, on_delete=models.SET_NULL, related_name='notifications')
    commission = models.ForeignKey('Commission', null=True, blank=True, on_delete=models.SET_NULL, related_name='notifications')
    is_read = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.username}: {self.title}"


class ImportHistory(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('PARTIAL', 'Partial'),
        ('FAILED', 'Failed'),
    ]

    DUPLICATE_STRATEGY_CHOICES = [
        ('SKIP', 'Skip Duplicates'),
        ('UPDATE', 'Update Existing Leads'),
        ('IMPORT_ALL', 'Import All Anyway'),
    ]

    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10)
    total_records = models.PositiveIntegerField(default=0)
    success_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    duplicate_count = models.PositiveIntegerField(default=0)
    imported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='lead_imports')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    duplicate_strategy = models.CharField(max_length=20, choices=DUPLICATE_STRATEGY_CHOICES, default='SKIP')
    column_mapping = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Import {self.id} - {self.file_name}"


class ImportLog(models.Model):
    STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('DUPLICATE', 'Duplicate'),
        ('UPDATED', 'Updated'),
    ]

    import_history = models.ForeignKey(ImportHistory, on_delete=models.CASCADE, related_name='logs')
    row_number = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    error_message = models.TextField(blank=True)
    row_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Import {self.import_history_id} Row {self.row_number} - {self.status}"


class ImportMappingTemplate(models.Model):
    name = models.CharField(max_length=120)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='import_mapping_templates')
    mapping = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('name', 'created_by')

    def __str__(self):
        return f"{self.name} ({self.created_by.username})"


class ExportHistory(models.Model):
    STATUS_CHOICES = [
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10)
    exported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='lead_exports')
    total_records = models.PositiveIntegerField(default=0)
    filters_applied = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PROCESSING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Export {self.id} - {self.file_name}"


class Commission(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
        ('REJECTED', 'Rejected'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='commissions')
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='commissions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    rate = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    calculated_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_commissions'
    )

    def __str__(self):
        return f"{self.agent.username} - {self.amount} ({self.status})"
