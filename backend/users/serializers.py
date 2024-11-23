from rest_framework import serializers
from .models import PongUser

class UserSerializer(serializers.ModelSerializer):
	password = serializers.CharField(write_only=True)

	class Meta:
		model = PongUser
		fields = ['id', 'username', 'email', 'password', 'two_factor_enabled']
	
	def create(self, validated_data):
			# Create a new user with hashed password
			user = PongUser.objects.create_user(
				username=validated_data['username'],
				email=validated_data['email'],
				password=validated_data['password'],
				two_factor_enabled=validated_data['two_factor_enabled']
			)
			return user

class LoginSerializer(serializers.Serializer):
	username = serializers.CharField()
	password = serializers.CharField(write_only=True)