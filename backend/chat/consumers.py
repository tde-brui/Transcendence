import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

online_users = {} # {room_name: {username: channel_name}}
blocked_users = {} # {username: {blocked_user1, blocked_user2, enzovoort}}

@database_sync_to_async
def get_chat_room():
    from .models import Room
    return Room.objects.get_or_create(id=1)

@database_sync_to_async
def create_message(chat_room, message):
    from .models import Message
    return Message.objects.create(room=chat_room, text=message)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):    
        # extract room_name from URL route
        self.room_name = self.scope['url_route']['kwargs']['room_name']

        # extract username from query string
        query_string = self.scope['query_string'].decode('utf-8')

        # assuming query string is 'username=<username>'
        params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
        self.username = params.get('username')

        # reject connection if no username provided
        if not self.username:
            await self.close()
            print("Connection rejected: No username provided.")
            return

        # initialize room in online_users if not present
        if self.room_name not in online_users:
            online_users[self.room_name] = {}

        # reject connection if username already exists in the same room
        if self.username in online_users[self.room_name]:
            await self.close()
            print(f"Duplicate username '{self.username}' rejected in room '{self.room_name}'.")
            return

        # add user to online_users
        online_users[self.room_name][self.username] = self.channel_name
        print(f"User connected: {self.username} in room '{self.room_name}', Online users: {online_users[self.room_name]}")

        # initialize blocked users set for the user if not present
        if self.username not in blocked_users:
            blocked_users[self.username] = set()

        # add user to room group
        self.room_group_name = f"room_{self.room_name}"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # update online users list for all clients in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "update_online_users",
                "users": list(online_users[self.room_name].keys()),
            }
        )

    async def disconnect(self, close_code):
        # remove user from online_users
        if hasattr(self, 'room_name') and hasattr(self, 'username'):
            if self.room_name in online_users and self.username in online_users[self.room_name]:
                del online_users[self.room_name][self.username]
                print(f"User disconnected: {self.username} from room '{self.room_name}', Online users: {online_users[self.room_name]}")
        
        # remove from group only if 'self.room_group_name' is set
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

            # update online users list for all clients in the room
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
            # handle block and unblock commands
            command = data["command"]
            target_user = data.get("target_user")
            if command == "block" and target_user:
                await self.block_user(target_user)
            elif command == "unblock" and target_user:
                await self.unblock_user(target_user)
            else:
                # send error message for invalid command or missing target_user
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Invalid command or missing target_user."
                }))
        elif "recipient" in data:
            # handle direct message
            recipient = data["recipient"]
            message = data["message"]

            print(f"Direct message from '{self.username}' to '{recipient}' in room '{self.room_name}': {message}")
            print(f"Online users mapping in room '{self.room_name}': {online_users[self.room_name]}")

            # check if recipient is blocked by the user
            if self.username in blocked_users.get(recipient, set()):
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"You are blocked by '{recipient}'."
                }))
                return

            # send direct message to recipient if online
            recipient_channel = online_users[self.room_name].get(recipient)
            if recipient_channel:
                await self.channel_layer.send(
                    recipient_channel,
                    {
                        "type": "direct_message",
                        "sender": self.username,
                        "message": message,
                    }
                )
            else:
                # send error message if recipient is not online
                print(f"Recipient '{recipient}' not found in room '{self.room_name}'")
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"User '{recipient}' is not online in room '{self.room_name}'."
                }))
        elif "message" in data:
            # handle general message
            message = data["message"]

            chat_room = await get_chat_room()
            await create_message(chat_room, message)

            # broadcast message to all clients in the room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "sender": self.username,
                    "message": message,
                }
            )
        else:
            # send error message for unknown message format
            print("Received unknown message format.")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid message format."
            }))

    async def block_user(self, target_user):
        # check if target_user is same as the user
        if target_user == self.username:
            # send error message that you cant block yourself
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "You cannot block yourself."
            }))
            return

        # add target_user to blocked list
        blocked_users[self.username].add(target_user)
        print(f"User '{self.username}' blocked '{target_user}'.")

        # send success message that the target_user is blocked
        await self.send(text_data=json.dumps({
            "type": "block_success",
            "message": f"You have blocked '{target_user}'."
        }))

        # broadcast updated online users list to all clients in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "update_online_users",
                "users": list(online_users[self.room_name].keys()),
            }
        )

    async def unblock_user(self, target_user):
        # if target_user is in blocked list then remove it
        if target_user in blocked_users[self.username]:
            blocked_users[self.username].remove(target_user)
            print(f"User '{self.username}' unblocked '{target_user}'.")

            # send success message that the target_user is unblocked
            await self.send(text_data=json.dumps({
                "type": "unblock_success",
                "message": f"You have unblocked '{target_user}'."
            }))
            
            # broadcast updated online users list to all clients in the room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "update_online_users",
                    "users": list(online_users[self.room_name].keys()),
                }
            )
        else:
            # send error message if target_user is not in blocked list
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": f"User '{target_user}' is not in your blocked list."
            }))

    async def direct_message(self, event):
        # send direct message to the client in question
        await self.send(text_data=json.dumps({
            "type": "direct",
            "sender": event["sender"],
            "message": event["message"],
        }))

    async def chat_message(self, event):
        # broadcast message to all clients in the room
        await self.send(text_data=json.dumps({
            "type": "chat",
            "sender": event["sender"],
            "message": event["message"],
        }))

    async def update_online_users(self, event):
        print(f"Updating online users in room '{self.room_name}': {event['users']}")
        # send updated online users list to clients
        await self.send(text_data=json.dumps({
            "type": "update_users",
            "users": event["users"],
        }))