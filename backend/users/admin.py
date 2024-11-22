from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import PongUser

class CustomUserAdmin(UserAdmin):
    model = PongUser
    # Optionally, add custom fields to the admin display

admin.site.register(PongUser, CustomUserAdmin)
