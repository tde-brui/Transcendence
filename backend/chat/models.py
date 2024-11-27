from django.db import models

# Create your models here.
class Room(models.Model):
	id = models.IntegerField(primary_key=True)

class Message(models.Model):
	room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="message")
	text = models.TextField()