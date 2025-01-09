from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
from users.models import PongUser

class StatusConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		await self.accept()
		# query_params = parse_qs(self.scope["query_string"].decode())
		# self.username = query_params.get("user_id", [None])[0]
		self.status = True
		# print("user connecting in websocket consumer: " + self.username)
		print("connecting with the online-status consumer")

	async def disconnect(self, close_code):
		print("disconnecting with the online-status consumer")
		self.status = False

	# @database_sync_to_async
	# def set_status(self):
	# 	user = PongUser.objects.filter(username=self.username)
	# 	user.onlineStatus