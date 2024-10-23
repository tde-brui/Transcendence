export const createGameState = (canvas, ctx) => {
    return {
        canvas: canvas,
        ctx: ctx,
        gameStarted: false,
        gamePaused: false,
        ballX: canvas.width / 2,
        ballY: canvas.height / 2,
        ballSpeed: 5,
        ballSpeedX: 5,
        ballSpeedY: Math.random() * 2 * 5 - 5,
        MAX_BOUNCE_ANGLE: (5 * Math.PI) / 12,
        paddlewidth: 10,
        paddleheight: 100,
        paddle1Y: canvas.height / 2,
        paddle2Y: canvas.height / 2,
        paddleSpeed: 10,
        player1Score: 0,
        player2Score: 0,
        keys: {
            ArrowUp: false,
            ArrowDown: false,
            w: false,
            s: false,
        },
        powerUpN: 0,
        powerUps: ["fasterBall", "biggerPaddle", "freezeOpponent"],
        activePowerUps: [],
        sprites: {
            bigPaddleSprite: new Image(),
            fastBallSprite: new Image(),
            freezePaddleSprite: new Image(),
        },
    };
};

// Load sprites after creation
export const loadSprites = (gameState) => {
    gameState.sprites.bigPaddleSprite.src = "images/bigPaddle.png";
    gameState.sprites.fastBallSprite.src = "images/fastBall.png";
    gameState.sprites.freezePaddleSprite.src = "images/freezePaddle.webp";
};
