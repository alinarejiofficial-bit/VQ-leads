from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, LogoutView, MeView, AgentsView, AgentDetailView, AgentTrackingView, LeadViewSet,
    SalesTeamViewSet, LeadFormViewSet, PublicFormDetailView,
    PublicFormSubmitView, TaskViewSet, FollowUpViewSet,
    CommissionViewSet, DashboardStatsView, DashboardChartsView, AgentDashboardView,
    TeamPerformanceView, CommissionSettingsView, NotificationViewSet,
)
from .import_views import (
    ImportPreviewView, ImportDuplicateCheckView, ImportExecuteView,
    ImportHistoryViewSet, ImportMappingTemplateViewSet
)

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'teams', SalesTeamViewSet, basename='team')
router.register(r'forms', LeadFormViewSet, basename='form')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'followups', FollowUpViewSet, basename='followup')
router.register(r'commissions', CommissionViewSet, basename='commission')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'import-history', ImportHistoryViewSet, basename='import_history')
router.register(r'import-mapping-templates', ImportMappingTemplateViewSet, basename='import_mapping_template')

urlpatterns = [
    # Auth endpoints
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/me/', MeView.as_view(), name='auth_me'),

    # Agents endpoints
    path('agents/', AgentsView.as_view(), name='agents'),
    path('agents/tracking/', AgentTrackingView.as_view(), name='agent_tracking'),
    path('agents/<int:pk>/', AgentDetailView.as_view(), name='agent_detail'),

    # Public form endpoints (Unauthenticated)
    path('public/forms/<int:pk>/', PublicFormDetailView.as_view(), name='public_form_detail'),
    path('public/forms/<int:pk>/submit/', PublicFormSubmitView.as_view(), name='public_form_submit'),

    # Dashboard endpoints
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('dashboard/charts/', DashboardChartsView.as_view(), name='dashboard_charts'),
    path('dashboard/agent/', AgentDashboardView.as_view(), name='dashboard_agent'),
    path('team/performance/', TeamPerformanceView.as_view(), name='team_performance'),
    path('commissions/settings/', CommissionSettingsView.as_view(), name='commission_settings'),
    path('imports/preview/', ImportPreviewView.as_view(), name='imports_preview'),
    path('imports/duplicate-check/', ImportDuplicateCheckView.as_view(), name='imports_duplicate_check'),
    path('imports/execute/', ImportExecuteView.as_view(), name='imports_execute'),

    # ViewSet Router
    path('', include(router.urls)),
]
