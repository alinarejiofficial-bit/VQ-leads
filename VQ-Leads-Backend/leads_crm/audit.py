"""Helpers for recording audit log entries.

Use ``log_audit`` from any view to capture an important system action. The
helper is defensive: it never raises, so audit logging can never break the
underlying request flow.
"""
from .models import AuditLog


def get_client_ip(request):
    """Best-effort extraction of the client IP, honouring common proxies."""
    if request is None:
        return None
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def get_user_agent(request):
    if request is None:
        return ''
    return request.META.get('HTTP_USER_AGENT', '')[:1000]


def parse_device(user_agent):
    """Return a short, human-friendly device/browser description."""
    if not user_agent:
        return 'Unknown device'
    ua = user_agent.lower()

    if 'iphone' in ua:
        os_name = 'iPhone'
    elif 'ipad' in ua:
        os_name = 'iPad'
    elif 'android' in ua:
        os_name = 'Android'
    elif 'windows' in ua:
        os_name = 'Windows'
    elif 'mac os' in ua or 'macintosh' in ua:
        os_name = 'macOS'
    elif 'linux' in ua:
        os_name = 'Linux'
    else:
        os_name = 'Unknown OS'

    if 'edg/' in ua:
        browser = 'Edge'
    elif 'chrome' in ua and 'chromium' not in ua:
        browser = 'Chrome'
    elif 'firefox' in ua:
        browser = 'Firefox'
    elif 'safari' in ua and 'chrome' not in ua:
        browser = 'Safari'
    else:
        browser = 'Unknown browser'

    return f"{browser} on {os_name}"


def _serialize_value(value):
    """Coerce arbitrary values into something JSON-serialisable and readable."""
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def _normalize_dict(data):
    if not data:
        return {}
    return {str(k): _serialize_value(v) for k, v in data.items()}


def log_audit(request, *, module, action, record_type='', record_id='',
              summary='', old_values=None, new_values=None, user=None,
              user_name=None, role=None):
    """Create an :class:`AuditLog` row. Never raises on failure."""
    try:
        actor = user
        if actor is None and request is not None:
            req_user = getattr(request, 'user', None)
            if req_user is not None and getattr(req_user, 'is_authenticated', False):
                actor = req_user

        resolved_name = user_name
        resolved_role = role
        if actor is not None:
            if resolved_name is None:
                resolved_name = (actor.get_full_name() or actor.username) if hasattr(actor, 'username') else str(actor)
            if resolved_role is None:
                profile = getattr(actor, 'profile', None)
                resolved_role = getattr(profile, 'role', '') if profile else ''

        return AuditLog.objects.create(
            user=actor if (actor is not None and getattr(actor, 'pk', None)) else None,
            user_name=(resolved_name or 'System')[:255],
            role=(resolved_role or '')[:20],
            module=module,
            action=action,
            record_type=str(record_type)[:60],
            record_id=str(record_id)[:60] if record_id not in (None, '') else '',
            summary=summary[:400] if summary else '',
            old_values=_normalize_dict(old_values),
            new_values=_normalize_dict(new_values),
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except Exception:
        # Auditing must never break the primary operation.
        return None
