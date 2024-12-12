# chat/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Message, BlockedUser

User = get_user_model()

online_users = {}  # {username: channel_name}

@database_sync_to_async
def get_user(username):
    return User.objects.get(username=username)

@database_sync_to_async
def create_message(sender, recipient, text, is_announcement=False):
    return Message.objects.create(sender=sender, recipient=recipient, text=text, is_announcement=is_announcement)

@database_sync_to_async
def block_user(blocker, blocked_user):
    try:
        BlockedUser.objects.create(blocker=blocker, blocked=blocked_user)
        return True, f"You have blocked '{blocked_user.username}'."
    except BlockedUser.DoesNotExist:
        return False, f"User '{blocked_user.username}' does not exist."
    except:
        return False, "An error occurred while blocking the user."

@database_sync_to_async
def unblock_user(blocker, blocked_user):
    try:
        BlockedUser.objects.filter(blocker=blocker, blocked=blocked_user).delete()
        return True, f"You have unblocked '{blocked_user.username}'."
    except BlockedUser.DoesNotExist:
        return False, f"User '{blocked_user.username}' does not exist."
    except:
        return False, "An error occurred while unblocking the user."

@database_sync_to_async
def is_blocked(sender_user, recipient_user):
    return BlockedUser.objects.filter(blocker=recipient_user, blocked=sender_user).exists()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract username from query string
        query_string = self.scope['query_string'].decode('utf-8')
        params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
        self.username = params.get('username')

        print(f"User attempting to connect: {self.username}")

        # Reject connection if no username provided
        if not self.username:
            await self.close()
            print("Connection rejected: No username provided.")
            return

        # Get user instance
        try:
            self.user = await get_user(self.username)
        except User.DoesNotExist:
            await self.close()
            print(f"Connection rejected: User '{self.username}' does not exist.")
            return

        # Prevent duplicate connections
        if self.username in online_users:
            await self.close()
            print(f"Connection rejected: Duplicate username '{self.username}'.")
            return

        # Add user to online_users
        online_users[self.username] = self.channel_name
        print(f"User connected: {self.username}, Online users: {list(online_users.keys())}")

        # Add user to the global group
        await self.channel_layer.group_add(
            "global",
            self.channel_name
        )

        await self.accept()

        # Notify all users about updated online users
        await self.channel_layer.group_send(
            "global",
            {
                "type": "update_online_users",
                "users": list(online_users.keys()),
            }
        )

    async def disconnect(self, close_code):
        # Remove user from online_users
        if self.username in online_users:
            del online_users[self.username]
            print(f"User disconnected: {self.username}, Online users: {list(online_users.keys())}")

        # Remove from global group
        await self.channel_layer.group_discard(
            "global",
            self.channel_name
        )

        # Notify all users about updated online users
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
            # Handle block and unblock commands
            command = data["command"]
            target_username = data.get("target_user")
            if command == "block" and target_username:
                # Get target user
                try:
                    target_user = await get_user(target_username)
                except User.DoesNotExist:
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": f"User '{target_username}' does not exist."
                    }))
                    return

                success, message = await block_user(self.user, target_user)
                if success:
                    await self.send(text_data=json.dumps({
                        "type": "block_success",
                        "message": message
                    }))
                else:
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": message
                    }))
            elif command == "unblock" and target_username:
                # Get target user
                try:
                    target_user = await get_user(target_username)
                except User.DoesNotExist:
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": f"User '{target_username}' does not exist."
                    }))
                    return

                success, message = await unblock_user(self.user, target_user)
                if success:
                    await self.send(text_data=json.dumps({
                        "type": "unblock_success",
                        "message": message
                    }))
                else:
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": message
                    }))
            else:
                # Send error message for invalid command or missing target_user
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Invalid command or missing target_user."
                }))
        elif "recipient" in data:
            # Handle direct message
            recipient_username = data["recipient"]
            message = data["message"]

            print(f"Direct message from '{self.username}' to '{recipient_username}': {message}")
            print(f"Online users mapping: {online_users}")

            # Check if recipient exists
            try:
                recipient_user = await get_user(recipient_username)
            except User.DoesNotExist:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"User '{recipient_username}' does not exist."
                }))
                return

            # Check if recipient has blocked the sender
            blocked = await is_blocked(self.user, recipient_user)
            if blocked:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"You are blocked by '{recipient_username}'."
                }))
                return

            # Check if recipient is online
            recipient_channel = online_users.get(recipient_username)
            if recipient_channel:
                # Save DM message
                await create_message(sender=self.user, recipient=recipient_user, text=message, is_announcement=False)

                # Send direct message to recipient
                await self.channel_layer.send(
                    recipient_channel,
                    {
                        "type": "direct_message",
                        "sender": self.username,
                        "message": message,
                    }
                )
                # Send acknowledgment to sender
                await self.send(text_data=json.dumps({
                    "type": "dm_sent",
                    "message": f"Direct message sent to '{recipient_username}'."
                }))
            else:
                # Send error message if recipient is not online
                print(f"Recipient '{recipient_username}' not found online.")
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"User '{recipient_username}' is not online."
                }))
        elif "message" in data:
            # Handle global message
            message = data["message"]

            # Save the message
            await create_message(sender=self.user, recipient=None, text=message, is_announcement=False)

            # Broadcast message to all clients in the global group
            await self.channel_layer.group_send(
                "global",
                {
                    "type": "chat_message",
                    "sender": self.username,
                    "message": message,
                }
            )
        elif "announce" in data:
            # Handle server announcement
            announcement = data["announce"]

            # Save the announcement
            await create_message(sender=self.user, recipient=None, text=announcement, is_announcement=True)

            # Broadcast announcement to all clients in the global group
            await self.channel_layer.group_send(
                "global",
                {
                    "type": "server_announcement",
                    "sender": self.username,
                    "message": announcement,
                }
            )
        elif "view_profile" in data:
            # Handle profile viewing
            target_username = data.get("target_user")
            if target_username:
                # For now, open a new tab with nu.nl (handled on frontend)
                await self.send(text_data=json.dumps({
                    "type": "view_profile",
                    "target_user": target_username,
                    "url": "https://www.nu.nl"  # Placeholder URL
                }))
            else:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Missing target_user for profile viewing."
                }))
        else:
            # Send error message for unknown message format
            print("Received unknown message format.")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid message format."
            }))

    # Event handlers for messages sent via channel layer

    async def direct_message(self, event):
        # Send direct message to the recipient
        await self.send(text_data=json.dumps({
            "type": "direct",
            "sender": event["sender"],
            "message": event["message"],
        }))

    async def chat_message(self, event):
        # Broadcast global message to all clients
        await self.send(text_data=json.dumps({
            "type": "chat",
            "sender": event["sender"],
            "message": event["message"],
        }))

    async def server_announcement(self, event):
        # Broadcast server announcement to all clients
        await self.send(text_data=json.dumps({
            "type": "announcement",
            "sender": event["sender"],
            "message": event["message"],
        }))

    async def update_online_users(self, event):
        print(f"Updating online users: {event['users']}")
        # Send updated online users list to clients
        await self.send(text_data=json.dumps({
            "type": "update_users",
            "users": event["users"],
        }))
