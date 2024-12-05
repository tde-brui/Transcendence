from rest_framework import serializers
from .models import PongUser, FriendRequest

class UserSerializer(serializers.ModelSerializer):
	password = serializers.CharField(write_only=True)

	class Meta:
		model = PongUser
		fields = ['id', 'username', 'email', 'password', 'twoFactorEnabled', 'firstName', 'friends', 'avatar']
	
	def validate_avatar(self, value):
		# Check if file is too large
		if value.size > 2 * 1024 * 1024:  # 2 MB limit
			raise serializers.ValidationError("Avatar file size must be less than 2MB.")
		return value

	
	def create(self, validated_data):
			# Create a new user with hashed password
			user = PongUser.objects.create_user(
				username=validated_data['username'],
				email=validated_data['email'],
				password=validated_data['password'],
				twoFactorEnabled=validated_data['twoFactorEnabled'],
				firstName=validated_data['firstName']
			)
			return user

class LoginSerializer(serializers.Serializer):
	username = serializers.CharField()
	password = serializers.CharField(write_only=True)

class FriendRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'createdAt']
        read_only_fields = ['id', 'createdAt']
