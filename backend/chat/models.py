from django.db import models
from users.models import PongUser


class Message(models.Model):
    sender = models.ForeignKey(PongUser, related_name='sent_messages', on_delete=models.CASCADE)
    recipient = models.ForeignKey(PongUser, related_name='received_messages', null=True, blank=True, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_announcement = models.BooleanField(default=False)  # Indicates if the message is an announcement

    def __str__(self):
        if self.is_announcement:
            return f'Announcement by {self.sender}: {self.text}'
        elif self.recipient:
            return f'DM from {self.sender} to {self.recipient}: {self.text}'
        return f'{self.sender}: {self.text}'

class BlockedUser(models.Model):
    blocker = models.ForeignKey(PongUser, related_name='blocking', on_delete=models.CASCADE)
    blocked = models.ForeignKey(PongUser, related_name='blocked_by', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('blocker', 'blocked')  # Ensure that a PongUser can block another user only once

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"
