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
        # Dictionary to track paddle directions: -1 = up, 0 = stop, 1 = down
        self.paddle_directions = {"a": 0, "b": 0}

    def reset_ball(self):
        self.ball = {"x": 462, "y": 278, "dx": -1 if self.ball["dx"] > 0 else 1, "dy": 1}

    def reset_game(self):
        self.paddles = {"a": 240, "b": 240}
        self.score = {"a": 0, "b": 0}
        self.reset_ball()
        self.game_started = False
        self.paddle_directions = {"a": 0, "b": 0}

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Parse query parameters
        query_params = parse_qs(self.scope["query_string"].decode())
        browser_key = query_params.get("key", [None])[0]
        lobby_id = query_params.get("lobby", [None])[0]

        if not browser_key:
            print("Connection rejected: Missing browser key.")
            await self.close()
            return

        game_manager = GameManager.get_instance()

        if lobby_id:
            # Specific lobby requested
            if lobby_id in game_manager.games:
                game = game_manager.games[lobby_id]
                if len(game.players) >= 2:
                    print(f"Connection rejected: Game {lobby_id} is full.")
                    await self.close()
                    return
            else:
                # Create a new specific lobby
                game = Game(lobby_id)
                game_manager.games[lobby_id] = game
        else:
            # No specific lobby requested
            game = game_manager.get_or_create_game()

        self.game = game
        self.game_id = game.game_id
        self.game_group_name = f'game_{self.game_id}'

        self.browser_key = browser_key
        self.channel_name = self.channel_name
        game_manager.browser_key_to_channel[browser_key] = self.channel_name
        game_manager.browser_key_to_game[browser_key] = game

        # Assign paddle
        if browser_key not in game.players.values():
            if len(game.players) < 2:
                paddle = 'a' if 'a' not in game.players else 'b'
                game.players[paddle] = browser_key
                print(f"Paddle {paddle.upper()} assigned to browser_key {browser_key}")
            else:
                print(f"Connection rejected: Game {self.game_id} is full.")
                await self.close()
                return
        else:
            paddle = next(k for k, v in game.players.items() if v == browser_key)
            print(f"Paddle {paddle.upper()} reassigned to existing browser_key {browser_key}")

        self.paddle = paddle

        await self.accept()
        await self.send(json.dumps({
            "type": "assignPaddle",
            "paddle": paddle,
            "game_id": self.game_id,
            "players": self.game.players  # This should be a dict: {'a': usernameA, 'b': usernameB}
        }))

        print(f"Player connected: {paddle.upper()} with key {browser_key} to game {self.game_id}")

        # Add to the game group
        await self.channel_layer.group_add(self.game_group_name, self.channel_name)

        # Broadcast updated players to all in the group
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'players_connected',
                'count': len(game.players),
                'players': game.players  # Include the updated players dict
            }
        )

        # Start the game if two players are connected and game hasn't started
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
                    print(f"Player {self.paddle.upper()} with key {self.browser_key} disconnected from game {self.game_id}.")

                if self.browser_key in game.connections:
                    del game.connections[self.browser_key]

                del game_manager.browser_key_to_game[self.browser_key]

        if hasattr(self, 'game_group_name'):
            await self.channel_layer.group_discard(self.game_group_name, self.channel_name)

            # Broadcast updated players to all in the group
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'players_connected',
                    'count': len(self.game.players) if hasattr(self, 'game') else 0,
                    'players': self.game.players if hasattr(self, 'game') else {}
                }
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if hasattr(self, 'paddle'):  # Ensure we have a paddle assigned
            game = self.game
            # Handle paddle movement
            if data.get("type") == "paddleMove":
                if data.get("key") == "up":
                    if self.paddle == "a":
                        game.paddle_directions["a"] = -1
                    elif self.paddle == "b":
                        game.paddle_directions["b"] = -1
                elif data.get("key") == "down":
                    if self.paddle == "a":
                        game.paddle_directions["a"] = 1
                    elif self.paddle == "b":
                        game.paddle_directions["b"] = 1
            elif data.get("type") == "paddleStop":
                if self.paddle == "a":
                    game.paddle_directions["a"] = 0
                elif self.paddle == "b":
                    game.paddle_directions["b"] = 0

    async def players_connected(self, event):
        try:
            print(f"Players connected updated: {event['count']}, players: {event.get('players')}")
            await self.send(text_data=json.dumps({
                "type": "playersConnected",
                "count": event['count'],
                "players": event.get('players', {})
            }))
        except Exception as e:
            print(f"Error sending players_connected message: {e}")

    async def send_update(self, event):
        try:
            await self.send(text_data=json.dumps(event['message']))
        except Exception as e:
            print(f"Error sending game update: {e}")

    async def update_ball(self):
        game = self.game

        # Define paddle movement speed per tick
        paddle_speed = 5
        # Define bounds for paddle positions
        min_paddle_pos = 0
        max_paddle_pos = 456  # 556 (field height) - 100 (paddle height)

        while game.game_started:
            ball = game.ball
            paddles = game.paddles
            score = game.score

            # Move the paddles at a fixed rate based on their direction
            paddles["a"] += game.paddle_directions["a"] * paddle_speed
            paddles["b"] += game.paddle_directions["b"] * paddle_speed

            # Clamp paddle positions
            paddles["a"] = max(min_paddle_pos, min(max_paddle_pos, paddles["a"]))
            paddles["b"] = max(min_paddle_pos, min(max_paddle_pos, paddles["b"]))

            # Move the ball
            ball["x"] += ball["dx"] * 5
            ball["y"] += ball["dy"] * 5

            # Ball collision with top/bottom walls
            if ball["y"] <= 0 or ball["y"] >= 556:
                ball["dy"] *= -1

            # Ball collision with paddles
            # Paddle A is at x=0 to ~20, Paddle B is at x=~904 to 924
            if ball["x"] <= 20 and paddles["a"] <= ball["y"] <= paddles["a"] + 100:
                ball["dx"] *= -1
            elif ball["x"] >= 904 and paddles["b"] <= ball["y"] <= paddles["b"] + 100:
                ball["dx"] *= -1

            # Check for goals
            if ball["x"] < 0:
                score["b"] += 1
                print(f"Player B scored! Score: {score['a']} - {score['b']}")
                # Send an 'update' message with the new score
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
                game.reset_ball()
            elif ball["x"] > 924:
                score["a"] += 1
                print(f"Player A scored! Score: {score['a']} - {score['b']}")
                # Send an 'update' message with the new score
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
                game.reset_ball()

            # Check for game over
            if score["a"] >= game.MAX_SCORE or score["b"] >= game.MAX_SCORE:
                winner_paddle = "a" if score["a"] >= game.MAX_SCORE else "b"
                winner_username = game.players.get(winner_paddle, "Unknown")
                print(f"Game over! Winner: {winner_username}")
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'game_over',
                        'winner': winner_username
                    }
                )
                game.reset_game()

            await sleep(0.02)  # 20ms tick

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
            await sleep(0.02)  # 20ms tick

    async def game_over(self, event):
        try:
            print(f"Sending game over to clients: winner={event['winner']}")
            await self.send(text_data=json.dumps({"type": "gameOver", "winner": event['winner']}))
        except Exception as e:
            print(f"Error sending game over message: {e}")

    async def force_disconnect(self, event):
        await self.close()
