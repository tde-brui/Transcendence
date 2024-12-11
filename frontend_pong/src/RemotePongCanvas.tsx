import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const WS_URL = 'ws://localhost:8000/ws/pong/';

export const RemotePongCanvas: React.FC = () => {
  const [paddleAPosition, setPaddleAPosition] = useState<number>(240);
  const [paddleBPosition, setPaddleBPosition] = useState<number>(240);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number }>({ x: 462, y: 278 });
  const [score, setScore] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [gamePaused, setGamePaused] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [playersConnected, setPlayersConnected] = useState<number>(0);
  const [assignedPaddle, setAssignedPaddle] = useState<'a' | 'b' | null>(null);
  const [gameID, setGameID] = useState<string>('');
  const [playerKeys, setPlayerKeys] = useState<{a?: string; b?: string}>({});
  
  const websocketRef = useRef<WebSocket | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const uniqueKey = urlParams.get('key') || 'defaultKey';

  const assignedPaddleRef = useRef<'a' | 'b' | null>(null);

  useEffect(() => {
    if (!sessionStorage.getItem('uniqueKey')) {
      sessionStorage.setItem('uniqueKey', uniqueKey);
    }
  }, [uniqueKey]);

  // Keep assignedPaddleRef updated
  useEffect(() => {
    assignedPaddleRef.current = assignedPaddle;
  }, [assignedPaddle]);

  useEffect(() => {
    const connectWebSocket = () => {
      const websocket = new WebSocket(`${WS_URL}?key=${uniqueKey}`);
      console.log('Connecting with key:', uniqueKey);
  
      websocketRef.current = websocket;

      websocket.onopen = () => console.log('WebSocket connected');
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'assignPaddle') {
          console.log('Assigned paddle:', data.paddle);
          setAssignedPaddle(data.paddle);
          if (data.game_id) {
            setGameID(data.game_id);
          }
          if (data.players) {
            setPlayerKeys(data.players); // data.players should look like {a: 'alex', b: 'bob'}
          }
          
        }

        if (data.type === 'playersConnected') {
          setPlayersConnected(data.count);
          setGamePaused(data.count < 2);
        }

        if (data.type === 'update') {
          setPaddleAPosition(data.paddles.a);
          setPaddleBPosition(data.paddles.b);
          setBallPosition(data.ball);
          setScore(data.score);
        }

        if (data.type === 'gameOver') {
          setGameOver(true);
          setGamePaused(true);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [uniqueKey]);

  // Handle key events: move paddle on keydown, stop paddle on keyup
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) return;

      // Determine if the key corresponds to "up" or "down"
      if (event.key === 'w' || event.key === 'ArrowUp') {
        websocketRef.current.send(JSON.stringify({ type: 'paddleMove', key: 'up' }));
      } else if (event.key === 's' || event.key === 'ArrowDown') {
        websocketRef.current.send(JSON.stringify({ type: 'paddleMove', key: 'down' }));
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) return;

      // If the user releases one of the movement keys, send a paddleStop command
      if (event.key === 'w' || event.key === 's' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
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

  return (
    <div className="pong">
      {/* Display the lobby name at the top */}
      {gameID && (
        <div style={{ position: 'absolute', top: '10px', width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
          Lobby: {gameID}
        </div>
      )}
  
      <div className="overlap-group-wrapper">
        <div className="overlap-group">
          <div className="paddle-a" style={{ top: `${paddleAPosition}px` }} />
          <div className="paddle-b" style={{ top: `${paddleBPosition}px` }} />
          <div className="ball" style={{ left: `${ballPosition.x}px`, top: `${ballPosition.y}px` }} />
          <div className="overlap">
            <div className="scoreboard" />
            <div className="score">{score.a} - {score.b}</div>
          </div>
        </div>
  
        {/* Player IDs on sides */}
        {playerKeys.a && (
          <div style={{ position: 'absolute', left: '20px', top: '60px', color: 'white', fontWeight: 'bold' }}>
            {playerKeys.a}
          </div>
        )}
        {playerKeys.b && (
          <div style={{ position: 'absolute', right: '20px', top: '60px', color: 'white', fontWeight: 'bold' }}>
            {playerKeys.b}
          </div>
        )}
  
        {gamePaused && (
          <div className="game-paused">
            <h2>{playersConnected < 2 ? 'Waiting for another player...' : 'Game Paused'}</h2>
            <p>Players connected: {playersConnected}/2</p>
          </div>
        )}
        {gameOver && (
          <div className="game-over">
            <h2>{score.a > score.b ? 'Player A wins!' : 'Player B wins!'}</h2>
          </div>
        )}
        {assignedPaddle && (
          <div className="player-info">
            <h3>You are controlling Paddle {assignedPaddle.toUpperCase()}</h3>
          </div>
        )}
      </div>
    </div>
  );
};  

export default RemotePongCanvas;
