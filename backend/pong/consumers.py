import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asyncio import create_task, sleep
from urllib.parse import parse_qs
from django.utils.timezone import now
from asgiref.sync import sync_to_async
from users.models import PongUser, MatchHistory
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .tournament_manager import TournamentManager

class TournamentConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("tournament_updates", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("tournament_updates", self.channel_name)

    async def tournament_update(self, event):
        await self.send_json(event["message"])

class Game:
    def __init__(self, game_id):
        self.game_id = game_id
        self.paddles = {"a": 250, "b": 250}
        self.ball = {"x": 500, "y": 300, "dx": 1, "dy": 1}
        self.score = {"a": 0, "b": 0}
        self.MAX_SCORE = 3
        self.players = {}       # 'a' -> browser_key, 'b' -> browser_key
        self.players_info = {}  # 'a' -> {"username": "bob", "display_name": "CustomName" (optional)}
        self.game_started = False
        self.paddle_directions = {"a": 0, "b": 0}
        self.ready_players = {"a": False, "b": False}

    def reset_ball(self):
        # Flip direction so next serve is from the opposite side
        self.ball = {
            "x": 500, 
            "y": 300, 
            "dx": -1 if self.ball["dx"] > 0 else 1, 
            "dy": 1
        }

    def reset_game(self):
        """Optionally used if you want to re-start, but we've removed repeated usage after a real game-over."""
        self.paddles = {"a": 250, "b": 250}
        self.score = {"a": 0, "b": 0}
        self.reset_ball()
        self.game_started = False
        self.paddle_directions = {"a": 0, "b": 0}
        self.ready_players = {"a": False, "b": False}


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
        # Return an existing game if it has a free slot, else create new
        for game_id, game in self.games.items():
            if len(game.players) < 2:
                return game
        self.game_counter += 1
        game_id = f'game_{self.game_counter}'
        new_game = Game(game_id)
        self.games[game_id] = new_game
        return new_game

    def delete_game(self, game_id):
        if game_id in self.games:
            del self.games[game_id]

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

        # Decide which paddle
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

        # Tournament logic
        manager = TournamentManager.get_instance()
        tournament = manager.get_tournament()
        match_for_this_game = None
        display_name_for_this_user = None
        is_tournament_game = False

        if tournament:
            match_for_this_game = next(
                (m for m in tournament.get("matches", []) if m.get("game_id") == self.game_id),
                None
            )
            if match_for_this_game:
                is_tournament_game = True

                # Mark match as 'in_progress'
                match_for_this_game["in_progress"] = True

                # Update connected count
                current_count = match_for_this_game.get("connected_count", 0)
                match_for_this_game["connected_count"] = current_count + 1

                await manager.broadcast_update_async()

                display_name_for_this_user = tournament.get("display_names", {}).get(browser_key)

        # Fallback to normal username if no display name
        user_label = display_name_for_this_user if display_name_for_this_user else browser_key

        # Store it in the game object
        if paddle not in game.players_info:
            game.players_info[paddle] = {
                "username": browser_key,
                "display_name": user_label,
            }

        await self.accept()

        # Assign paddle message
        await self.send(json.dumps({
            "type": "assignPaddle",
            "paddle": paddle,
            "game_id": self.game_id,
            "players": {
                pad: (game.players_info[pad]["display_name"] or game.players_info[pad]["username"])
                for pad in game.players_info
            }
        }))

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)

        # Notify group
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'players_connected',
                'count': len(game.players),
                'players': {
                    pad: (game.players_info[pad]["display_name"] or game.players_info[pad]["username"])
                    for pad in game.players_info
                },
            }
        )

    async def disconnect(self, close_code):
        game_manager = GameManager.get_instance()
        game = getattr(self, 'game', None)

        # Tournament logic ...
        manager = TournamentManager.get_instance()
        tournament = manager.get_tournament()
        # (existing code for match_for_this_game, connected_count, etc.)

        if hasattr(self, 'browser_key'):
            # Remove from dict
            if self.browser_key in game_manager.browser_key_to_channel:
                del game_manager.browser_key_to_channel[self.browser_key]
            if self.browser_key in game_manager.browser_key_to_game:
                if game:
                    # Remove from the game
                    if hasattr(self, 'paddle') and self.paddle in game.players:
                        del game.players[self.paddle]
                        if self.paddle in game.players_info:
                            del game.players_info[self.paddle]

                    # FIX: Only do a forced game_over if the game is still started/active:
                    if game.game_started and len(game.players) == 1:
                        game.game_started = False
                        remaining_paddle = list(game.players.keys())[0]
                        winner_username = game.players.get(remaining_paddle, "Unknown")

                        await self.channel_layer.group_send(
                            self.game_group_name,
                            {
                                'type': 'game_over',
                                'winner': winner_username,
                                'loser': self.browser_key
                            }
                        )
                del game_manager.browser_key_to_game[self.browser_key]

        # Group discard ...
        if hasattr(self, 'game_group_name'):
            await self.channel_layer.group_discard(self.game_group_name, self.channel_name)

            if game:
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'players_connected',
                        'count': len(game.players),
                        'players': {
                            pad: (game.players_info[pad]["display_name"] or game.players_info[pad]["username"])
                            for pad in game.players_info
                        },
                    }
                )

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")

        if not hasattr(self, 'paddle'):
            return

        game = self.game

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

            # If both players are ready and the game hasn't started, start the countdown
            if len(game.players) == 2 and game.ready_players['a'] and game.ready_players['b'] and not game.game_started:
                create_task(self.start_countdown_and_start_game())

    async def players_connected(self, event):
        # The 'type' field is "players_connected", so Channels calls this method
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

    async def countdown(self):
        for val in [3, 2, 1, "GO!"]:
            await self.channel_layer.group_send(
                self.game_group_name,
                {"type": "countdown_tick", "value": val}
            )
            await sleep(1)

    async def start_countdown_and_start_game(self):
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'countdown_start',
            }
        )
        await self.countdown()

        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'countdown_end',
            }
        )

        self.game.game_started = True
        self.update_ball_task = create_task(self.update_ball())
        self.broadcast_game_state_task = create_task(self.broadcast_game_state())

    async def update_ball(self):
        game = self.game
        paddle_speed = 5
        min_paddle_pos = 0
        max_paddle_pos = 500

        while game.game_started and len(game.players) > 0:
            ball = game.ball
            paddles = game.paddles
            score = game.score

            # Move paddles
            paddles["a"] += game.paddle_directions["a"] * paddle_speed
            paddles["b"] += game.paddle_directions["b"] * paddle_speed
            paddles["a"] = max(min_paddle_pos, min(max_paddle_pos, paddles["a"]))
            paddles["b"] = max(min_paddle_pos, min(max_paddle_pos, paddles["b"]))

            # Move ball
            ball["x"] += ball["dx"] * 5
            ball["y"] += ball["dy"] * 5

            # Check collisions with top/bottom
            if ball["y"] <= 0 or ball["y"] >= 570:
                ball["dy"] *= -1

            # Paddle collisions
            if ball["x"] <= 10 and paddles["a"] <= ball["y"] <= paddles["a"] + 100:
                ball["dx"] *= -1
                ball["dx"] *= 1.05
                ball["dy"] *= 1.05
            elif ball["x"] >= 970 and paddles["b"] <= ball["y"] <= paddles["b"] + 100:
                ball["dx"] *= -1
                ball["dx"] *= 1.05
                ball["dy"] *= 1.05

            # If ball goes out on the left
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
                # Only do next countdown if we haven't reached MAX_SCORE
                if score["b"] < game.MAX_SCORE and score["a"] < game.MAX_SCORE:
                    await self.start_countdown_after_score()

            # If ball goes out on the right
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
                # Only do next countdown if we haven't reached MAX_SCORE
                if score["a"] < game.MAX_SCORE and score["b"] < game.MAX_SCORE:
                    await self.start_countdown_after_score()

            # Check if game is over
            if score["a"] >= game.MAX_SCORE or score["b"] >= game.MAX_SCORE:
                winner_paddle = "a" if score["a"] >= game.MAX_SCORE else "b"
                loser_paddle = "b" if winner_paddle == "a" else "a"
                winner_username = game.players.get(winner_paddle, "Unknown")
                loser_username = game.players.get(loser_paddle, "Unknown")

                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'game_over',
                        'winner': winner_username,
                        'loser': loser_username
                    }
                )
                # Stop the loop
                break

            await sleep(1/60)
    
    async def save_match_result(self, player_username, opponent_username, result):
        """Saves the match result in the database asynchronously"""
        try:
            player = await sync_to_async(PongUser.objects.get)(username=player_username)
            opponent = await sync_to_async(PongUser.objects.get)(username=opponent_username)

            await sync_to_async(MatchHistory.objects.create)(
                game_id=self.game_id,
                player=player,
                opponent=opponent,
                result=result,
                date_played=now()
            )
        except PongUser.DoesNotExist:
            pass  # If using display names or something, skip actual DB save

    async def start_countdown_after_score(self):
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'countdown_start',
            }
        )
        await self.countdown()
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'countdown_end',
            }
        )

    async def broadcast_game_state(self):
        game = self.game
        while game.game_started and len(game.players) > 0:
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

    async def redirect_tournament(self, event):
        await self.send(text_data=json.dumps({"type": "redirectToTournament"}))

    async def redirect_play(self, event):
        await self.send(text_data=json.dumps({"type": "redirectToPlay"}))

    async def game_over(self, event):
        winner_username = event.get('winner')
        loser_username = event.get('loser')

        try:
            # Save match result for non-tournament games
            if winner_username == self.browser_key:
                await self.save_match_result(winner_username, loser_username, MatchHistory.WIN)
            elif loser_username == self.browser_key:
                await self.save_match_result(loser_username, winner_username, MatchHistory.LOSS)

            # Tournament logic
            manager = TournamentManager.get_instance()
            tournament = manager.get_tournament()
            is_tournament_game = False
            final_winner_label = winner_username

            if tournament:
                # Update match result
                result = await manager.update_match_result_by_game_id_async(self.game_id, winner_username)
                if not result.get("error"):
                    is_tournament_game = True

                # Update final winner label if it's a tournament game
                match = next(
                    (m for m in tournament.get("matches", []) if m.get("game_id") == self.game_id),
                    None
                )
                if match:
                    winner_paddle = next((k for k, v in self.game.players.items() if v == winner_username), None)
                    if winner_paddle and winner_paddle in self.game.players_info:
                        display_name = self.game.players_info[winner_paddle].get("display_name")
                        if display_name:
                            final_winner_label = display_name

            # Send game over to the client
            await self.send(text_data=json.dumps({
                "type": "gameOver",
                "winner": final_winner_label,
            }))

            # Stop the game
            self.game.game_started = False

            # Delay to show game over screen
            await sleep(3)

            # Redirect based on game type
            if is_tournament_game:
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {"type": "redirect_tournament"}
                )
            else:
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {"type": "redirect_play"}
                )

            # Clean up game resources
            GameManager.get_instance().delete_game(self.game_id)

        except Exception as e:
            print(f"Error in game_over: {str(e)}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "An error occurred during gameOver processing."
            }))

    async def countdown_start(self, event):
        await self.send(text_data=json.dumps({"type": "countdownStart"}))

    async def countdown_end(self, event):
        await self.send(text_data=json.dumps({"type": "countdownEnd"}))
    
    async def countdown_tick(self, event):
        await self.send(json.dumps({
            "type": "countdown_tick",
            "value": event["value"]
        }))