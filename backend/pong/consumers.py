import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asyncio import create_task, sleep
from urllib.parse import parse_qs

class Game:
    instance = None

    def __init__(self):
        self.paddles = {"a": 240, "b": 240}
        self.ball = {"x": 462, "y": 278, "dx": 1, "dy": 1}
        self.score = {"a": 0, "b": 0}
        self.MAX_SCORE = 3
        self.players = {}  # Map from paddle to browser_key
        self.game_started = False

    @classmethod
    def get_instance(cls):
        if not cls.instance:
            cls.instance = Game()
        return cls.instance

    def reset_ball(self):
        self.ball = {"x": 462, "y": 278, "dx": -1 if self.ball["dx"] > 0 else 1, "dy": 1}

    def reset_game(self):
        self.paddles = {"a": 240, "b": 240}
        self.score = {"a": 0, "b": 0}
        self.reset_ball()
        self.game_started = False

game = Game.get_instance()

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get browser_key from query params
        query_params = parse_qs(self.scope["query_string"].decode())
        browser_key = query_params.get("key", [None])[0]

        if not browser_key:
            print("Connection rejected: Missing browser key.")
            await self.close()
            return

        # Check if the browser_key is already in use
        if browser_key in game.players.values():
            print(f"Connection rejected: Duplicate key {browser_key}.")
            await self.close()
            return

        # Assign paddle
        if len(game.players) < 2:
            if 'a' not in game.players:
                self.paddle = 'a'
            else:
                self.paddle = 'b'

            game.players[self.paddle] = browser_key
            self.browser_key = browser_key

            await self.accept()
            await self.send(json.dumps({"type": "assignPaddle", "paddle": self.paddle}))
            print(f"Player connected: {self.paddle} with key {browser_key}")

            await self.channel_layer.group_add('players', self.channel_name)

            await self.channel_layer.group_send(
                'players',
                {
                    'type': 'players_connected',
                    'count': len(game.players)
                }
            )

            if len(game.players) == 2 and not game.game_started:
                game.game_started = True
                print("Game started!")
                create_task(self.update_ball())
                create_task(self.broadcast_game_state())
        else:
            print("Connection rejected: Game full")
            await self.close()

    async def disconnect(self, close_code):
        # Remove player
        if hasattr(self, 'paddle') and self.paddle in game.players:
            del game.players[self.paddle]
            print(f"Player {self.paddle} with key {self.browser_key} disconnected.")

            game.game_started = False  # Stop the game if a player disconnects

            await self.channel_layer.group_discard('players', self.channel_name)

            await self.channel_layer.group_send(
                'players',
                {
                    'type': 'players_connected',
                    'count': len(game.players)
                }
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data["type"] == "paddleMove" and hasattr(self, 'paddle'):
            if data["key"] in ["w", "s"] and self.paddle == "a":
                game.paddles["a"] += -10 if data["key"] == "w" else 10
            elif data["key"] in ["ArrowUp", "ArrowDown"] and self.paddle == "b":
                game.paddles["b"] += -10 if data["key"] == "ArrowUp" else 10

    async def players_connected(self, event):
        await self.send(text_data=json.dumps({"type": "playersConnected", "count": event['count']}))

    async def send_update(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def update_ball(self):
        while game.game_started:
            ball = game.ball
            paddles = game.paddles
            score = game.score

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
                game.reset_ball()
            elif ball["x"] > 924:
                score["a"] += 1
                game.reset_ball()

            # Check for game over
            if score["a"] >= game.MAX_SCORE or score["b"] >= game.MAX_SCORE:
                winner = "a" if score["a"] >= game.MAX_SCORE else "b"
                await self.channel_layer.group_send(
                    'players',
                    {
                        'type': 'game_over',
                        'winner': winner
                    }
                )
                game.reset_game()

            await sleep(0.02)

    async def broadcast_game_state(self):
        while game.game_started:
            await self.channel_layer.group_send(
                'players',
                {
                    'type': 'send_update',
                    'message': {
                        "type": "update",
                        "paddles": game.paddles,
                        "ball": game.ball,
                        "score": game.score,
                    }
                }
            )
            await sleep(0.02)

    async def game_over(self, event):
        await self.send(text_data=json.dumps({"type": "gameOver", "winner": event['winner']}))
