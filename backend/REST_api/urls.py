from REST_api import views
from django.urls import path

urlpatterns = [
	path('', views.user_list),
	path('<int:pk>/', views.user_detail),
]