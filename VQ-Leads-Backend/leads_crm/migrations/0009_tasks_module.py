from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('leads_crm', '0008_activities_module'),
    ]

    operations = [
        # Extend existing Task model
        migrations.AddField(
            model_name='task',
            name='task_type',
            field=models.CharField(
                choices=[
                    ('CALL_LEAD', 'Call Lead'), ('FOLLOW_UP', 'Follow-Up'),
                    ('MEETING', 'Meeting'), ('SITE_VISIT', 'Site Visit'),
                    ('SEND_EMAIL', 'Send Email'), ('SEND_QUOTATION', 'Send Quotation'),
                    ('DOCUMENT_COLLECTION', 'Document Collection'),
                    ('PAYMENT_FOLLOW_UP', 'Payment Follow-Up'), ('CUSTOM', 'Custom Task'),
                ],
                default='CUSTOM', max_length=30,
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='priority',
            field=models.CharField(
                choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('URGENT', 'Urgent')],
                default='MEDIUM', max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='reminder_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='task',
            name='notes',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='task',
            name='completed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='task',
            name='completed_by',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='completed_tasks', to='auth.user',
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='task',
            name='status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'Pending'), ('IN_PROGRESS', 'In Progress'),
                    ('COMPLETED', 'Completed'), ('CANCELLED', 'Cancelled'), ('OVERDUE', 'Overdue'),
                ],
                default='PENDING', max_length=20,
            ),
        ),
        # New TaskComment model
        migrations.CreateModel(
            name='TaskComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('task', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='leads_crm.task')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='task_comments', to='auth.user')),
            ],
        ),
        # New TaskHistory model
        migrations.CreateModel(
            name='TaskHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(max_length=100)),
                ('old_value', models.TextField(blank=True)),
                ('new_value', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('performed_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='task_history', to='auth.user')),
                ('task', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='history', to='leads_crm.task')),
            ],
        ),
    ]
