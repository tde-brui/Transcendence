from django.test import TestCase

# Create your tests here.
from REST_api.serializers import UserSerializer
from django.contrib.auth.models import User
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser

user1 = User.objects.create_user(username='john_doe2', email='john@example.com', password='securepassword123')
user1.save()
print(user1)
serializer = UserSerializer(user1)
serializer.data()