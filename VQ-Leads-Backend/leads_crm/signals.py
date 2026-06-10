"""Signal hooks for the leads_crm app.

Audit log entries are written explicitly from the views via
``leads_crm.audit.log_audit`` so that each entry carries rich, action-specific
context (summary, before/after values, IP and device). This module is kept as
the single, documented place to register any future Django signal receivers and
to satisfy the app's ``ready()`` import.
"""

# No signal receivers are registered at the moment. Audit logging is handled
# explicitly inside the view layer to keep entries descriptive and accurate.
