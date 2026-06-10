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


class FollowUp(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='followups')
    scheduled_time = models.DateTimeField()
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Follow-up for {self.lead.name} at {self.scheduled_time}"


class Task(models.Model):
    lead = models.ForeignKey(
        Lead,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='assigned_tasks'
    )
    status = models.CharField(
        max_length=20,
        choices=[('PENDING', 'Pending'), ('COMPLETED', 'Completed')],
        default='PENDING'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


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
