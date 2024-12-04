# consumers.py

import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from asyncio import create_task, sleep, CancelledError
from urllib.parse import parse_qs


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
        self.ball_task = None
        self.broadcast_task = None

    def reset_ball(self):
        self.ball = {
            "x": 462,
            "y": 278,
            "dx": -1 if self.ball["dx"] > 0 else 1,
            "dy": 1,
        }

    def reset_game(self):
        self.paddles = {"a": 240, "b": 240}
        self.score = {"a": 0, "b": 0}
        self.reset_ball()
        self.game_started = False
        # Cancel tasks if they are running
        self.cancel_tasks()

    def cancel_tasks(self):
        if self.ball_task and not self.ball_task.cancelled():
            self.ball_task.cancel()
            self.ball_task = None
        if self.broadcast_task and not self.broadcast_task.cancelled():
            self.broadcast_task.cancel()
            self.broadcast_task = None

    async def add_connection(self, consumer, browser_key):
        # Reconnect logic for the same key
        if browser_key in self.connections:
            old_connection = self.connections[browser_key]
            print(f"Replacing old connection for key {browser_key}")
            old_connection.replaced = True  # Set flag to prevent removal
            await old_connection.close()
        else:
            # Assign paddle if not already assigned
            if len(self.players) < 2:
                paddle = "a" if "a" not in self.players else "b"
                self.players[paddle] = browser_key
            else:
                print("Game full.")
                await consumer.close()
                return
            paddle = next(
                key for key, value in self.players.items() if value == browser_key
            )

        # Store the connection
        self.connections[browser_key] = consumer
        consumer.browser_key = browser_key
        consumer.paddle = paddle
        consumer.game_id = self.game_id

        await consumer.accept()
        await consumer.send(json.dumps({"type": "assignPaddle", "paddle": paddle}))

        print(
            f"Player connected: {paddle} with key {browser_key} to game {self.game_id}"
        )

        await consumer.channel_layer.group_add(self.game_id, consumer.channel_name)

        await self.broadcast(
            {
                "type": "playersConnected",
                "count": len(self.players),
            }
        )

        await self.start_game()

    async def remove_player(self, browser_key):
        if browser_key in self.connections:
            consumer = self.connections[browser_key]
            await consumer.channel_layer.group_discard(
                self.game_id, consumer.channel_name
            )
            del self.connections[browser_key]
        else:
            return

        if hasattr(consumer, "paddle") and consumer.paddle in self.players:
            del self.players[consumer.paddle]
            print(
                f"Player {consumer.paddle} with key {browser_key} disconnected from game {self.game_id}"
            )

        await self.broadcast(
            {
                "type": "playersConnected",
                "count": len(self.players),
            }
        )

        # Stop the game if a player disconnects
        if len(self.players) < 2:
            self.game_started = False
            self.cancel_tasks()
            print(f"Game {self.game_id} paused due to insufficient players.")

    async def start_game(self):
        if len(self.players) == 2 and not self.game_started:
            self.game_started = True
            print(f"Game {self.game_id} started!")
            self.ball_task = create_task(self.update_ball())
            self.broadcast_task = create_task(self.broadcast_game_state())

    async def broadcast(self, message):
        for consumer in self.connections.values():
            await consumer.send(json.dumps(message))

    async def update_ball(self):
        try:
            while self.game_started:
                ball = self.ball
                paddles = self.paddles
                score = self.score

                ball["x"] += ball["dx"] * 5
                ball["y"] += ball["dy"] * 5

                # Ball collision with walls
                if ball["y"] <= 0 or ball["y"] >= 556:
                    ball["dy"] *= -1

                # Ball collision with paddles
                if (
                    ball["x"] <= 20
                    and paddles["a"] <= ball["y"] <= paddles["a"] + 100
                ):
                    ball["dx"] *= -1
                elif (
                    ball["x"] >= 904
                    and paddles["b"] <= ball["y"] <= paddles["b"] + 100
                ):
                    ball["dx"] *= -1

                # Check for goals
                if ball["x"] < 0:
                    score["b"] += 1
                    self.reset_ball()
                elif ball["x"] > 924:
                    score["a"] += 1
                    self.reset_ball()

                # Check for game over
                if score["a"] >= self.MAX_SCORE or score["b"] >= self.MAX_SCORE:
                    winner = "a" if score["a"] >= self.MAX_SCORE else "b"
                    await self.broadcast({"type": "gameOver", "winner": winner})
                    self.reset_game()
                    return  # Exit the loop after game over

                await sleep(0.02)
        except CancelledError:
            print(f"update_ball task for game {self.game_id} was cancelled.")
        except Exception as e:
            print(f"Error in update_ball for game {self.game_id}: {e}")

    async def broadcast_game_state(self):
        try:
            while self.game_started:
                await self.broadcast(
                    {
                        "type": "update",
                        "paddles": self.paddles,
                        "ball": self.ball,
                        "score": self.score,
                    }
                )
                await sleep(0.02)
        except CancelledError:
            print(f"broadcast_game_state task for game {self.game_id} was cancelled.")
        except Exception as e:
            print(f"Error in broadcast_game_state for game {self.game_id}: {e}")


class GameManager:
    instance = None

    def __init__(self):
        self.waiting_players = []  # Queue of (consumer, browser_key) waiting for a game
        self.games = {}  # Map of game_id to Game instance
        self.browser_key_to_game = {}  # Map of browser_key to game_id

    @classmethod
    def get_instance(cls):
        if not cls.instance:
            cls.instance = GameManager()
        return cls.instance

    async def add_player(self, consumer, browser_key):
        # If the player is already in a game, reconnect them
        if browser_key in self.browser_key_to_game:
            game_id = self.browser_key_to_game[browser_key]
            game = self.games.get(game_id)
            if game:
                await game.add_connection(consumer, browser_key)
                return game
            else:
                # Game no longer exists, remove mapping
                del self.browser_key_to_game[browser_key]

        # Add player to the waiting queue
        self.waiting_players.append((consumer, browser_key))
        print(f"Player with key {browser_key} added to waiting queue.")

        # If there are at least two players, create a new game
        if len(self.waiting_players) >= 2:
            player1, key1 = self.waiting_players.pop(0)
            player2, key2 = self.waiting_players.pop(0)
            game_id = str(uuid.uuid4())
            game = Game(game_id)
            self.games[game_id] = game
            self.browser_key_to_game[key1] = game_id
            self.browser_key_to_game[key2] = game_id
            await game.add_connection(player1, key1)
            await game.add_connection(player2, key2)
            return game
        else:
            # Wait for another player
            return None

    async def remove_player(self, browser_key):
        # Remove player from any game they're in
        if browser_key in self.browser_key_to_game:
            game_id = self.browser_key_to_game[browser_key]
            game = self.games.get(game_id)
            if game:
                await game.remove_player(browser_key)
                # If the game has no players, remove it
                if not game.players:
                    game.cancel_tasks()
                    del self.games[game_id]
                    print(f"Game {game_id} has been removed.")
            del self.browser_key_to_game[browser_key]
        else:
            # Remove from waiting players if they're there
            self.waiting_players = [
                (consumer, key)
                for consumer, key in self.waiting_players
                if key != browser_key
            ]


game_manager = GameManager.get_instance()


class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_params = parse_qs(self.scope["query_string"].decode())
        browser_key = query_params.get("key", [None])[0]

        if not browser_key:
            print("Connection rejected: Missing browser key.")
            await self.close()
            return

        self.replaced = False  # Initialize the replaced flag

        game = await game_manager.add_player(self, browser_key)
        if game:
            self.game_id = game.game_id
        else:
            # Waiting for another player
            print(f"Player with key {browser_key} is waiting for an opponent.")

    async def disconnect(self, close_code):
        if getattr(self, 'replaced', False):
            # Disconnection due to replacement; do not remove player
            print(f"Connection for key {self.browser_key} was replaced. Skipping removal.")
            return

        if hasattr(self, "browser_key"):
            await game_manager.remove_player(self.browser_key)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data["type"] == "paddleMove" and hasattr(self, "paddle"):
            # Find the game this consumer is part of
            game_id = self.game_id
            game = game_manager.games.get(game_id)
            if game:
                if data["key"] in ["w", "s"] and self.paddle == "a":
                    game.paddles["a"] += -10 if data["key"] == "w" else 10
                elif data["key"] in ["ArrowUp", "ArrowDown"] and self.paddle == "b":
                    game.paddles["b"] += -10 if data["key"] == "ArrowUp" else 10

    # Methods to handle messages sent to the group
    async def players_connected(self, event):
        await self.send(
            json.dumps({"type": "playersConnected", "count": event["count"]})
        )

    async def send_update(self, event):
        await self.send(json.dumps(event))

    async def game_over(self, event):
        await self.send(json.dumps({"type": "gameOver", "winner": event["winner"]}))
