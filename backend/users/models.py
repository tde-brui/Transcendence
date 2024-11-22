from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models

class PongUser(AbstractUser):
	id = models.IntegerField(primary_key=True)

	def __str__(self):
		return self.username
