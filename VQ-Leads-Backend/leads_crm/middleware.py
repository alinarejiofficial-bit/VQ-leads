"""Middleware that exposes the current request to non-view code.

Audit logging is primarily driven by explicit ``log_audit(request, ...)`` calls
inside the views. This middleware stores the active request in a thread-local so
that signal handlers (or other code without direct request access) can still
attribute an action to the right user, IP and device.
"""
import threading

_thread_locals = threading.local()


def get_current_request():
    return getattr(_thread_locals, 'request', None)


class AuditContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request
        try:
            response = self.get_response(request)
        finally:
            _thread_locals.request = None
        return response
