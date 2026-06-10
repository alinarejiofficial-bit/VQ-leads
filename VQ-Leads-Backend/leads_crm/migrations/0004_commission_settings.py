from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('leads_crm', '0003_alter_lead_status'),
    ]

    operations = [
        migrations.CreateModel(
            name='CommissionSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('global_rate', models.DecimalField(decimal_places=2, default=Decimal('2.00'), max_digits=5)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Commission Settings',
                'verbose_name_plural': 'Commission Settings',
            },
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='commission_rate',
            field=models.DecimalField(blank=True, decimal_places=2, default=None, max_digits=5, null=True),
        ),
    ]
