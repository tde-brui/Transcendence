import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asyncio import create_task, sleep
from urllib.parse import parse_qs

class PongConsumer(AsyncWebsocketConsumer):
    paddles = {"a": 240, "b": 240}
    ball = {"x": 462, "y": 278, "dx": 1, "dy": 1}
    score = {"a": 0, "b": 0}
    MAX_SCORE = 3
    players = {}  # Track WebSocket connections (socket -> paddle)
    browser_keys = set()  # Track unique browser keys
    game_started = False

    async def connect(self):
        query_params = parse_qs(self.scope["query_string"].decode())
        browser_key = query_params.get("key", [None])[0]

        if not browser_key:
            print("Connection rejected: Missing browser key.")
            await self.close()
            return

        if browser_key in PongConsumer.browser_keys:
            print(f"Connection rejected: Duplicate key {browser_key}. Current browser_keys: {PongConsumer.browser_keys}")
            await self.close()
            return

        if len(PongConsumer.players) < 2:
            paddle = "a" if "a" not in PongConsumer.players.values() else "b"
            PongConsumer.players[self] = paddle
            PongConsumer.browser_keys.add(browser_key)

            await self.accept()
            await self.send(json.dumps({"type": "assignPaddle", "paddle": paddle}))
            print(f"Player connected: {paddle} with key {browser_key}")
            print(f"Current players: {PongConsumer.players}")

            await self.broadcast(
                {"type": "playersConnected", "count": len(PongConsumer.players)}
            )

            if len(PongConsumer.players) == 2 and not PongConsumer.game_started:
                PongConsumer.game_started = True
                print("Game started!")
                create_task(self.update_ball())
                create_task(self.broadcast_game_state())
        else:
            print("Connection rejected: Game full")
            await self.close()

    async def disconnect(self, close_code):
        query_params = parse_qs(self.scope["query_string"].decode())
        browser_key = query_params.get("key", [None])[0]

        if browser_key in PongConsumer.browser_keys:
            PongConsumer.browser_keys.discard(browser_key)
            print(f"Removed browser key {browser_key} on disconnect.")

        if self in PongConsumer.players:
            paddle = PongConsumer.players.pop(self)
            print(f"Player {paddle} with key {browser_key} disconnected.")

        PongConsumer.game_started = False  # Stop the game if a player disconnects

        await self.broadcast(
            {"type": "playersConnected", "count": len(PongConsumer.players)}
        )

    async def receive(self, text_data):
        # Handle paddle movements
        data = json.loads(text_data)
        paddle = PongConsumer.players.get(self)  # Get player's assigned paddle

        if data["type"] == "paddleMove" and paddle:
            if data["key"] in ["w", "s"] and paddle == "a":
                PongConsumer.paddles["a"] += -10 if data["key"] == "w" else 10
            elif data["key"] in ["ArrowUp", "ArrowDown"] and paddle == "b":
                PongConsumer.paddles["b"] += -10 if data["key"] == "ArrowUp" else 10

    @classmethod
    async def broadcast(cls, message):
        # Broadcast message to all connected players
        for player in cls.players.keys():
            await player.send(text_data=json.dumps(message))

    async def update_ball(self):
        # Update ball position and handle collisions
        while PongConsumer.game_started:
            ball = PongConsumer.ball
            paddles = PongConsumer.paddles
            score = PongConsumer.score

            ball["x"] += ball["dx"] * 5
            ball["y"] += ball["dy"] * 5

            # Ball collision with walls
            if ball["y"] <= 0 or ball["y"] >= 556:
                ball["dy"] *= -1

            # Ball collision with paddles
            if ball["x"] <= 20 and paddles["a"] <= ball["y"] <= paddles["a"] + 100:
                ball["dx"] *= -1
            elif ball["x"] >= 904 and paddles["b"] <= ball["y"] <= paddles["b"] + 100:
                ball["dx"] *= -1

            # Check for goals
            if ball["x"] < 0:
                score["b"] += 1
                self.reset_ball()
            elif ball["x"] > 924:
                score["a"] += 1
                self.reset_ball()

            # Check for game over
            if score["a"] >= PongConsumer.MAX_SCORE or score["b"] >= PongConsumer.MAX_SCORE:
                winner = "a" if score["a"] >= PongConsumer.MAX_SCORE else "b"
                await self.broadcast({"type": "gameOver", "winner": winner})
                self.reset_game()

            await sleep(0.02)

    async def broadcast_game_state(self):
        # Broadcast the game state periodically
        while PongConsumer.game_started:
            await self.broadcast({
                "type": "update",
                "paddles": PongConsumer.paddles,
                "ball": PongConsumer.ball,
                "score": PongConsumer.score,
            })
            await sleep(0.005)

    @staticmethod
    def reset_ball():
        # Reset ball to center
        PongConsumer.ball = {"x": 462, "y": 278, "dx": -1 if PongConsumer.ball["dx"] > 0 else 1, "dy": 1}

    @staticmethod
    def reset_game():
        # Reset game state
        PongConsumer.paddles = {"a": 240, "b": 240}
        PongConsumer.score = {"a": 0, "b": 0}
        PongConsumer.reset_ball()
