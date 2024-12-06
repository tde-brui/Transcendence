import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const WS_URL = 'ws://localhost:8000/ws/pong/';

export const PingPongCanvas: React.FC = () => {
  const [paddleAPosition, setPaddleAPosition] = useState<number>(240);
  const [paddleBPosition, setPaddleBPosition] = useState<number>(240);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number }>({ x: 462, y: 278 });
  const [score, setScore] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [gamePaused, setGamePaused] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [playersConnected, setPlayersConnected] = useState<number>(0);
  const [assignedPaddle, setAssignedPaddle] = useState<'a' | 'b' | null>(null);

  const websocketRef = useRef<WebSocket | null>(null);

  // const uniqueKey = 'alex'

  const urlParams = new URLSearchParams(window.location.search);
  const uniqueKey = urlParams.get('key') || 'defaultKey';

  //zo speel je op 1 machine tegen jezelf:
  //Tab 1: http://localhost:3000?key=alex
  //Tab 2: http://localhost:3000?key=bob

  // Create a ref to hold the latest value of assignedPaddle
  const assignedPaddleRef = useRef<'a' | 'b' | null>(null);

  useEffect(() => {
    if (!sessionStorage.getItem('uniqueKey')) {
      sessionStorage.setItem('uniqueKey', uniqueKey);
    }
  }, []);

  // Update the ref whenever assignedPaddle changes
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

      // websocket.onclose = (event) => {
      //   if (event.code !== 1000) {
      //     console.log(`WebSocket disconnected unexpectedly. Retrying in 5 seconds...`);
      //     setTimeout(connectWebSocket, 5000); // Retry connection after 5 seconds
      //   }
      // };
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
      websocketRef.current.send(JSON.stringify({ type: 'paddleMove', key: event.key }));
    } else if (paddle === 'b' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      websocketRef.current.send(JSON.stringify({ type: 'paddleMove', key: event.key }));
    }
  };  

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []); // Empty dependency array to add the listener only once

  return (
    <div className="pong">
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

export default PingPongCanvas;