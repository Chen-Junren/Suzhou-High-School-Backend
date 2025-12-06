from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# 创建路由器实例
router = DefaultRouter()
# 注册ClubViewSet
router.register(r'clubs', views.ClubViewSet, basename='club')

urlpatterns = [
    # 包含路由器生成的URLs
    path('', include(router.urls)),
    # 用户认证相关路由
    path('register/', views.user_register, name='user_register'),
    path('login/', views.user_login, name='user_login'),
    path('logout/', views.user_logout, name='user_logout'),
    path('profile/', views.user_profile, name='user_profile'),
    # 社团成员管理路由
    path('clubs/<int:club_id>/join/', views.join_club, name='join_club'),
    path('clubs/<int:club_id>/leave/', views.leave_club, name='leave_club'),
]