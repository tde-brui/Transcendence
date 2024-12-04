import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asyncio import create_task, sleep
from urllib.parse import parse_qs

class GameManager:
    instance = None

    def __init__(self):
        self.games = {}  # Map from game_id to Game instance
        self.game_counter = 0  # To assign unique game IDs
        self.browser_key_to_channel = {}  # Map from browser_key to channel_name
        self.browser_key_to_game = {}  # Map from browser_key to game instance

    @classmethod
    def get_instance(cls):
        if not cls.instance:
            cls.instance = GameManager()
        return cls.instance

    def get_or_create_game(self):
        # Look for a game that is not full
        for game_id, game in self.games.items():
            if len(game.players) < 2:
                return game

        # No available game, create a new one
        self.game_counter += 1
        game_id = f'game_{self.game_counter}'
        new_game = Game(game_id)
        self.games[game_id] = new_game
        return new_game

    def remove_game(self, game_id):
        if game_id in self.games:
            del self.games[game_id]

class Game:
    def __init__(self, game_id):
        self.game_id = game_id
        self.paddles = {"a": 240, "b": 240}
        self.ball = {"x": 462, "y": 278, "dx": 1, "dy": 1}
        self.score = {"a": 0, "b": 0}
        self.MAX_SCORE = 3
        self.players = {}  # Map from paddle to browser_key
        self.connections = {}  # Map from browser_key to WebSocket connection
        self.game_started = False

    def reset_ball(self):
        self.ball = {"x": 462, "y": 278, "dx": -1 if self.ball["dx"] > 0 else 1, "dy": 1}

    def reset_game(self):
        self.paddles = {"a": 240, "b": 240}
        self.score = {"a": 0, "b": 0}
        self.reset_ball()
        self.game_started = False

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_params = parse_qs(self.scope["query_string"].decode())
        browser_key = query_params.get("key", [None])[0]

        if not browser_key:
            print("Connection rejected: Missing browser key.")
            await self.close()
            return

        game_manager = GameManager.get_instance()

        # Reconnect logic for the same key
        if browser_key in game_manager.browser_key_to_channel:
            old_channel_name = game_manager.browser_key_to_channel[browser_key]
            print(f"Replacing old connection for key {browser_key}")
            # Send a message to the old connection to close itself
            await self.channel_layer.send(
                old_channel_name,
                {
                    'type': 'force_disconnect',
                }
            )

        # Assign to a game
        game = game_manager.get_or_create_game()
        self.game = game
        self.game_id = game.game_id
        self.game_group_name = f'game_{self.game_id}'

        # Store the browser_key and channel_name globally
        self.browser_key = browser_key
        self.channel_name = self.channel_name  # Ensure channel_name is set
        game_manager.browser_key_to_channel[browser_key] = self.channel_name
        game_manager.browser_key_to_game[browser_key] = game

        # Assign paddle
        if browser_key not in game.players.values():
            if len(game.players) < 2:
                paddle = 'a' if 'a' not in game.players else 'b'
                game.players[paddle] = browser_key
            else:
                print("Connection rejected: Game full.")
                await self.close()
                return
        else:
            paddle = next(key for key, value in game.players.items() if value == browser_key)

        self.paddle = paddle

        await self.accept()
        await self.send(json.dumps({"type": "assignPaddle", "paddle": paddle}))

        print(f"Player connected: {paddle} with key {browser_key} to game {self.game_id}")

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)

        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'players_connected',
                'count': len(game.players)
            }
        )

        if len(game.players) == 2 and not game.game_started:
            game.game_started = True
            print(f"Game {self.game_id} started!")
            self.update_ball_task = create_task(self.update_ball())
            self.broadcast_game_state_task = create_task(self.broadcast_game_state())

    async def disconnect(self, close_code):
        game_manager = GameManager.get_instance()

        # Remove from global mappings
        if hasattr(self, 'browser_key'):
            if self.browser_key in game_manager.browser_key_to_channel:
                del game_manager.browser_key_to_channel[self.browser_key]
            if self.browser_key in game_manager.browser_key_to_game:
                game = game_manager.browser_key_to_game[self.browser_key]
                if hasattr(self, 'paddle') and self.paddle in game.players:
                    del game.players[self.paddle]
                    print(f"Player {self.paddle} with key {self.browser_key} disconnected from game {self.game_id}.")

                if self.browser_key in game.connections:
                    del game.connections[self.browser_key]

                del game_manager.browser_key_to_game[self.browser_key]

                # Check if game should be removed
                if len(game.players) == 0:
                    # Cancel tasks if they are running
                    if hasattr(self, 'update_ball_task'):
                        self.update_ball_task.cancel()
                    if hasattr(self, 'broadcast_game_state_task'):
                        self.broadcast_game_state_task.cancel()

                    game_manager.remove_game(self.game_id)
                    print(f"Game {self.game_id} removed due to no players.")

        if hasattr(self, 'game_group_name'):
            await self.channel_layer.group_discard(self.game_group_name, self.channel_name)

            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'players_connected',
                    'count': len(self.game.players) if hasattr(self, 'game') else 0
                }
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data["type"] == "paddleMove" and hasattr(self, 'paddle'):
            game = self.game
            if data["key"] in ["w", "s"] and self.paddle == "a":
                game.paddles["a"] += -10 if data["key"] == "w" else 10
            elif data["key"] in ["ArrowUp", "ArrowDown"] and self.paddle == "b":
                game.paddles["b"] += -10 if data["key"] == "ArrowUp" else 10

    async def players_connected(self, event):
        try:
            await self.send(text_data=json.dumps({"type": "playersConnected", "count": event['count']}))
        except Exception as e:
            print(f"Error sending players_connected message: {e}")

    async def send_update(self, event):
        try:
            await self.send(text_data=json.dumps(event['message']))
        except Exception as e:
            print(f"Error sending game update: {e}")

    async def update_ball(self):
        game = self.game
        
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
        game = self.game
        while game.game_started:
            await self.channel_layer.group_send(
                self.game_group_name,
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
        try:
            await self.send(text_data=json.dumps({"type": "gameOver", "winner": event['winner']}))
        except Exception as e:
            print(f"Error sending game over message: {e}")

    async def force_disconnect(self, event):
        await self.close()
