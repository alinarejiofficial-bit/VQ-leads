from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('leads_crm', '0004_commission_settings'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('NEW_LEAD_AVAILABLE', 'New Lead Available'), ('LEAD_ASSIGNED', 'Lead Assigned'), ('LEAD_CLAIMED', 'Lead Claimed'), ('TASK_ASSIGNED', 'Task Assigned'), ('FOLLOWUP_REMINDER', 'Follow-up Reminder'), ('CONVERSION_APPROVED', 'Conversion Approved'), ('COMMISSION_APPROVED', 'Commission Approved')], max_length=40)),
                ('title', models.CharField(max_length=180)),
                ('message', models.TextField()),
                ('is_read', models.BooleanField(default=False)),
                ('is_archived', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('commission', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notifications', to='leads_crm.commission')),
                ('lead', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notifications', to='leads_crm.lead')),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='auth.user')),
                ('task', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notifications', to='leads_crm.task')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
