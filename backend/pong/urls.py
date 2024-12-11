from django.urls import path
from .views import list_lobbies

urlpatterns = [
    path('api/lobbies', list_lobbies, name='list_lobbies'),
]
