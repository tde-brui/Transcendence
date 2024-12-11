from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import random

class PongUser(AbstractUser):
	twoFactorEnabled = models.BooleanField(default=False)
	firstName = models.CharField(blank=True, max_length=100)
	avatar = models.ImageField(upload_to="avatars/", default="avatars/default.png")
	friends = models.ManyToManyField("self", blank=True, symmetrical=True)
	onlineStatus = models.BooleanField(default=False)
	# match_history = models.CharField(blank=True)
	oauth_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

	def add_friend(self, friend):
		self.friends.add(friend)

	def remove_friend(self, friend):
		self.friends.remove(friend)

	def __str__(self):
		return self.username

class OTP(models.Model):

	email = models.EmailField()

	code = models.CharField(max_length=6)
	created_at = models.DateTimeField(auto_now_add=True)
	expires_at = models.DateTimeField()

	def is_expired(self):
		return timezone.now() > self.expires_at
	
	@staticmethod
	def generate_code(email):
		code = random.randint(100000, 999999)
		expires_at = timezone.now() + timezone.timedelta(minutes=5)
		otp = OTP.objects.create(email=email, code=code, expires_at=expires_at)
		return otp
	def __str__(self):
		return f'OTP for {self.email}: {self.code} - Expires at {self.expires_at}' 
