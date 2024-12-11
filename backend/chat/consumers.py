# chat/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Room, Message, BlockedUser

User = get_user_model()

online_users = {}  # {room_name: {username: channel_name}}

@database_sync_to_async
def get_or_create_room(room_name):
    room, created = Room.objects.get_or_create(name=room_name)
    return room

@database_sync_to_async
def create_message(room, user, message):
    return Message.objects.create(room=room, sender=user, text=message)

@database_sync_to_async
def get_user(username):
    return User.objects.get(username=username)

@database_sync_to_async
def block_user(blocker, blocked_username):
    try:
        blocked_user = User.objects.get(username=blocked_username)
        BlockedUser.objects.create(blocker=blocker, blocked=blocked_user)
        return True, f"You have blocked '{blocked_username}'."
    except User.DoesNotExist:
        return False, f"User '{blocked_username}' does not exist."
    except:
        return False, "An error occurred while blocking the user."

@database_sync_to_async
def unblock_user(blocker, blocked_username):
    try:
        blocked_user = User.objects.get(username=blocked_username)
        BlockedUser.objects.filter(blocker=blocker, blocked=blocked_user).delete()
        return True, f"You have unblocked '{blocked_username}'."
    except User.DoesNotExist:
        return False, f"User '{blocked_username}' does not exist."
    except:
        return False, "An error occurred while unblocking the user."

@database_sync_to_async
def is_blocked(sender, recipient):
    return BlockedUser.objects.filter(blocker=recipient, blocked__username=sender).exists()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract room_name from URL route
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"room_{self.room_name}"

        # Extract username from query string
        query_string = self.scope['query_string'].decode('utf-8')
        params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
        self.username = params.get('username')

        # Debugging statement after assigning attributes
        print(f"User connected: {self.username} in room '{self.room_name}'")

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

        # Initialize room in online_users if not present
        if self.room_name not in online_users:
            online_users[self.room_name] = {}

        # Reject connection if username already exists in the same room
        if self.username in online_users[self.room_name]:
            await self.close()
            print(f"Duplicate username '{self.username}' rejected in room '{self.room_name}'.")
            return

        # Add user to online_users
        online_users[self.room_name][self.username] = self.channel_name
        print(f"User connected: {self.username} in room '{self.room_name}', Online users: {online_users[self.room_name]}")

        # Add user to room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Update online users list for all clients in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "update_online_users",
                "users": list(online_users[self.room_name].keys()),
            }
        )

    async def disconnect(self, close_code):
        # Remove user from online_users
        if hasattr(self, 'room_name') and hasattr(self, 'username'):
            if self.room_name in online_users and self.username in online_users[self.room_name]:
                del online_users[self.room_name][self.username]
                print(f"User disconnected: {self.username} from room '{self.room_name}', Online users: {online_users[self.room_name]}")

        # Remove from group only if 'self.room_group_name' is set
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

            # Update online users list for all clients in the room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "update_online_users",
                    "users": list(online_users[self.room_name].keys()),
                }
            )

    async def receive(self, text_data):
        data = json.loads(text_data)

        if "command" in data:
            # Handle block and unblock commands
            command = data["command"]
            target_user = data.get("target_user")
            if command == "block" and target_user:
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
            elif command == "unblock" and target_user:
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
            recipient = data["recipient"]
            message = data["message"]

            print(f"Direct message from '{self.username}' to '{recipient}' in room '{self.room_name}': {message}")
            print(f"Online users mapping in room '{self.room_name}': {online_users[self.room_name]}")

            # Check if recipient exists
            try:
                recipient_user = await get_user(recipient)
            except User.DoesNotExist:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"User '{recipient}' does not exist."
                }))
                return

            # Check if recipient has blocked the sender
            blocked = await is_blocked(self.username, recipient)
            if blocked:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"You are blocked by '{recipient}'."
                }))
                return

            # Check if recipient is online
            recipient_channel = online_users[self.room_name].get(recipient)
            if recipient_channel:
                # Send direct message to recipient
                await self.channel_layer.send(
                    recipient_channel,
                    {
                        "type": "direct_message",
                        "sender": self.username,
                        "message": message,
                    }
                )
                # Optionally, send acknowledgment to sender
                await self.send(text_data=json.dumps({
                    "type": "dm_sent",
                    "message": f"Direct message sent to '{recipient}'."
                }))
            else:
                # Send error message if recipient is not online
                print(f"Recipient '{recipient}' not found in room '{self.room_name}'")
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"User '{recipient}' is not online in room '{self.room_name}'."
                }))
        elif "message" in data:
            # Handle general message
            message = data["message"]

            room = await get_or_create_room(self.room_name)
            await create_message(room, self.user, message)

            # Broadcast message to all clients in the room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "sender": self.username,
                    "message": message,
                }
            )
        elif "invite_game" in data:
            # Handle game invitation
            target_user = data.get("target_user")
            if target_user:
                # For now, open a new tab with nu.nl (handled on frontend)
                await self.send(text_data=json.dumps({
                    "type": "invite_game",
                    "target_user": target_user,
                    "message": f"You have been invited to play Pong by '{self.username}'.",
                    "url": "https://www.nu.nl"  # Placeholder URL
                }))
            else:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Missing target_user for game invitation."
                }))
        elif "announce" in data:
            # Handle global tournament announcement
            announcement = data["announce"]
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "tournament_announcement",
                    "message": announcement,
                }
            )
        elif "view_profile" in data:
            # Handle profile viewing
            target_user = data.get("target_user")
            if target_user:
                # For now, open a new tab with nu.nl (handled on frontend)
                await self.send(text_data=json.dumps({
                    "type": "view_profile",
                    "target_user": target_user,
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

    async def direct_message(self, event):
        # Send direct message to the client in question
        await self.send(text_data=json.dumps({
            "type": "direct",
            "sender": event["sender"],
            "message": event["message"],
        }))

    async def chat_message(self, event):
        # Broadcast message to all clients in the room
        await self.send(text_data=json.dumps({
            "type": "chat",
            "sender": event["sender"],
            "message": event["message"],
        }))

    async def tournament_announcement(self, event):
        # Send tournament announcement to all clients
        await self.send(text_data=json.dumps({
            "type": "announcement",
            "message": event["message"],
        }))

    async def update_online_users(self, event):
        print(f"Updating online users in room '{self.room_name}': {event['users']}")
        # Send updated online users list to clients
        await self.send(text_data=json.dumps({
            "type": "update_users",
            "users": event["users"],
        }))
