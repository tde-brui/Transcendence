import React, { useEffect, useState, useRef } from 'react';
import '../../css/game/PongCanvas.css';

const LocalPongCanvas: React.FC = () => {
  const [paddleAPosition, setPaddleAPosition] = useState<number>(240);
  const [paddleBPosition, setPaddleBPosition] = useState<number>(240);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number }>({ x: 462, y: 278 });
  const [score, setScore] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [gamePaused, setGamePaused] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  const MAX_SCORE = 3;
  const paddleSpeed = 5;  
  const ballSpeed = 5;

  // Directions: -1 = up, 0 = stop, 1 = down
  const paddleDirections = useRef<{ a: number; b: number }>({ a: 0, b: 0 });

  // Refs for positions/states used in the game loop
  const paddleARef = useRef<number>(240);
  const paddleBRef = useRef<number>(240);
  const ballRef = useRef<{ x: number; y: number; dx: number; dy: number }>({ x: 462, y: 278, dx: 1, dy: 1 });
  const scoreRef = useRef(score);
  const gameOverRef = useRef(gameOver);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  const resetBall = () => {
    // Reverse horizontal direction and reset vertical direction
    ballRef.current = {
      x: 462,
      y: 278,
      dx: ballRef.current.dx > 0 ? -1 : 1,
      dy: 1
    };
  };

  useEffect(() => {
    const minPaddlePos = 0;
    const maxPaddlePos = 456; // 556 field height - 100 paddle height

    // Run the game loop every 20ms, similar to the remote server's 0.02s updates
    const interval = setInterval(() => {
      if (gameOverRef.current || gamePaused) return;

      // Update paddle positions
      paddleARef.current += paddleDirections.current.a * paddleSpeed;
      paddleBRef.current += paddleDirections.current.b * paddleSpeed;

      // Clamp paddle positions
      paddleARef.current = Math.max(minPaddlePos, Math.min(maxPaddlePos, paddleARef.current));
      paddleBRef.current = Math.max(minPaddlePos, Math.min(maxPaddlePos, paddleBRef.current));

      // Update the ball
      const ball = ballRef.current;
      ball.x += ball.dx * ballSpeed;
      ball.y += ball.dy * ballSpeed;

      // Check collisions with top/bottom walls
      if (ball.y <= 0 || ball.y >= 556) {
        ball.dy *= -1;
      }

      // Check paddle collisions
      // Paddle A: x <= 20; Paddle B: x >= 904
      if (ball.x <= 20 && ball.y >= paddleARef.current && ball.y <= paddleARef.current + 100) {
        ball.dx *= -1;
      } else if (ball.x >= 904 && ball.y >= paddleBRef.current && ball.y <= paddleBRef.current + 100) {
        ball.dx *= -1;
      }

      // Check for goals
      let newScore = { ...scoreRef.current };
      if (ball.x < 0) {
        newScore.b += 1;
        resetBall();
      } else if (ball.x > 924) {
        newScore.a += 1;
        resetBall();
      }

      // Check for game over
      let newGameOver = false;
      if (newScore.a >= MAX_SCORE || newScore.b >= MAX_SCORE) {
        newGameOver = true;
      }

      // Update React states once per frame
      setPaddleAPosition(paddleARef.current);
      setPaddleBPosition(paddleBRef.current);
      setBallPosition({ x: ballRef.current.x, y: ballRef.current.y });
      setScore(newScore);
      if (newGameOver && !gameOverRef.current) {
        setGameOver(true);
      }
    }, 20);

    return () => {
      clearInterval(interval);
    };
  }, [gamePaused]);

  // Handle keydown/keyup for paddle directions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameOverRef.current) return;
      if (event.key === 'w') {
        paddleDirections.current.a = -1;
      } else if (event.key === 's') {
        paddleDirections.current.a = 1;
      } else if (event.key === 'ArrowUp') {
        paddleDirections.current.b = -1;
      } else if (event.key === 'ArrowDown') {
        paddleDirections.current.b = 1;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'w' || event.key === 's') {
        paddleDirections.current.a = 0;
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        paddleDirections.current.b = 0;
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
    <div className="pong d-flex align-items-center justify-content-center vh-100">
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
            <h2>Game Paused</h2>
          </div>
        )}
        {gameOver && (
          <div className="game-over">
            <h2>{score.a > score.b ? 'Player A wins!' : 'Player B wins!'}</h2>
          </div>
        )}
        <div className="player-info">
          <h3>Local Mode: Player A (W/S), Player B (↑/↓)</h3>
        </div>
      </div>
    </div>
  );
};

export default LocalPongCanvas;
