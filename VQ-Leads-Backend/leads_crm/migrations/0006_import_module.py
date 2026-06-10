from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('leads_crm', '0005_notification'),
    ]

    operations = [
        migrations.CreateModel(
            name='ImportHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file_name', models.CharField(max_length=255)),
                ('file_type', models.CharField(max_length=10)),
                ('total_records', models.PositiveIntegerField(default=0)),
                ('success_count', models.PositiveIntegerField(default=0)),
                ('failed_count', models.PositiveIntegerField(default=0)),
                ('duplicate_count', models.PositiveIntegerField(default=0)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('PROCESSING', 'Processing'), ('COMPLETED', 'Completed'), ('PARTIAL', 'Partial'), ('FAILED', 'Failed')], default='PENDING', max_length=20)),
                ('duplicate_strategy', models.CharField(choices=[('SKIP', 'Skip Duplicates'), ('UPDATE', 'Update Existing Leads'), ('IMPORT_ALL', 'Import All Anyway')], default='SKIP', max_length=20)),
                ('column_mapping', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('imported_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lead_imports', to='auth.user')),
            ],
        ),
        migrations.CreateModel(
            name='ImportLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('row_number', models.PositiveIntegerField()),
                ('status', models.CharField(choices=[('SUCCESS', 'Success'), ('FAILED', 'Failed'), ('DUPLICATE', 'Duplicate'), ('UPDATED', 'Updated')], max_length=20)),
                ('error_message', models.TextField(blank=True)),
                ('row_data', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('import_history', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='logs', to='leads_crm.importhistory')),
            ],
        ),
        migrations.CreateModel(
            name='ImportMappingTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120)),
                ('mapping', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='import_mapping_templates', to='auth.user')),
            ],
            options={
                'unique_together': {('name', 'created_by')},
            },
        ),
    ]
