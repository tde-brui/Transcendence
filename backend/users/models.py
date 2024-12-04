from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import random

class PongUser(AbstractUser):
	twoFactorEnabled = models.BooleanField(default=False)
	firstName = models.CharField(blank=True, max_length=100)
	avatar = models.ImageField(upload_to="avatars/", default="avatars/default.png")
	friends = models.ManyToManyField("self", blank=True)
	onlineStatus = models.BooleanField(default=False)
	# match_history = models.CharField(blank=True)
	oauth_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

	def __str__(self):
		return self.username

class FriendRequest(models.Model):
	sender = models.ForeignKey(PongUser, related_name="sent_requests", on_delete=models.CASCADE)
	receiver = models.ForeignKey(PongUser, related_name="received_requests", on_delete=models.CASCADE)
	created_at = models.DateTimeField(auto_now_add=True)
	is_accepted = models.BooleanField(default=False)

class OTP(models.Model):
	user = models.ForeignKey(PongUser, on_delete=models.CASCADE, related_name='otp_codes')
	code = models.CharField(max_length=6)
	created_at = models.DateTimeField(auto_now_add=True)
	expires_at = models.DateTimeField()

	def is_expired(self):
		return timezone.now() > self.expires_at
	
	@staticmethod
	def generate_code(user):
		code = random.randint(100000, 999999)
		expires_at = timezone.now() + timezone.timedelta(minutes=5)
		otp = OTP.objects.create(user=user, code=code, expires_at=expires_at)
		return otp
	def __str__(self):
		return f'OTP for {self.user.username} - Code: {self.code} - Expires at: {self.expires_at}' 
