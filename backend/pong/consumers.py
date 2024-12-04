import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from asyncio import create_task, sleep
from urllib.parse import parse_qs

class Game:
    def __init__(self, game_id):
        self.game_id = game_id
        self.paddles = {"a": 240, "b": 240}
        self.ball = {"x": 462, "y": 278, "dx": 1, "dy": 1}
        self.score = {"a": 0, "b": 0}
        self.MAX_SCORE = 3
        self.players = {}  # Map from paddle ('a' or 'b') to (browser_key, consumer)
        self.game_started = False
        self.update_task = None
        self.broadcast_task = None

    def add_player(self, paddle, browser_key, consumer):
        self.players[paddle] = (browser_key, consumer)
        if len(self.players) == 2 and not self.game_started:
            self.start_game()

    def remove_player(self, browser_key):
        # Remove player from the game
        paddle_to_remove = None
        for paddle, (key, _) in self.players.items():
            if key == browser_key:
                paddle_to_remove = paddle
                break
        if paddle_to_remove:
            del self.players[paddle_to_remove]
            # Notify remaining player that the opponent disconnected
            if self.players:
                _, remaining_consumer = next(iter(self.players.values()))
                create_task(remaining_consumer.send(text_data=json.dumps({
                    'type': 'opponentDisconnected'
                })))
            # Stop the game
            self.stop_game()

    def start_game(self):
        self.game_started = True
        print(f"Game {self.game_id} started!")
        # Start the update and broadcast tasks
        self.update_task = create_task(self.update_ball())
        self.broadcast_task = create_task(self.broadcast_game_state())

    def stop_game(self):
        self.game_started = False
        if self.update_task:
            self.update_task.cancel()
        if self.broadcast_task:
            self.broadcast_task.cancel()

    def reset_ball(self):
        self.ball = {"x": 462, "y": 278, "dx": -1 if self.ball["dx"] > 0 else 1, "dy": 1}

    def reset_game(self):
        self.paddles = {"a": 240, "b": 240}
        self.score = {"a": 0, "b": 0}
        self.reset_ball()
        self.game_started = False

    async def update_ball(self):
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
            if score["a"] >= self.MAX_SCORE or score["b"] >= self.MAX_SCORE:
                winner = "a" if score["a"] >= self.MAX_SCORE else "b"
                await self.send_to_players({
                    "type": "gameOver",
                    "winner": winner
                })
                self.reset_game()

            await sleep(0.02)

    async def broadcast_game_state(self):
        while self.game_started:
            await self.send_to_players({
                "type": "update",
                "paddles": self.paddles,
                "ball": self.ball,
                "score": self.score,
            })
            await sleep(0.02)

    async def send_to_players(self, message):
        for _, (_, consumer) in self.players.items():
            await consumer.send(text_data=json.dumps(message))

class GameManager:
    def __init__(self):
        self.games = {}  # Map from game_id to Game instance
        self.waiting_players = []  # List of (browser_key, consumer)

    def get_game_for_player(self, browser_key):
        for game in self.games.values():
            if any(key == browser_key for key, _ in game.players.values()):
                return game
        return None

    def add_player(self, browser_key, consumer):
        # Check if player is already in a game
        game = self.get_game_for_player(browser_key)
        if game:
            # Update the consumer in case of reconnection
            for paddle, (key, _) in game.players.items():
                if key == browser_key:
                    game.players[paddle] = (browser_key, consumer)
            return game

        # Check if player is already in waiting list
        if any(key == browser_key for key, _ in self.waiting_players):
            print(f"Player with key {browser_key} is already in waiting list.")
            return None

        # Add player to waiting list
        self.waiting_players.append((browser_key, consumer))
        if len(self.waiting_players) >= 2:
            # Ensure the two players are not the same
            player1_key, player1_consumer = self.waiting_players.pop(0)
            player2_key, player2_consumer = self.waiting_players.pop(0)

            # Check if both players have the same key
            if player1_key == player2_key:
                print("Cannot start a game with the same player.")
                # Put the second player back into the waiting list
                self.waiting_players.insert(0, (player2_key, player2_consumer))
                return None

            game_id = str(uuid.uuid4())
            game = Game(game_id)
            self.games[game_id] = game
            game.add_player('a', player1_key, player1_consumer)
            game.add_player('b', player2_key, player2_consumer)
            # Send assignPaddle message to players
            create_task(player1_consumer.send(text_data=json.dumps({
                "type": "assignPaddle",
                "paddle": 'a',
                "game_id": game_id
            })))
            create_task(player2_consumer.send(text_data=json.dumps({
                "type": "assignPaddle",
                "paddle": 'b',
                "game_id": game_id
            })))
            return game
        else:
            return None

    def remove_player(self, browser_key):
        # Remove player from waiting list if they are there
        self.waiting_players = [p for p in self.waiting_players if p[0] != browser_key]

        # Remove player from any game they are in
        game = self.get_game_for_player(browser_key)
        if game:
            game.remove_player(browser_key)
            if not game.players:
                # No players left, remove the game
                del self.games[game.game_id]

    def get_games_info(self):
        # Return list of games with their IDs and number of players
        games_info = []
        for game_id, game in self.games.items():
            games_info.append({
                'game_id': game_id,
                'players': len(game.players)
            })
        return games_info

game_manager = GameManager()

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_params = parse_qs(self.scope["query_string"].decode())
        browser_key = query_params.get("key", [None])[0]

        if not browser_key:
            print("Connection rejected: Missing browser key.")
            await self.close()
            return

        # Assign browser_key and consumer
        self.browser_key = browser_key
        self.consumer = self

        await self.accept()

        # Add player to game
        game = game_manager.add_player(browser_key, self)
        self.game = game

        if game:
            # Send list of current games to all players
            games_info = game_manager.get_games_info()
            await self.channel_layer.group_send(
                'lobby',
                {
                    'type': 'games_info',
                    'games': games_info
                }
            )
        else:
            # Waiting for an opponent
            await self.send(text_data=json.dumps({
                "type": "waitingForOpponent"
            }))

        await self.channel_layer.group_add('lobby', self.channel_name)

    async def disconnect(self, close_code):
        if hasattr(self, 'browser_key'):
            game_manager.remove_player(self.browser_key)

        await self.channel_layer.group_discard('lobby', self.channel_name)

        # Send updated list of games to all players
        games_info = game_manager.get_games_info()
        await self.channel_layer.group_send(
            'lobby',
            {
                'type': 'games_info',
                'games': games_info
            }
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data["type"] == "paddleMove" and hasattr(self, 'game'):
            paddle = data.get("paddle")
            if paddle in self.game.players:
                key, _ = self.game.players[paddle]
                if key == self.browser_key:
                    if data["key"] in ["w", "s"] and paddle == "a":
                        self.game.paddles["a"] += -10 if data["key"] == "w" else 10
                    elif data["key"] in ["ArrowUp", "ArrowDown"] and paddle == "b":
                        self.game.paddles["b"] += -10 if data["key"] == "ArrowUp" else 10

    async def games_info(self, event):
        await self.send(text_data=json.dumps({"type": "gamesInfo", "games": event['games']}))

    async def opponentDisconnected(self, event):
        await self.send(text_data=json.dumps({"type": "opponentDisconnected"}))
