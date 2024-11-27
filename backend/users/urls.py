from . import views
from django.urls import path

urlpatterns = [
	path('login/', views.user_login.as_view()),
	path('register/', views.user_register.as_view()),
	path('verify_otp/', views.verify_otp.as_view()),
	path('auth/verify/', views.check_token.as_view()),
	path('me/', views.get_logged_in_user.as_view()),
	path('<int:pk>/', views.user_detail.as_view()),
]