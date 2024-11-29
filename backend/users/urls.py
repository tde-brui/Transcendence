from . import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'', views.UserViewSet)

urlpatterns = [
	path('', include(router.urls)),
	path('login/', views.user_login.as_view()),
	path('register/', views.user_register.as_view()),
	path('verify_otp/', views.verify_otp.as_view()),
	path('auth/verify/', views.check_token.as_view()),
	path('me/', views.get_logged_in_user.as_view()),
]

#for development only
from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)