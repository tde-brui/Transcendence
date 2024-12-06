import React, { useEffect, useState, useRef } from 'react';

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

  const ballRef = useRef({ x: 462, y: 278, dx: 1, dy: 1 });
  const scoreRef = useRef(score);
  const gameOverRef = useRef(gameOver);

  // Keep refs updated
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // Handle continuous movement via animation frame
  useEffect(() => {
    const minPaddlePos = 0;
    const maxPaddlePos = 456; // 556 field height - 100 paddle height

    const animate = () => {
      if (gameOverRef.current || gamePaused) {
        requestAnimationFrame(animate);
        return;
      }

      // Update paddle positions
      setPaddleAPosition(prev => {
        let newPos = prev + paddleDirections.current.a * paddleSpeed;
        return Math.max(minPaddlePos, Math.min(maxPaddlePos, newPos));
      });

      setPaddleBPosition(prev => {
        let newPos = prev + paddleDirections.current.b * paddleSpeed;
        return Math.max(minPaddlePos, Math.min(maxPaddlePos, newPos));
      });

      // After updating state, read the latest paddle positions
      const updatedAPos = paddleAPosition + paddleDirections.current.a * paddleSpeed;
      const updatedBPos = paddleBPosition + paddleDirections.current.b * paddleSpeed;

      // Update the ball
      const ball = ballRef.current;
      ball.x += ball.dx * ballSpeed;
      ball.y += ball.dy * ballSpeed;

      // Check wall collisions
      if (ball.y <= 0 || ball.y >= 556) {
        ball.dy *= -1;
      }

      // Check paddle collisions
      // Paddle A at x=0..20, Paddle B at x=904..924 (field width=924)
      if (ball.x <= 20 && ball.y >= updatedAPos && ball.y <= updatedAPos + 100) {
        ball.dx *= -1;
      } else if (ball.x >= 904 && ball.y >= updatedBPos && ball.y <= updatedBPos + 100) {
        ball.dx *= -1;
      }

      // Check for goals
      if (ball.x < 0) {
        setScore(prev => ({ a: prev.a, b: prev.b + 1 }));
        resetBall();
      } else if (ball.x > 924) {
        setScore(prev => ({ a: prev.a + 1, b: prev.b }));
        resetBall();
      }

      // Check for game over
      if (scoreRef.current.a >= MAX_SCORE || scoreRef.current.b >= MAX_SCORE) {
        setGameOver(true);
      }

      // Update state with new ball position
      setBallPosition({ x: ball.x, y: ball.y });

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      // cleanup if needed
    };
  }, [gamePaused, paddleAPosition, paddleBPosition]);

  const resetBall = () => {
    ballRef.current = { x: 462, y: 278, dx: ballRef.current.dx > 0 ? -1 : 1, dy: 1 };
    setBallPosition({ x: 462, y: 278 });
  };

  // Handle keydown/keyup for paddle directions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameOver) return;
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
  }, [gameOver]);

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
