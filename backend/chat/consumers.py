# chat/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message
from users.models import PongUser

online_users = {}  # {username: channel_name}

@database_sync_to_async
def get_user(username):
    return PongUser.objects.get(username=username)

@database_sync_to_async
def create_message(sender, recipient, text, is_announcement=False):
    return Message.objects.create(sender=sender, recipient=recipient, text=text, is_announcement=is_announcement)

@database_sync_to_async
def block_user(blocker, blocked_user):
    blocker.block_user(blocked_user)
    blocker.save()

@database_sync_to_async
def unblock_user(blocker, blocked_user):
    blocker.unblock_user(blocked_user)
    blocker.save()

@database_sync_to_async
def is_user_blocked(blocker, blocked_user):
    return blocker.is_blocked(blocked_user)

@database_sync_to_async
def get_last_messages(limit=50):
    messages = Message.objects.order_by('-timestamp')[:limit]
    return [
        {
            "sender": msg.sender.username,
            "text": msg.text,
            "is_announcement": msg.is_announcement,
            "timestamp": msg.timestamp.isoformat(),
        }
        for msg in messages
    ]
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode('utf-8')
        params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
        self.username = params.get('username')

        print(f"User attempting to connect: {self.username}")

        if not self.username:
            await self.close()
            print("Connection rejected: No username provided.")
            return

        try:
            self.user = await get_user(self.username)
        except PongUser.DoesNotExist:
            await self.close()
            print(f"Connection rejected: User '{self.username}' does not exist.")
            return

        if self.username in online_users:
            await self.close()
            print(f"Connection rejected: Duplicate username '{self.username}'.")
            return

        # Accept the WebSocket connection before sending any data
        await self.accept()

        # Add the user to the online users list
        online_users[self.username] = self.channel_name
        print(f"User connected: {self.username}, Online users: {list(online_users.keys())}")

        # Fetch the last 50 messages and send them after accepting the connection
        last_messages = await get_last_messages()
        await self.send(text_data=json.dumps({
            "type": "chat_history",
            "messages": last_messages,
        }))

        # Notify about the updated online users
        await self.channel_layer.group_add(
            "global",
            self.channel_name
        )

        await self.channel_layer.group_send(
            "global",
            {
                "type": "update_online_users",
                "users": list(online_users.keys()),
            }
        )

    async def disconnect(self, close_code):
        if self.username in online_users:
            del online_users[self.username]
            print(f"User disconnected: {self.username}, Online users: {list(online_users.keys())}")

        await self.channel_layer.group_discard(
            "global",
            self.channel_name
        )

        await self.channel_layer.group_send(
            "global",
            {
                "type": "update_online_users",
                "users": list(online_users.keys()),
            }
        )

    async def receive(self, text_data):
        data = json.loads(text_data)

        if "command" in data:
            command = data["command"]
            target_username = data.get("target_user")
            if command == "block" and target_username:
                try:
                    target_user = await get_user(target_username)
                    await block_user(self.user, target_user)
                    await self.send(text_data=json.dumps({
                        "type": "block_success",
                        "message": f"You have blocked '{target_username}'."
                    }))
                except PongUser.DoesNotExist:
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": f"User '{target_username}' does not exist."
                    }))
            elif command == "unblock" and target_username:
                try:
                    target_user = await get_user(target_username)
                    await unblock_user(self.user, target_user)
                    await self.send(text_data=json.dumps({
                        "type": "unblock_success",
                        "message": f"You have unblocked '{target_username}'."
                    }))
                except PongUser.DoesNotExist:
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": f"User '{target_username}' does not exist."
                    }))
        elif "recipient" in data:
            recipient_username = data["recipient"]
            message = data["message"]

            if len(message) > 200:  # Enforce message length limit
                await self.send(text_data=json.dumps({"type": "error", "message": "Message too long. Maximum length is 200 characters."}))
                return

            try:
                recipient_user = await get_user(recipient_username)
            except PongUser.DoesNotExist:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"User '{recipient_username}' does not exist."
                }))
                return

            # Use async wrapper for the is_blocked check
            if await is_user_blocked(self.user, recipient_user):
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"You are blocked by '{recipient_username}'."
                }))
                return

            recipient_channel = online_users.get(recipient_username)
            if recipient_channel:
                await create_message(sender=self.user, recipient=recipient_user, text=message, is_announcement=False)

                await self.channel_layer.send(
                    recipient_channel,
                    {
                        "type": "direct_message",
                        "sender": self.username,
                        "message": message,
                    }
                )
                await self.send(text_data=json.dumps({
                    "type": "dm_sent",
                    "message": f"Direct message sent to '{recipient_username}'."
                }))
            else:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"User '{recipient_username}' is not online."
                }))
        elif "message" in data:
            message = data["message"]

            if len(message) > 200:  # Enforce message length limit
                await self.send(text_data=json.dumps({"type": "error", "message": "Message too long. Maximum length is 200 characters."}))
                return
            
            await create_message(sender=self.user, recipient=None, text=message, is_announcement=False)

            await self.channel_layer.group_send(
                "global",
                {
                    "type": "chat_message",
                    "sender": self.username,
                    "message": message,
                }
            )
        elif "announce" in data:
            announcement = data["announce"]

            await create_message(sender=self.user, recipient=None, text=announcement, is_announcement=True)

            await self.channel_layer.group_send(
                "global",
                {
                    "type": "server_announcement",
                    "sender": self.username,
                    "message": announcement,
                }
            )
        elif "view_profile" in data:
            target_username = data.get("target_user")
            if target_username:
                await self.send(text_data=json.dumps({
                    "type": "view_profile",
                    "target_user": target_username,
                    "url": "https://www.nu.nl"
                }))
            else:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Missing target_user for profile viewing."
                }))
        else:
            print("Received unknown message format.")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid message format."
            }))

    async def direct_message(self, event):
        sender = event["sender"]
        message = event["message"]

        # Check if the sender is blocked by the current user
        sender_user = await get_user(sender)
        if await is_user_blocked(self.user, sender_user):
            print(f"DM from blocked user '{sender}' ignored.")
            return

        # Send the DM if not blocked
        await self.send(text_data=json.dumps({
            "type": "direct",
            "sender": sender,
            "message": message,
        }))

    async def chat_message(self, event):
        sender = event["sender"]
        message = event["message"]

        # Check if the current user has blocked the sender
        sender_user = await get_user(sender)
        if await is_user_blocked(self.user, sender_user):
            print(f"Message from blocked user '{sender}' ignored.")
            return

        # Send message if not blocked
        await self.send(text_data=json.dumps({
            "type": "chat",
            "sender": sender,
            "message": message,
        }))

    async def server_announcement(self, event):
        await self.send(text_data=json.dumps({
            "type": "announcement",
            "sender": event["sender"],
            "message": event["message"],
        }))

    async def update_online_users(self, event):
        print(f"Updating online users: {event['users']}")

        await self.send(text_data=json.dumps({
            "type": "update_users",
            "users": event["users"],
        }))
