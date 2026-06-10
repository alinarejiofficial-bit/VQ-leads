"""Default configuration values for the Settings module."""

DEFAULT_GENERAL = {
    'companyName': 'VQ Leads CRM',
    'companyLogo': '',
    'companyEmail': '',
    'companyPhone': '',
    'companyAddress': '',
    'websiteUrl': '',
    'timezone': 'Asia/Kolkata',
    'currency': 'INR',
    'language': 'en',
    'dateFormat': 'DD/MM/YYYY',
    'themeMode': 'light',
    'sessionTimeoutMinutes': 60,
    'twoFactorEnabled': False,
    'sessionManagementEnabled': True,
}

DEFAULT_LEAD = {
    'statuses': [
        {'code': 'NEW', 'label': 'New', 'color': '#3b82f6', 'isDefault': True},
        {'code': 'CONTACTED', 'label': 'Contacted', 'color': '#8b5cf6'},
        {'code': 'QUALIFIED', 'label': 'Qualified', 'color': '#06b6d4'},
        {'code': 'PROPOSAL_SENT', 'label': 'Proposal Sent', 'color': '#f59e0b'},
        {'code': 'NEGOTIATION', 'label': 'Negotiation', 'color': '#f97316'},
        {'code': 'WON', 'label': 'Won', 'color': '#22c55e'},
        {'code': 'LOST', 'label': 'Lost', 'color': '#ef4444'},
    ],
    'sources': [
        {'code': 'WEBSITE', 'label': 'Website'},
        {'code': 'FACEBOOK_ADS', 'label': 'Facebook Ads'},
        {'code': 'GOOGLE_ADS', 'label': 'Google Ads'},
        {'code': 'REFERRAL', 'label': 'Referral'},
        {'code': 'MANUAL', 'label': 'Manual Entry'},
    ],
    'assignmentMode': 'MANUAL',
    'autoAssignment': False,
    'roundRobinEnabled': False,
    'duplicateDetection': True,
    'autoLeadNumber': True,
    'leadExpiryEnabled': False,
    'leadExpiryDays': 30,
}

DEFAULT_EMAIL_TEMPLATES = {
    'welcomeEmail': {'subject': 'Welcome to {companyName}', 'body': 'Hello {name}, welcome aboard!', 'enabled': True},
    'leadAssignmentEmail': {'subject': 'New Lead Assigned: {leadName}', 'body': 'You have been assigned lead {leadName}.', 'enabled': True},
    'followUpReminderEmail': {'subject': 'Follow-up Reminder', 'body': 'Reminder: follow up with {leadName} at {time}.', 'enabled': True},
    'dealWonEmail': {'subject': 'Deal Won!', 'body': 'Congratulations! Lead {leadName} was marked as won.', 'enabled': True},
}

NOTIFICATION_EVENTS = [
    'NEW_LEAD_ASSIGNED',
    'LEAD_CONVERTED',
    'LEAD_LOST',
    'FOLLOWUP_REMINDER',
    'TASK_DUE',
    'TASK_OVERDUE',
    'COMMISSION_APPROVED',
    'NEW_FORM_SUBMISSION',
]

NOTIFICATION_CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'PUSH']

NOTIFICATION_LABELS = {
    'NEW_LEAD_ASSIGNED': 'New Lead Assigned',
    'LEAD_CONVERTED': 'Lead Converted',
    'LEAD_LOST': 'Lead Lost',
    'FOLLOWUP_REMINDER': 'Follow-up Reminder',
    'TASK_DUE': 'Task Due',
    'TASK_OVERDUE': 'Task Overdue',
    'COMMISSION_APPROVED': 'Commission Approved',
    'NEW_FORM_SUBMISSION': 'New Form Submission',
}

DEFAULT_REMINDER_MINUTES = {
    'FOLLOWUP_REMINDER': 60,
    'TASK_DUE': 60,
    'TASK_OVERDUE': 15,
}

API_SERVICES = [
    {'service_name': 'facebook_leads', 'display_name': 'Facebook Leads API'},
    {'service_name': 'google_ads', 'display_name': 'Google Ads API'},
    {'service_name': 'whatsapp_business', 'display_name': 'WhatsApp Business API'},
    {'service_name': 'twilio_sms', 'display_name': 'Twilio SMS API'},
    {'service_name': 'sendgrid', 'display_name': 'SendGrid API'},
    {'service_name': 'stripe', 'display_name': 'Stripe API'},
    {'service_name': 'razorpay', 'display_name': 'Razorpay API'},
]
