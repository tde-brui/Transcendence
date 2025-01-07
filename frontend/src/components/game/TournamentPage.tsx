import React, { useEffect, useState } from "react";
import "../../css/game/TournamentPage.css";
import axiosInstance from "../utils/AxiosInstance";

interface Match {
  id: number;
  players: string[];
  winner: string | null;
  score: [number, number];
}

interface Tournament {
  organizer: string;
  players: string[];
  timer: number | null;
  is_started: boolean;
  matches: Match[];
}

const TournamentPage: React.FC = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    fetchTournament();
    fetchUsername();

    const socket = new WebSocket("ws://localhost:8000/ws/tournament/");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTournament(data.timer !== undefined ? data : null); // If there's no timer, data = null
    };    

    return () => {
      socket.close();
    };
  }, []);

  const fetchTournament = async () => {
    try {
      const response = await axiosInstance.get("/api/tournament/");
      setTournament(response.data);
    } catch (error) {
      console.error("No active tournament found:", error);
    }
  };

  const fetchUsername = async () => {
    try {
      const response = await axiosInstance.get("/api/user/me/");
      const username = response.data?.username;

      if (!username) {
        throw new Error("Username not found in response.");
      }

      console.log("Fetched Username:", username);
      setUsername(username);
    } catch (error) {
      console.error("Failed to fetch username:", error);
      setUsername("");
    }
  };

  const toggleSignIn = async () => {
    try {
      await axiosInstance.post("/api/tournament/sign-in/");
    } catch (error) {
      console.error("Failed to toggle sign in/out:", error);
    }
  };

  const handlePlayMatch = async (matchId: number) => {
    try {
      const response = await axiosInstance.post("/api/assign-game/", { match_id: matchId });
      const { game_id } = response.data;
      window.location.href = `/play/remote/${game_id}?key=${username}`;
    } catch (error) {
      console.error("Failed to assign game to match:", error);
    }
  };
  
  // Handle match result updates
  const updateMatchResult = async (matchId: number, winner: string, score: [number, number]) => {
    try {
      await axiosInstance.post("/api/update-match-result/", { match_id: matchId, winner, score });
    } catch (error) {
      console.error("Failed to update match result:", error);
    }
  };  

  const handleGameOver = async (matchId: number, winner: string, score: [number, number]) => {
    try {
      await axiosInstance.post("/api/update-match-result/", { match_id: matchId, winner, score });
    } catch (error) {
      console.error("Failed to update match result:", error);
    }
  };  

  const isSignedIn = tournament && tournament.players.includes(username);
  console.log("Tournament data after game:", tournament);

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center">
      <div className="card tournament-card mx-auto">
        <div className="card-header tournament-header text-center">
          <h1 className="tournament-title">Tournament</h1>
        </div>
        <div className="card-body tournament-body">
          {!tournament ? (
            <div className="create-tournament">
              <h3>No active tournament</h3>
              <button
                className="create-button"
                onClick={() => axiosInstance.post("/api/tournament/create/")}
              >
                Create Tournament
              </button>
            </div>
          ) : (
            <>
              <h3>Organizer: {tournament.organizer}</h3>
              <p>
                Players ({tournament.players.length}):{" "}
                {tournament.players.length > 0
                  ? tournament.players.join(", ")
                  : "None"}
              </p>
              {tournament.timer !== null && !tournament.is_started && (
                <p>Starting in: {tournament.timer}s</p>
              )}
              {!tournament.is_started ? (
                <button className="glass-button" onClick={toggleSignIn}>
                  {isSignedIn ? "Sign Out" : "Sign In"}
                </button>
              ) : (
<div className="matches-container">
  <h3>Matches</h3>
  {tournament.matches.map((match) => (
    <div key={match.id} className="match-container">
  <p>
    {match.players[0]} vs {match.players[1]}
  </p>
  <p>Winner: {match.winner || "Undecided"}</p>
  <p>
    Score: {match.score[0]} - {match.score[1]}
  </p>
  {match.winner === null && (
    <button className="play-button" onClick={() => handlePlayMatch(match.id)}>
      Play
    </button>
  )}
</div>
  ))}
</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentPage;
