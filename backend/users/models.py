from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import random

class PongUser(AbstractUser):
	two_factor_enabled = models.BooleanField(default=False)

	def __str__(self):
		return self.username
	
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
