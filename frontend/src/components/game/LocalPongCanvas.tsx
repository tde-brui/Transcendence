import React, { useRef, useEffect, useState } from 'react';

type PaddleKey = 'a' | 'b';
interface GameState {
  paddles: Record<PaddleKey, number>;
  ball: { x: number; y: number; dx: number; dy: number };
  score: Record<PaddleKey, number>;
  paddleDirections: Record<PaddleKey, number>;
  gameStarted: boolean;
}

const MAX_SCORE = 3;
const PADDLE_SPEED = 5;
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;

const LocalPongCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState(0); // keep track of countdown
  const [game, setGame] = useState<GameState>({
    paddles: { a: 250, b: 250 },
    ball: { x: 500, y: 300, dx: 1, dy: 1 },
    score: { a: 0, b: 0 },
    paddleDirections: { a: 0, b: 0 },
    gameStarted: false,
  });

  const gameOver = game.score.a >= MAX_SCORE || game.score.b >= MAX_SCORE;

  // only set gameStarted = true after countdown ends
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !game.gameStarted && !gameOver) {
      setGame((prev) => ({ ...prev, gameStarted: true }));
    }
  }, [countdown, game.gameStarted, gameOver]);

  // draw only
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    let animationFrameId: number;

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, game.paddles.a, 10, PADDLE_HEIGHT);
      ctx.fillRect(CANVAS_WIDTH - 10, game.paddles.b, 10, PADDLE_HEIGHT);

      ctx.beginPath();
      ctx.arc(game.ball.x, game.ball.y, BALL_SIZE, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${game.score.a}`, 50, 50);
      ctx.fillText(`Score: ${game.score.b}`, CANVAS_WIDTH - 150, 50);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [game]);

  // update game only if gameStarted and no countdown
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (game.gameStarted && countdown === 0) {
      intervalId = setInterval(() => {
        setGame((prev) => updateGameState(prev));
      }, 1000 / 60);
    }
    return () => clearInterval(intervalId);
  }, [game.gameStarted, countdown]);

  const startGame = () => {
    // simply trigger the countdown
    setCountdown(3);
  };

  const resetBall = (st: GameState): GameState => {
    return {
      ...st,
      ball: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        dx: st.ball.dx > 0 ? -1 : 1,
        dy: 1,
      },
    };
  };

  const resetGame = (): GameState => {
    return {
      paddles: { a: 250, b: 250 },
      ball: { x: 500, y: 300, dx: 1, dy: 1 },
      score: { a: 0, b: 0 },
      paddleDirections: { a: 0, b: 0 },
      gameStarted: false,
    };
  };

  const updateGameState = (st: GameState): GameState => {
    // no movement if not started
    if (!st.gameStarted) return st;

    let { paddles, ball, score, paddleDirections } = JSON.parse(JSON.stringify(st));

    paddles.a += paddleDirections.a * PADDLE_SPEED;
    paddles.b += paddleDirections.b * PADDLE_SPEED;
    paddles.a = Math.max(0, Math.min(500, paddles.a));
    paddles.b = Math.max(0, Math.min(500, paddles.b));

    ball.x += ball.dx * 5;
    ball.y += ball.dy * 5;

    if (ball.y <= 0 || ball.y >= CANVAS_HEIGHT - BALL_SIZE - 20) {
      ball.dy *= -1;
    }

    if (ball.x <= 10 && ball.y >= paddles.a && ball.y <= paddles.a + PADDLE_HEIGHT) {
      ball.dx *= -1.05;
      ball.dy *= 1.05;
    } else if (ball.x >= CANVAS_WIDTH - 40 && ball.y >= paddles.b && ball.y <= paddles.b + PADDLE_HEIGHT) {
      ball.dx *= -1.05;
      ball.dy *= 1.05;
    }

    if (ball.x < 0) {
      score.b += 1;
      ball = resetBall({ ...st, ball, score, paddles, paddleDirections }).ball;
      // pause game and trigger new countdown
      return { ...st, paddles, ball, score, gameStarted: false };
    } else if (ball.x > CANVAS_WIDTH) {
      score.a += 1;
      ball = resetBall({ ...st, ball, score, paddles, paddleDirections }).ball;
      // pause game and trigger new countdown
      return { ...st, paddles, ball, score, gameStarted: false };
    }

    if (score.a >= MAX_SCORE || score.b >= MAX_SCORE) {
      return resetGame();
    }

    return { ...st, paddles, ball, score };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!game.gameStarted) return;
    setGame((prev) => {
      const pd = { ...prev.paddleDirections };
      if (e.key === 'w') pd.a = -1;
      if (e.key === 's') pd.a = 1;
      if (e.key === 'ArrowUp') pd.b = -1;
      if (e.key === 'ArrowDown') pd.b = 1;
      return { ...prev, paddleDirections: pd };
    });
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    setGame((prev) => {
      const pd = { ...prev.paddleDirections };
      if (e.key === 'w' || e.key === 's') pd.a = 0;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') pd.b = 0;
      return { ...prev, paddleDirections: pd };
    });
  };

  // If a new point was scored, trigger a fresh countdown:
  useEffect(() => {
    if (!game.gameStarted && (game.score.a < MAX_SCORE && game.score.b < MAX_SCORE)) {
      // if we just turned gameStarted to false, start countdown again
      setCountdown(3);
    }
  }, [game.gameStarted, game.score]);

  return (
    <div
      className="pong d-flex flex-column align-items-center justify-content-center vh-100"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      style={{ outline: 'none' }}
    >
      <div className="overlap-group-wrapper">
        <div className="overlap-group">
          <div className="paddle-a" style={{ top: `${game.paddles.a}px` }} />
          <div className="paddle-b" style={{ top: `${game.paddles.b}px` }} />
          <div
            className="ball"
            style={{ left: `${game.ball.x}px`, top: `${game.ball.y}px` }}
          />
          <div className="overlap">
            <div className="score">
              {game.score.a} - {game.score.b}
            </div>
          </div>
        </div>

        <div className="player-name-a">Player A</div>
        <div className="player-name-b">Player B</div>

        {gameOver && (
          <div className="game-over">
            <h2>Game Over</h2>
          </div>
        )}

        {countdown > 0 && <div className="countdown">{countdown}</div>}

        {!game.gameStarted && !gameOver && countdown === 0 && (
          <div className="game-paused">
            <h2>Press "Start Game" to begin</h2>
            <button className="glass-button" onClick={startGame}>
              Start Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalPongCanvas;
