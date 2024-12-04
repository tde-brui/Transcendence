import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asyncio import create_task, sleep
from urllib.parse import parse_qs
import uuid

class Game:
    def __init__(self, game_id):
        self.game_id = game_id
        self.paddles = {"a": 50, "b": 50}  # Percentages
        self.ball = {"x": 50, "y": 50, "dx": 1, "dy": 1}  # Percentages
        self.score = {"a": 0, "b": 0}
        self.MAX_SCORE = 3
        self.players = {}  # Map from paddle ('a' or 'b') to browser_key
        self.connections = {}  # Map from browser_key to WebSocket connection
        self.game_started = False

    def reset_ball(self):
        self.ball = {
            "x": 50,
            "y": 50,
            "dx": -1 if self.ball["dx"] > 0 else 1,
            "dy": 1
        }

    def reset_game(self):
        self.paddles = {"a": 50, "b": 50}
        self.score = {"a": 0, "b": 0}
        self.reset_ball()
        self.game_started = False

class GameManager:
    instance = None

    def __init__(self):
        self.games = {}  # Map from game_id to Game instance
        self.waiting_game = None  # Game that is waiting for a second player

    @classmethod
    def get_instance(cls):
        if not cls.instance:
            cls.instance = GameManager()
        return cls.instance

    def assign_player_to_game(self, browser_key):
        # Check if there's a game waiting for a second player
        if self.waiting_game and len(self.waiting_game.players) < 2:
            game = self.waiting_game
            paddle = 'b'
            self.waiting_game = None  # No longer waiting
        else:
            # Create a new game
            game_id = str(uuid.uuid4())
            game = Game(game_id)
            self.games[game_id] = game
            paddle = 'a'
            self.waiting_game = game  # This game is waiting for a second player

        game.players[paddle] = browser_key
        return game, paddle

    def remove_game(self, game_id):
        if game_id in self.games:
            del self.games[game_id]

game_manager = GameManager.get_instance()

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_params = parse_qs(self.scope["query_string"].decode())
        browser_key = query_params.get("key", [None])[0]

        if not browser_key:
            print("Connection rejected: Missing browser key.")
            await self.close()
            return

        # Assign player to a game
        self.game, self.paddle = game_manager.assign_player_to_game(browser_key)
        self.browser_key = browser_key
        self.game.connections[browser_key] = self

        await self.accept()
        await self.send(json.dumps({"type": "assignPaddle", "paddle": self.paddle}))
        print(f"Player connected: {self.paddle} with key {browser_key} in game {self.game.game_id}")

        # Create a unique group for this game
        self.group_name = f'game_{self.game.game_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # Notify players about connection count
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'players_connected',
                'count': len(self.game.players)
            }
        )

        # Start the game if both players are connected
        if len(self.game.players) == 2 and not self.game.game_started:
            self.game.game_started = True
            print(f"Game {self.game.game_id} started!")
            create_task(self.update_ball())
            create_task(self.broadcast_game_state())

    async def disconnect(self, close_code):
        if hasattr(self, 'browser_key') and self.browser_key in self.game.connections:
            del self.game.connections[self.browser_key]

        if hasattr(self, 'paddle') and self.paddle in self.game.players:
            del self.game.players[self.paddle]
            print(f"Player {self.paddle} with key {self.browser_key} disconnected from game {self.game.game_id}.")

        await self.channel_layer.group_discard(self.group_name, self.channel_name)

        # If no players are left, remove the game
        if not self.game.players:
            game_manager.remove_game(self.game.game_id)
            print(f"Game {self.game.game_id} removed due to no players.")

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data["type"] == "paddleMove" and hasattr(self, 'paddle'):
            if data["key"] in ["w", "s"] and self.paddle == "a":
                self.game.paddles["a"] += -5 if data["key"] == "w" else 5
                self.game.paddles["a"] = max(0, min(100, self.game.paddles["a"]))  # Keep within bounds
            elif data["key"] in ["ArrowUp", "ArrowDown"] and self.paddle == "b":
                self.game.paddles["b"] += -5 if data["key"] == "ArrowUp" else 5
                self.game.paddles["b"] = max(0, min(100, self.game.paddles["b"]))  # Keep within bounds

    async def players_connected(self, event):
        await self.send(text_data=json.dumps({"type": "playersConnected", "count": event['count']}))

    async def send_update(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def update_ball(self):
        while self.game.game_started:
            ball = self.game.ball
            paddles = self.game.paddles
            score = self.game.score

            ball["x"] += ball["dx"] * 0.5  # Adjust speed as needed
            ball["y"] += ball["dy"] * 0.5

            # Ball collision with walls
            if ball["y"] <= 0 or ball["y"] >= 100:
                ball["dy"] *= -1

            # Ball collision with paddles
            if ball["x"] <= 5 and paddles["a"] <= ball["y"] <= paddles["a"] + 20:
                ball["dx"] *= -1
            elif ball["x"] >= 95 and paddles["b"] <= ball["y"] <= paddles["b"] + 20:
                ball["dx"] *= -1

            # Check for goals
            if ball["x"] < 0:
                score["b"] += 1
                self.game.reset_ball()
            elif ball["x"] > 100:
                score["a"] += 1
                self.game.reset_ball()

            # Check for game over
            if score["a"] >= self.game.MAX_SCORE or score["b"] >= self.game.MAX_SCORE:
                winner = "a" if score["a"] >= self.game.MAX_SCORE else "b"
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'game_over',
                        'winner': winner
                    }
                )
                self.game.reset_game()

            await sleep(0.02)

    async def broadcast_game_state(self):
        while self.game.game_started:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'send_update',
                    'message': {
                        "type": "update",
                        "paddles": self.game.paddles,
                        "ball": self.game.ball,
                        "score": self.game.score,
                    }
                }
            )
            await sleep(0.02)

    async def game_over(self, event):
        await self.send(text_data=json.dumps({"type": "gameOver", "winner": event['winner']}))
