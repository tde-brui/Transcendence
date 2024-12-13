from django.urls import re_path
from .consumers import PongConsumer

websocket_urlpatterns = [
    re_path('ws/pong/$', PongConsumer.as_asgi()),
]
