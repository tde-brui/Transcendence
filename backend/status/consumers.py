from channels.generic.websocket import AsyncWebsocketConsumer

class StatusConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		print("connecting with the online-status consumer")
	async def disconnect(self):
		print("disconnecting with the online-status consumer")