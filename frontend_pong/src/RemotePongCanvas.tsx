import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';

const WS_URL = 'ws://localhost:8000/ws/pong/';

export const RemotePongCanvas: React.FC = () => {
  // Game state variables
  const [paddleAPosition, setPaddleAPosition] = useState<number>(240);
  const [paddleBPosition, setPaddleBPosition] = useState<number>(240);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number }>({ x: 462, y: 278 });
  const [score, setScore] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [gamePaused, setGamePaused] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [playersConnected, setPlayersConnected] = useState<number>(0);
  const [assignedPaddle, setAssignedPaddle] = useState<'a' | 'b' | null>(null);
  const [gameID, setGameID] = useState<string>('');
  const [playerKeys, setPlayerKeys] = useState<{ a?: string; b?: string }>({});
  const [winner, setWinner] = useState<string | null>(null); // New state for winner

  // WebSocket reference
  const websocketRef = useRef<WebSocket | null>(null);
  
  // Retrieve URL parameters
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const uniqueKey = urlParams.get('key') || 'defaultKey';

  // Ref for assigned paddle
  const assignedPaddleRef = useRef<'a' | 'b' | null>(null);

  // Store unique key in sessionStorage
  useEffect(() => {
    if (!sessionStorage.getItem('uniqueKey')) {
      sessionStorage.setItem('uniqueKey', uniqueKey);
      console.log('Unique key stored in sessionStorage:', uniqueKey);
    }
  }, [uniqueKey]);

  // Update ref when assignedPaddle changes
  useEffect(() => {
    assignedPaddleRef.current = assignedPaddle;
  }, [assignedPaddle]);

  // Connect to WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      // Construct WebSocket URL with lobby and key
      const wsUrl = lobbyId ? `${WS_URL}?key=${uniqueKey}&lobby=${lobbyId}` : `${WS_URL}?key=${uniqueKey}`;
      console.log('Connecting to WebSocket at:', wsUrl);
      const websocket = new WebSocket(wsUrl);
      console.log('Connecting with key:', uniqueKey, 'lobby:', lobbyId);

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
              setPlayerKeys(data.players); // data.players should look like {a: 'alex', b: 'bob'}
              console.log('Player keys:', data.players);
            }
          }

          if (data.type === 'playersConnected') {
            console.log('Players connected:', data.count);
            setPlayersConnected(data.count);
            setGamePaused(data.count < 2);
            if (data.players) {
              setPlayerKeys(data.players);
              console.log('Updated player keys:', data.players);
            }
          }

          if (data.type === 'update') {
            console.log('Game update received:', data);
            setPaddleAPosition(data.paddles.a);
            setPaddleBPosition(data.paddles.b);
            setBallPosition(data.ball);
            setScore(data.score);
          }

          if (data.type === 'gameOver') {
            console.log('Game over. Winner:', data.winner);
            setGameOver(true);
            setGamePaused(true);
            setWinner(data.winner); // Set the winner
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
        console.log('Key down: Moving paddle up');
        websocketRef.current.send(JSON.stringify({ type: 'paddleMove', key: 'up' }));
      } else if (event.key === 's' || event.key === 'ArrowDown') {
        console.log('Key down: Moving paddle down');
        websocketRef.current.send(JSON.stringify({ type: 'paddleMove', key: 'down' }));
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) return;

      if (event.key === 'w' || event.key === 's' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        console.log('Key up: Stopping paddle movement');
        websocketRef.current.send(JSON.stringify({ type: 'paddleStop' }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Helper function to map paddle to position
  const getPaddlePosition = (paddle: 'a' | 'b') => {
    return paddle === 'a' ? 'left' : 'right';
  };

  return (
    <div className="pong">
      {gameID && (
        <div className="lobby-id">Lobby: {gameID}</div>
      )}

      <div className="overlap-group-wrapper">
        <div className="overlap-group">
          {/* Paddles and Ball */}
          <div className="paddle-a" style={{ top: `${paddleAPosition}px` }} />
          <div className="paddle-b" style={{ top: `${paddleBPosition}px` }} />
          <div className="ball" style={{ left: `${ballPosition.x}px`, top: `${ballPosition.y}px` }} />
          
          {/* Scoreboard */}
          <div className="overlap">  {/* Changed from "scoreboard" to "overlap" */}
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

        {/* Game Paused Overlay */}
        {gamePaused && (
          <div className="game-paused">
            <h2>{playersConnected < 2 ? 'Waiting for another player...' : 'Game Paused'}</h2>
            <p>Players connected: {playersConnected}/2</p>
          </div>
        )}

        {/* Game Over Display */}
        {gameOver && (
          <div className="game-over">
            <h2>{winner ? `${winner} wins!` : 'No one wins!'}</h2>
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
