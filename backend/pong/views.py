from django.http import JsonResponse
from .consumers import GameManager

def list_lobbies(request):
    gm = GameManager.get_instance()
    lobbies = []
    for game_id, game in gm.games.items():
        lobbies.append({
            "game_id": game_id,
            "players_count": len(game.players),
            "players": game.players
        })
    return JsonResponse(lobbies, safe=False)
