from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('leads_crm', '0006_import_module'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExportHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file_name', models.CharField(max_length=255)),
                ('file_type', models.CharField(max_length=10)),
                ('total_records', models.PositiveIntegerField(default=0)),
                ('filters_applied', models.JSONField(blank=True, default=dict)),
                ('status', models.CharField(choices=[('PROCESSING', 'Processing'), ('COMPLETED', 'Completed'), ('FAILED', 'Failed')], default='PROCESSING', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('exported_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lead_exports', to='auth.user')),
            ],
        ),
    ]
