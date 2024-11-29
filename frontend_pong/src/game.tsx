import React, { useEffect, useRef, useState } from 'react';

// WebSocket URL
const WS_URL = 'ws://10.15.186.10:8000/ws/pong/';
// const WS_URL = 'ws://localhost:8080';

export const PingPongCanvas: React.FC = () => {
  const [paddleAPosition, setPaddleAPosition] = useState<number>(240);
  const [paddleBPosition, setPaddleBPosition] = useState<number>(240);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number }>({ x: 462, y: 278 });
  const [score, setScore] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [gamePaused, setGamePaused] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const websocketRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket
  useEffect(() => {
    const websocket = new WebSocket(WS_URL);
    websocketRef.current = websocket;

    websocket.onopen = () => console.log('WebSocket connected');
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Update game state from server
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

    websocket.onclose = () => console.log('WebSocket disconnected');

    return () => {
      websocket.close();
    };
  }, []);

  // Handle key presses for paddle movement
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not open");
        return;
      }

      // Send paddle movement to the server
      const validKeys = ['ArrowUp', 'ArrowDown', 'w', 's'];
      if (validKeys.includes(event.key)) {
        console.log(`Key pressed: ${event.key}`);
        websocketRef.current.send(JSON.stringify({ type: 'paddleMove', key: event.key }));
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Clean up the event listener
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []); // Empty dependency array to ensure it's only added once

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
        {gameOver && (
          <div className="game-over">
            <h2>{score.a > score.b ? 'Player A wins!' : 'Player B wins!'}</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default PingPongCanvas;