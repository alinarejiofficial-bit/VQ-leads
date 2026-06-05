from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, LogoutView, MeView, AgentsView, LeadViewSet,
    SalesTeamViewSet, LeadFormViewSet, PublicFormDetailView,
    PublicFormSubmitView, TaskViewSet, FollowUpViewSet,
    CommissionViewSet, DashboardStatsView, DashboardChartsView
)

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'teams', SalesTeamViewSet, basename='team')
router.register(r'forms', LeadFormViewSet, basename='form')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'followups', FollowUpViewSet, basename='followup')
router.register(r'commissions', CommissionViewSet, basename='commission')

urlpatterns = [
    # Auth endpoints
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/me/', MeView.as_view(), name='auth_me'),

    # Agents endpoints
    path('agents/', AgentsView.as_view(), name='agents'),

    # Public form endpoints (Unauthenticated)
    path('public/forms/<int:pk>/', PublicFormDetailView.as_view(), name='public_form_detail'),
    path('public/forms/<int:pk>/submit/', PublicFormSubmitView.as_view(), name='public_form_submit'),

    # Dashboard endpoints
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('dashboard/charts/', DashboardChartsView.as_view(), name='dashboard_charts'),

    # ViewSet Router
    path('', include(router.urls)),
]
