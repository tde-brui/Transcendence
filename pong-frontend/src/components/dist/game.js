import { gameState } from "./gameState.js";
import { spawnPowerup } from "./powerUp.js";
import { paddleCollision, spriteCollision } from "./collisions.js";

export function initGame(canvas) {
    gameState.canvas = canvas;
    gameState.ctx = canvas.getContext('2d');
    
    startScreen();
}

function drawGame() {
    //clear the canvas
    gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    //draw the score
    gameState.ctx.font = "20px 'Press Start 2P'";
    gameState.ctx.fillText(gameState.player1Score.toString(), gameState.canvas.width / 4, 100);
    gameState.ctx.fillText(gameState.player2Score.toString(), gameState.canvas.width * 3 / 4, 100);
    //draw powerup sprites
    if (gameState.activePowerUps.length > 0) {
        for (let i = 0; i < gameState.activePowerUps.length; i++) {
            gameState.ctx.drawImage(gameState.activePowerUps[i].image, gameState.activePowerUps[i].x, gameState.activePowerUps[i].y, gameState.activePowerUps[i].width, gameState.activePowerUps[i].height);
        }
    }
    // update paddle positions
    if (gameState.keys.ArrowUp && gameState.paddle1Y > 0)
        gameState.paddle1Y -= gameState.paddleSpeed;
    if (gameState.keys.ArrowDown && gameState.paddle1Y + gameState.paddleheight < gameState.canvas.height)
        gameState.paddle1Y += gameState.paddleSpeed;
    if (gameState.keys.w && gameState.paddle2Y > 0)
        gameState.paddle2Y -= gameState.paddleSpeed;
    if (gameState.keys.s && gameState.paddle2Y + gameState.paddleheight < gameState.canvas.height)
        gameState.paddle2Y += gameState.paddleSpeed;

    // Draw ball and paddles
    gameState.ctx.fillStyle = "white";
    gameState.ctx.beginPath();
    gameState.ctx.arc(gameState.ballX, gameState.ballY, 10, 0, Math.PI * 2);
    gameState.ctx.fill();
    gameState.ctx.fillRect(0, gameState.paddle1Y, gameState.paddlewidth, gameState.paddleheight);
    gameState.ctx.fillRect(gameState.canvas.width - gameState.paddlewidth, gameState.paddle2Y, gameState.paddlewidth, gameState.paddleheight);
}

function updateGame() {
    gameState.ballX += gameState.ballSpeedX;
    gameState.ballY += gameState.ballSpeedY;
    paddleCollision();
    spriteCollision();
    if (gameState.ballY > gameState.canvas.height || gameState.ballY < 0) {
        gameState.ballSpeedY = -gameState.ballSpeedY;
    }
    if (gameState.ballX > gameState.canvas.width || gameState.ballX < 0) {
        if (gameState.ballX > gameState.canvas.width)
            gameState.player1Score++;
        else
            gameState.player2Score++;
        resetBall();
    }
}

function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

function resetBall() {
    gameState.gamePaused = true;
    gameState.ballX = gameState.canvas.width / 2;
    gameState.ballY = gameState.canvas.height / 2;
    gameState.ballSpeedX = 0;
    gameState.ballSpeedY = 0;
    document.addEventListener("keydown", function (e) {
        if (e.key === " " && gameState.gamePaused) {
            gameState.gamePaused = false;
            gameState.ballSpeedX = gameState.ballSpeed;
            gameState.ballSpeedY = Math.random() * 2 * gameState.ballSpeed - gameState.ballSpeed;
        }
    });
}

function startScreen() {
    gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    gameState.ctx.fillStyle = "white";
    gameState.ctx.font = "50px 'Press Start 2P'";
    gameState.ctx.textAlign = "center";
    gameState.ctx.fillText("Press space to start", gameState.canvas.width / 2, gameState.canvas.height / 2);
    document.addEventListener("keydown", function (e) {
        if (e.key === " " && !gameState.gameStarted) {
            setInterval(spawnPowerup, 10000);
            gameState.gameStarted = true;
            gameLoop();
        }
    });
}
