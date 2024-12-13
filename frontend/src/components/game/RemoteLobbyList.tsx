import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';

interface Lobby {
  game_id: string;
  players_count: number;
  players: { [paddle: string]: string };
}

const RemoteLobbyList: React.FC = () => {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState<number>(0);

  useEffect(() => {
	const fetchCurrentUser = async () => {
	  try {
		const response = await axiosInstance.get("/users/me/");
		setUserId(response.data.user_id);
	  } catch (error) {
		console.error("Failed to fetch current user:", error);
	  }
	};

	fetchCurrentUser();
  }, []);

  useEffect(() => {
    // Make sure that this URL returns a valid JSON response listing the lobbies
    fetch('http://localhost:8000/api/lobbies')
      .then(res => res.json())
      .then(data => setLobbies(data))
      .catch(err => console.error('Error fetching lobbies:', err));
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(`/users/${userId}`);
        setUsername(response.data.username);
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };

    fetchUser();
  }, [userId]);


  return (
    <div className="container d-flex align-items-center justify-content-center">
		<div className="card profile-card mx-auto">
		<div className="card-header profile-header text-center">
      	<h1 className="profile-title text-white">Available Lobbies</h1>
		</div>
      <div className="card-body profile-body">
        <p> You are playing with username: {username} </p>
      </div>

      {lobbies.map(lobby => {
        const isFull = lobby.players_count >= 2;
        return (
          <div key={lobby.game_id} style={{ margin: '20px', border: '1px solid white', padding: '10px' }}>
            <h2>{lobby.game_id}</h2>
            <p>Players: {Object.values(lobby.players).length > 0 ? Object.values(lobby.players).join(', ') : 'No players yet'}</p>
            {!isFull ? (
              <Link to={`${lobby.game_id}?key=${encodeURIComponent(username)}`}>
                <button className="reset-button" disabled={!username}>Join Lobby</button>
              </Link>
            ) : (
              <button className="reset-button" disabled>Lobby is Full</button>
            )}
          </div>
        );
      })}

      <div className='mb-3'>
        <h3>Create or join a new lobby:</h3>
        <Link to={`game_${Math.floor(Math.random() * 1000)}?key=${encodeURIComponent(username)}`}>
          <button className="reset-button" disabled={!username}>Create Random Lobby</button>
        </Link>
      </div>
	  <div className='profile-footer'>
	  		<Link to="/play" style={{ marginLeft: '10px' }}> Play local</Link>
	  </div>
    </div>
	</div>
  );
};

export default RemoteLobbyList;
