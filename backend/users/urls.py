from . import views
from django.urls import path

urlpatterns = [
	path('', views.user_list),
	path("login/", views.user_login.as_view()),
	path('<int:pk>/', views.user_detail),
]