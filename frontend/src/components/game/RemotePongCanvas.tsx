import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import '../../css/game/PongCanvas.css';

const WS_URL = 'ws://localhost:8000/ws/pong/';

export const RemotePongCanvas: React.FC = () => {
  // Game state variables
  const [paddleAPosition, setPaddleAPosition] = useState<number>(250);
  const [paddleBPosition, setPaddleBPosition] = useState<number>(250);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number }>({ x: 500, y: 300 });
  const [score, setScore] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [gamePaused, setGamePaused] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [playersConnected, setPlayersConnected] = useState<number>(0);
  const [assignedPaddle, setAssignedPaddle] = useState<'a' | 'b' | null>(null);
  const [gameID, setGameID] = useState<string>('');
  const [playerKeys, setPlayerKeys] = useState<{ a?: string; b?: string }>({});
  const [winner, setWinner] = useState<string | null>(null);

  // Ready states (according to the server). Example: { a: false, b: true }
  const [readyStates, setReadyStates] = useState<{ a: boolean; b: boolean }>({ a: false, b: false });

  // Track local player's "ready" status for simpler UI logic (optional):
  const [isLocalReady, setIsLocalReady] = useState<boolean>(false);

  // WebSocket reference
  const websocketRef = useRef<WebSocket | null>(null);
  
  // Retrieve URL parameters
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const uniqueKey = urlParams.get('key') || 'defaultKey';

  // Store unique key in sessionStorage
  useEffect(() => {
    if (!sessionStorage.getItem('uniqueKey')) {
      sessionStorage.setItem('uniqueKey', uniqueKey);
      console.log('Unique key stored in sessionStorage:', uniqueKey);
    }
  }, [uniqueKey]);

  // Connect to WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      // Construct WebSocket URL with lobby and key
      const wsUrl = lobbyId ? `${WS_URL}?key=${uniqueKey}&lobby=${lobbyId}` : `${WS_URL}?key=${uniqueKey}`;
      console.log('Connecting to WebSocket at:', wsUrl);
      const websocket = new WebSocket(wsUrl);

      websocketRef.current = websocket;

      websocket.onopen = () => {
        console.log('WebSocket connected');
      };

      websocket.onmessage = (event) => {
        console.log('Received message:', event.data);
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'assignPaddle') {
            console.log('Assigned paddle:', data.paddle);
            setAssignedPaddle(data.paddle);
            if (data.game_id) {
              setGameID(data.game_id);
            }
            if (data.players) {
              setPlayerKeys(data.players);
              console.log('Player keys:', data.players);
            }
          }

          if (data.type === 'playersConnected') {
            console.log('Players connected:', data.count);
            setPlayersConnected(data.count);
            // If less than 2 players or if the game isn't started yet, we show "gamePaused" overlay
            setGamePaused(true);
            if (data.players) {
              setPlayerKeys(data.players);
              console.log('Updated player keys:', data.players);
            }
          }

          if (data.type === 'playerReadyState') {
            // Server broadcasts readiness states of both paddles
            console.log('Ready states updated:', data.readyPlayers);
            setReadyStates(data.readyPlayers);
          }

          if (data.type === 'update') {
            setPaddleAPosition(data.paddles.a);
            setPaddleBPosition(data.paddles.b);
            setBallPosition({ x: data.ball.x, y: data.ball.y });
            setScore(data.score);
            // Once updates are streaming in, the game is effectively unpaused
            setGamePaused(false);
          }

          if (data.type === 'gameOver') {
            console.log('Game over. Winner:', data.winner);
            setGameOver(true);
            setGamePaused(true);
            setWinner(data.winner);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocket.onclose = (event) => {
        console.log('WebSocket closed:', event);
      };
    };

    connectWebSocket();

    // Cleanup on component unmount
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
        console.log('WebSocket connection closed');
      }
    };
  }, [uniqueKey, lobbyId]);

  // Handle keyboard events for paddle movement
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) return;

      if (event.key === 'w' || event.key === 'ArrowUp') {
        websocketRef.current.send(JSON.stringify({ type: 'paddleMove', key: 'up' }));
      } else if (event.key === 's' || event.key === 'ArrowDown') {
        websocketRef.current.send(JSON.stringify({ type: 'paddleMove', key: 'down' }));
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) return;

      if (['w','s','ArrowUp','ArrowDown'].includes(event.key)) {
        websocketRef.current.send(JSON.stringify({ type: 'paddleStop' }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Send "playerReady" event to the server
  const handleReadyUp = () => {
    if (!websocketRef.current) return;
    websocketRef.current.send(JSON.stringify({ type: 'playerReady' }));
    setIsLocalReady(true);
  };

  // Helper function to map paddle to position
  const getPaddlePosition = (paddle: 'a' | 'b') => {
    return paddle === 'a' ? 'left' : 'right';
  };

  const bothPlayersReady = readyStates.a && readyStates.b;

  return (
    <div className="pong d-flex flex-column align-items-center justify-content-center vh-100">
      {gameID && (
        <div className="lobby-id mb-2">Lobby: {gameID}</div>
      )}

      <div className="overlap-group-wrapper">
        <div className="overlap-group">
          {/* Paddles and Ball */}
          <div className="paddle-a" style={{ top: `${paddleAPosition}px` }} />
          <div className="paddle-b" style={{ top: `${paddleBPosition}px` }} />
          <div className="ball" style={{ left: `${ballPosition.x}px`, top: `${ballPosition.y}px` }} />
          
          {/* Scoreboard */}
          <div className="overlap">
            <div className="score">{score.a} - {score.b}</div>
          </div>
        </div>

        {/* Player Names */}
        {playerKeys.a && (
          <div className="player-name-a">{playerKeys.a}</div>
        )}
        {playerKeys.b && (
          <div className="player-name-b">{playerKeys.b}</div>
        )}

        {/* Show 'Game Over' overlay if the game is over */}
        {gameOver && (
          <div className="game-over">
            <h2>{winner ? `${winner} wins!` : 'No one wins!'}</h2>
          </div>
        )}

        {/* Show overlay if game paused or waiting for players */}
        {gamePaused && !gameOver && (
          <div className="game-paused">
            {playersConnected < 2 ? (
              <h2>Waiting for another player...</h2>
            ) : (
              <h2>Waiting for players to ready up...</h2>
            )}
            <p>Players connected: {playersConnected}/2</p>
            {/* Show ready states */}
            {assignedPaddle && (
              <>
                <p>
                  Player A Ready: {readyStates.a ? 'Yes' : 'No'}<br />
                  Player B Ready: {readyStates.b ? 'Yes' : 'No'}
                </p>
                {!isLocalReady && (
                  <button className="glass-button" onClick={handleReadyUp}>
                    Ready Up
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Player Info Display */}
        {assignedPaddle && (
          <div className="player-info">
            <h3>You are controlling the {getPaddlePosition(assignedPaddle)} paddle</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemotePongCanvas;
