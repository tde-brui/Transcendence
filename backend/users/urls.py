from . import views
from django.urls import path, include

urlpatterns = [
	path('', views.get_users.as_view()),
	path('login/', views.user_login.as_view()),
	path('register/', views.user_register.as_view()),
	path('<int:pk>/', views.user_detail.as_view()),
	path('verify_otp/', views.verify_otp.as_view()),
	path('me/', views.get_logged_in_user.as_view()),
	path('42_login/', views.user_42_login),
	path('42_callback/', views.user_42_callback),
	path('send_friend_request/<int:userId>/', views.send_friend_request.as_view()),
    path('accept_friend_request/<int:requestId>/', views.accept_friend_request.as_view()),
    path('friend_requests/', views.get_friend_requests.as_view())
]

#for development only
from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)