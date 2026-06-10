from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('leads_crm', '0007_export_history'),
    ]

    operations = [
        migrations.CreateModel(
            name='CallLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('call_date', models.DateTimeField()),
                ('duration', models.PositiveIntegerField(default=0, help_text='Duration in seconds')),
                ('call_type', models.CharField(choices=[('INCOMING', 'Incoming'), ('OUTGOING', 'Outgoing')], default='OUTGOING', max_length=20)),
                ('call_status', models.CharField(choices=[('ANSWERED', 'Answered'), ('MISSED', 'Missed'), ('BUSY', 'Busy'), ('NO_RESPONSE', 'No Response')], default='ANSWERED', max_length=20)),
                ('outcome', models.CharField(blank=True, choices=[('INTERESTED', 'Interested'), ('NOT_INTERESTED', 'Not Interested'), ('CALLBACK_REQUESTED', 'Callback Requested'), ('CONVERTED', 'Converted')], default='', max_length=30)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('agent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='call_logs', to='auth.user')),
                ('lead', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='call_logs', to='leads_crm.lead')),
            ],
        ),
        migrations.CreateModel(
            name='LeadEmail',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('subject', models.CharField(max_length=200)),
                ('sender', models.EmailField(max_length=254)),
                ('recipient', models.EmailField(max_length=254)),
                ('status', models.CharField(choices=[('DRAFT', 'Draft'), ('SENT', 'Sent'), ('DELIVERED', 'Delivered'), ('OPENED', 'Opened'), ('FAILED', 'Failed')], default='SENT', max_length=20)),
                ('direction', models.CharField(choices=[('SENT', 'Sent'), ('RECEIVED', 'Received')], default='SENT', max_length=10)),
                ('content', models.TextField()),
                ('attachments', models.TextField(blank=True, help_text='Comma separated attachment names/urls')),
                ('sent_at', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('lead', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lead_emails', to='leads_crm.lead')),
            ],
        ),
        migrations.CreateModel(
            name='LeadNote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=150)),
                ('content', models.TextField()),
                ('is_pinned', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lead_notes', to='auth.user')),
                ('lead', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lead_notes', to='leads_crm.lead')),
                ('mentions', models.ManyToManyField(blank=True, related_name='mentioned_in_notes', to='auth.user')),
            ],
        ),
        migrations.AddField(
            model_name='followup',
            name='assigned_agent',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_followups', to='auth.user'),
        ),
        migrations.AddField(
            model_name='followup',
            name='followup_type',
            field=models.CharField(choices=[('CALL', 'Call'), ('MEETING', 'Meeting'), ('EMAIL', 'Email'), ('WHATSAPP', 'WhatsApp')], default='CALL', max_length=20),
        ),
    ]
