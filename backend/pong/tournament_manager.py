import itertools
import threading
import time
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class TournamentManager:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super().__new__(cls, *args, **kwargs)
        return cls._instance

    @classmethod
    def get_instance(cls):
        if not cls._instance:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        if not hasattr(self, "initialized"):
            self.tournament = None
            self.timer_thread = None
            self.lock = threading.Lock()
            self.initialized = True

    def create_tournament(self, organizer):
        with self.lock:
            if self.tournament:
                return {"error": "Tournament already exists"}
            self.tournament = {
                "organizer": organizer,
                "players": [],
                "timer": 30,
                "is_started": False,
                "matches": [],
            }
            self.broadcast_update()
            self.start_timer()
        return self.tournament

    def sign_in_player(self, username):
        with self.lock:
            if not self.tournament:
                return {"error": "No active tournament"}
            if username in self.tournament["players"]:
                return {"error": "Player already signed in"}
            self.tournament["players"].append(username)
            self.broadcast_update()
        return self.tournament

    def unsign_player(self, username):
        with self.lock:
            if not self.tournament:
                return {"error": "No active tournament"}
            if username not in self.tournament["players"]:
                return {"error": "Player not signed in"}
            self.tournament["players"].remove(username)
            self.broadcast_update()
        return self.tournament

    def start_timer(self):
        def countdown():
            while True:
                time.sleep(1)
                with self.lock:
                    if not self.tournament:
                        break
                    self.tournament["timer"] -= 1
                    self.broadcast_update()
                    if self.tournament["timer"] <= 0:
                        if len(self.tournament["players"]) < 2:
                            self.tournament = None
                        else:
                            self.start_tournament()
                        self.broadcast_update()
                        break

        self.timer_thread = threading.Thread(target=countdown, daemon=True)
        self.timer_thread.start()

    def start_tournament(self):
        self.tournament["is_started"] = True
        players = self.tournament["players"]
        matches = []
        for i, pair in enumerate(itertools.combinations(players, 2)):
            matches.append({"id": i, "players": list(pair), "winner": None, "score": [0, 0]})
        self.tournament["matches"] = matches
        self.broadcast_update()

    def broadcast_update(self):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "tournament_updates",
            {"type": "tournament_update", "message": self.tournament or {}},
        )

    def get_tournament(self):
        with self.lock:
            return self.tournament

    def assign_game_to_match(self, match_id):
        with self.lock:
            if not self.tournament:
                return {"error": "No active tournament"}
            match = next((m for m in self.tournament["matches"] if m["id"] == match_id), None)
            if not match:
                return {"error": "Match not found"}
            if "game_id" in match:
                return {"error": "Match already has an assigned game"}
            match["game_id"] = f"game_{match_id}"
            self.broadcast_update()
        return match

    def update_match_result(self, match_id, winner, score):
        with self.lock:
            if not self.tournament:
                return {"error": "No active tournament"}
            match = next((m for m in self.tournament["matches"] if m["id"] == match_id), None)
            if not match:
                return {"error": "Match not found"}
            match["winner"] = winner
            match["score"] = score
            self.broadcast_update()
        return match
