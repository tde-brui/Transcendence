from django.db import models
from django.contrib.auth.models import User

class Room(models.Model):
    name = models.CharField(max_length=255, unique=True)  # Removed explicit 'id' field

    def __str__(self):
        return self.name

class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages")
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)  # Optional: Track when the message was sent

    def __str__(self):
        return f"{self.sender.username}: {self.text[:20]}"

class BlockedUser(models.Model):
    blocker = models.ForeignKey(User, related_name='blocking', on_delete=models.CASCADE)
    blocked = models.ForeignKey(User, related_name='blocked_by', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('blocker', 'blocked')  # Ensure that a user can block another user only once

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"
