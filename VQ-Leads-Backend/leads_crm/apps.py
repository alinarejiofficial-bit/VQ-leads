from django.apps import AppConfig


class LeadsCrmConfig(AppConfig):
    name = 'leads_crm'

    def ready(self):
        from . import signals  # noqa: F401
