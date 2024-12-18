import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asyncio import create_task, sleep
from urllib.parse import parse_qs

class GameManager:
    instance = None

    def __init__(self):
        self.games = {}
        self.game_counter = 0
        self.browser_key_to_channel = {}
        self.browser_key_to_game = {}

    @classmethod
    def get_instance(cls):
        if not cls.instance:
            cls.instance = GameManager()
        return cls.instance

    def get_or_create_game(self):
        for game_id, game in self.games.items():
            if len(game.players) < 2:
                return game
        self.game_counter += 1
        game_id = f'game_{self.game_counter}'
        new_game = Game(game_id)
        self.games[game_id] = new_game
        return new_game

class Game:
    def __init__(self, game_id):
        self.game_id = game_id
        self.paddles = {"a": 250, "b": 250}
        self.ball = {"x": 500, "y": 300, "dx": 1, "dy": 1}
        self.score = {"a": 0, "b": 0}
        self.MAX_SCORE = 3
        self.players = {}
        self.game_started = False
        self.paddle_directions = {"a": 0, "b": 0}
        self.ready_players = {"a": False, "b": False}

    def reset_ball(self):
        self.ball = {"x": 500, "y": 300, "dx": -1 if self.ball["dx"] > 0 else 1, "dy": 1}

    def reset_game(self):
        self.paddles = {"a": 250, "b": 250}
        self.score = {"a": 0, "b": 0}
        self.reset_ball()
        self.game_started = False
        self.paddle_directions = {"a": 0, "b": 0}
        self.ready_players = {"a": False, "b": False}

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_params = parse_qs(self.scope["query_string"].decode())
        browser_key = query_params.get("key", [None])[0]
        lobby_id = query_params.get("lobby", [None])[0]

        if not browser_key:
            await self.close()
            return

        game_manager = GameManager.get_instance()

        if lobby_id:
            if lobby_id in game_manager.games:
                game = game_manager.games[lobby_id]
                if len(game.players) >= 2:
                    await self.close()
                    return
            else:
                game = Game(lobby_id)
                game_manager.games[lobby_id] = game
        else:
            game = game_manager.get_or_create_game()

        self.game = game
        self.game_id = game.game_id
        self.game_group_name = f'game_{self.game_id}'
        self.browser_key = browser_key

        game_manager.browser_key_to_channel[browser_key] = self.channel_name
        game_manager.browser_key_to_game[browser_key] = game

        if browser_key not in game.players.values():
            if len(game.players) < 2:
                paddle = 'a' if 'a' not in game.players else 'b'
                game.players[paddle] = browser_key
            else:
                await self.close()
                return
        else:
            paddle = next(k for k, v in game.players.items() if v == browser_key)

        self.paddle = paddle

        await self.accept()
        await self.send(json.dumps({
            "type": "assignPaddle",
            "paddle": paddle,
            "game_id": self.game_id,
            "players": self.game.players
        }))

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)

        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'players_connected',
                'count': len(game.players),
                'players': game.players
            }
        )

    async def disconnect(self, close_code):
        game_manager = GameManager.get_instance()

        if hasattr(self, 'browser_key'):
            if self.browser_key in game_manager.browser_key_to_channel:
                del game_manager.browser_key_to_channel[self.browser_key]
            if self.browser_key in game_manager.browser_key_to_game:
                game = game_manager.browser_key_to_game[self.browser_key]
                if hasattr(self, 'paddle') and self.paddle in game.players:
                    del game.players[self.paddle]
                del game_manager.browser_key_to_game[self.browser_key]

        if hasattr(self, 'game_group_name'):
            await self.channel_layer.group_discard(self.game_group_name, self.channel_name)
            if hasattr(self, 'game'):
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'players_connected',
                        'count': len(self.game.players),
                        'players': self.game.players
                    }
                )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if not hasattr(self, 'paddle'):
            return

        game = self.game
        msg_type = data.get("type")

        if msg_type == "paddleMove":
            direction_key = data.get("key")
            if direction_key == "up":
                game.paddle_directions[self.paddle] = -1
            elif direction_key == "down":
                game.paddle_directions[self.paddle] = 1

        elif msg_type == "paddleStop":
            game.paddle_directions[self.paddle] = 0

        elif msg_type == "playerReady":
            game.ready_players[self.paddle] = True

            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'player_ready_state',
                    'readyPlayers': game.ready_players
                }
            )

            if len(game.players) == 2 and game.ready_players['a'] and game.ready_players['b'] and not game.game_started:
                game.game_started = True
                self.update_ball_task = create_task(self.update_ball())
                self.broadcast_game_state_task = create_task(self.broadcast_game_state())

    async def players_connected(self, event):
        await self.send(text_data=json.dumps({
            "type": "playersConnected",
            "count": event['count'],
            "players": event.get('players', {})
        }))

    async def player_ready_state(self, event):
        await self.send(text_data=json.dumps({
            "type": "playerReadyState",
            "readyPlayers": event["readyPlayers"]
        }))

    async def send_update(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def update_ball(self):
        game = self.game
        paddle_speed = 5
        min_paddle_pos = 0
        max_paddle_pos = 500  # 600 height - 100 paddle height

        while game.game_started:
            ball = game.ball
            paddles = game.paddles
            score = game.score

            paddles["a"] += game.paddle_directions["a"] * paddle_speed
            paddles["b"] += game.paddle_directions["b"] * paddle_speed
            paddles["a"] = max(min_paddle_pos, min(max_paddle_pos, paddles["a"]))
            paddles["b"] = max(min_paddle_pos, min(max_paddle_pos, paddles["b"]))

            ball["x"] += ball["dx"] * 5
            ball["y"] += ball["dy"] * 5

            if ball["y"] <= 0 or ball["y"] >= 570:
                ball["dy"] *= -1

            # Paddle collision checks with adjusted values
            # Left paddle (0 to 10), ball center at ball["x"]
            if ball["x"] <= 10 and paddles["a"] <= ball["y"] <= paddles["a"] + 100:
                ball["dx"] *= -1
                ball["dx"] *= 1.05
                ball["dy"] *= 1.05
            # Right paddle (990 to 1000)
            elif ball["x"] >= 970 and paddles["b"] <= ball["y"] <= paddles["b"] + 100:
                ball["dx"] *= -1
                ball["dx"] *= 1.05
                ball["dy"] *= 1.05

            if ball["x"] < 0:
                score["b"] += 1
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'send_update',
                        'message': {
                            "type": "update",
                            "paddles": paddles,
                            "ball": ball,
                            "score": score,
                        }
                    }
                )
                game.reset_ball()

            elif ball["x"] > 1000:
                score["a"] += 1
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'send_update',
                        'message': {
                            "type": "update",
                            "paddles": paddles,
                            "ball": ball,
                            "score": score,
                        }
                    }
                )
                game.reset_ball()

            if score["a"] >= game.MAX_SCORE or score["b"] >= game.MAX_SCORE:
                winner_paddle = "a" if score["a"] >= game.MAX_SCORE else "b"
                winner_username = game.players.get(winner_paddle, "Unknown")
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'game_over',
                        'winner': winner_username
                    }
                )
                game.reset_game()

            await sleep(1/60) # 60fps

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
            await sleep(1/60)

    async def game_over(self, event):
        await self.send(text_data=json.dumps({"type": "gameOver", "winner": event['winner']}))
