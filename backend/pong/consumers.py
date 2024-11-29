import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asyncio import create_task, sleep

class PongConsumer(AsyncWebsocketConsumer):
    paddles = {"a": 240, "b": 240}
    ball = {"x": 462, "y": 278, "dx": 1, "dy": 1}
    score = {"a": 0, "b": 0}
    MAX_SCORE = 3
    clients = set()

    async def connect(self):
        await self.accept()
        PongConsumer.clients.add(self)

        # Start the game logic when the first client connects
        if len(PongConsumer.clients) == 1:
            create_task(self.update_ball())
            create_task(self.broadcast_game_state())

    async def disconnect(self, close_code):
        PongConsumer.clients.remove(self)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data["type"] == "paddleMove":
            if data["key"] in ["ArrowUp", "ArrowDown"]:
                PongConsumer.paddles["b"] += -10 if data["key"] == "ArrowUp" else 10
            elif data["key"] in ["w", "s"]:
                PongConsumer.paddles["a"] += -10 if data["key"] == "w" else 10

    @classmethod
    async def broadcast(cls, message):
        for client in cls.clients:
            await client.send(text_data=json.dumps(message))

    async def update_ball(self):
        while True:
            ball = PongConsumer.ball
            paddles = PongConsumer.paddles
            score = PongConsumer.score

            ball["x"] += ball["dx"] * 5
            ball["y"] += ball["dy"] * 5

            if ball["y"] <= 0 or ball["y"] >= 556:
                ball["dy"] *= -1
            if ball["x"] <= 20 and paddles["a"] <= ball["y"] <= paddles["a"] + 100:
                ball["dx"] *= -1
            elif ball["x"] >= 904 and paddles["b"] <= ball["y"] <= paddles["b"] + 100:
                ball["dx"] *= -1

            if ball["x"] < 0:
                score["b"] += 1
                self.reset_ball()
            elif ball["x"] > 924:
                score["a"] += 1
                self.reset_ball()

            if score["a"] >= PongConsumer.MAX_SCORE or score["b"] >= PongConsumer.MAX_SCORE:
                await self.broadcast({"type": "gameOver", "winner": "a" if score["a"] >= PongConsumer.MAX_SCORE else "b"})
                self.reset_game()

            await sleep(0.02)

    async def broadcast_game_state(self):
        while True:
            await self.broadcast({
                "type": "update",
                "paddles": PongConsumer.paddles,
                "ball": PongConsumer.ball,
                "score": PongConsumer.score,
            })
            await sleep(0.005)

    @staticmethod
    def reset_ball():
        PongConsumer.ball = {"x": 462, "y": 278, "dx": -1 if PongConsumer.ball["dx"] > 0 else 1, "dy": 1}

    @staticmethod
    def reset_game():
        PongConsumer.paddles = {"a": 240, "b": 240}
        PongConsumer.score = {"a": 0, "b": 0}
        PongConsumer.reset_ball()
