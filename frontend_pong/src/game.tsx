import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import websocket from './websocket'; // Adjust the path accordingly

export const PingPongCanvas: React.FC = () => {
  const [paddleAPosition, setPaddleAPosition] = useState<number>(240);
  const [paddleBPosition, setPaddleBPosition] = useState<number>(240);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number }>({ x: 462, y: 278 });
  const [score, setScore] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [gamePaused, setGamePaused] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [assignedPaddle, setAssignedPaddle] = useState<'a' | 'b' | null>(null);
  const [gamesInfo, setGamesInfo] = useState<Array<{ game_id: string; players: number }>>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState<boolean>(false);

  const websocketRef = useRef<WebSocket | null>(websocket);

  // Create a ref to hold the latest value of assignedPaddle
  const assignedPaddleRef = useRef<'a' | 'b' | null>(null);

  // Update the ref whenever assignedPaddle changes
  useEffect(() => {
    assignedPaddleRef.current = assignedPaddle;
  }, [assignedPaddle]);

  useEffect(() => {
    const connectWebSocket = () => {
      console.log('Connecting with key:', websocketRef.current);

      websocketRef.current = websocket;

      websocket.onopen = () => console.log('WebSocket connected');
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'assignPaddle') {
          console.log('Assigned paddle:', data.paddle);
          setAssignedPaddle(data.paddle);
          setGameId(data.game_id);
          setGamePaused(false);
          setOpponentDisconnected(false); // Reset opponentDisconnected status
        }

        if (data.type === 'gamesInfo') {
          setGamesInfo(data.games);
        }

        if (data.type === 'waitingForOpponent') {
          setGamePaused(true);
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

        if (data.type === 'opponentDisconnected') {
          setOpponentDisconnected(true);
          setGamePaused(true);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocket.onclose = (event) => {
        if (event.code !== 1000) {
          console.log(`WebSocket disconnected unexpectedly. Retrying in 5 seconds...`);
          setTimeout(connectWebSocket, 5000); // Retry connection after 5 seconds
        }
      };
    };

    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  const handleKeyPress = (event: KeyboardEvent) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not open');
      return;
    }

    const paddle = assignedPaddleRef.current;

    if (paddle === 'a' && (event.key === 'w' || event.key === 's')) {
      websocketRef.current.send(JSON.stringify({ type: 'paddleMove', key: event.key, paddle }));
    } else if (paddle === 'b' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      websocketRef.current.send(JSON.stringify({ type: 'paddleMove', key: event.key, paddle }));
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    <div className="pong">
      <div className="overlap-group-wrapper">
        <div className="overlap-group">
          <div className="paddle-a" style={{ top: `${paddleAPosition}px` }} />
          <div className="paddle-b" style={{ top: `${paddleBPosition}px` }} />
          <div className="ball" style={{ left: `${ballPosition.x}px`, top: `${ballPosition.y}px` }} />
          <div className="overlap">
            <div className="scoreboard" />
            <div className="score">
              {score.a} - {score.b}
            </div>
          </div>
        </div>
        {gamePaused && (
          <div className="game-paused">
            <h2>Waiting for another player...</h2>
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
            {gameId && <p>Game ID: {gameId}</p>}
          </div>
        )}
        {opponentDisconnected && (
          <div className="game-over">
            <h2>Your opponent has disconnected.</h2>
          </div>
        )}
        <div className="games-info">
          <h3>Current Matches:</h3>
          <ul>
            {gamesInfo.map((game) => (
              <li key={game.game_id}>
                Game ID: {game.game_id}, Players: {game.players}/2
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PingPongCanvas;
