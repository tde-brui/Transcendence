import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Lobby {
  game_id: string;
  players_count: number;
  players: { [paddle: string]: string };
}

const RemoteLobbyList: React.FC = () => {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Make sure that this URL returns a valid JSON response listing the lobbies
    fetch('http://localhost:8000/api/lobbies')
      .then(res => res.json())
      .then(data => setLobbies(data))
      .catch(err => console.error('Error fetching lobbies:', err));
  }, []);

  return (
    <div style={{ textAlign: 'center', color: 'white' }}>
      <h1>Available Lobbies</h1>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>Enter your unique key (username):</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ padding: '5px' }}
          placeholder="e.g. player123"
        />
      </div>

      {lobbies.map(lobby => {
        const isFull = lobby.players_count >= 2;
        return (
          <div key={lobby.game_id} style={{ margin: '20px', border: '1px solid white', padding: '10px' }}>
            <h2>{lobby.game_id}</h2>
            <p>Players: {Object.values(lobby.players).length > 0 ? Object.values(lobby.players).join(', ') : 'No players yet'}</p>
            {!isFull ? (
              <Link to={`/remote/${lobby.game_id}?key=${encodeURIComponent(username)}`}>
                <button className="reset-button" disabled={!username}>Join Lobby</button>
              </Link>
            ) : (
              <button className="reset-button" disabled>Lobby is Full</button>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: '40px' }}>
        <h3>Create or join a new lobby:</h3>
        <Link to={`/remote/game_${Math.floor(Math.random() * 1000)}?key=${encodeURIComponent(username)}`}>
          <button className="reset-button" disabled={!username}>Create Random Lobby</button>
        </Link>
      </div>
    </div>
  );
};

export default RemoteLobbyList;
