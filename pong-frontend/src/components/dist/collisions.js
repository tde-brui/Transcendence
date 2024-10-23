export function paddleCollision(gameState) {
    //paddle1 bounce angle calculation
    if (
        gameState.ballY > gameState.paddle1Y &&
        gameState.ballY < gameState.paddle1Y + gameState.paddleheight &&
        gameState.ballX < gameState.paddlewidth
    ) {
        // range of where the ball hits the paddle.
        const relativeIntersectY = gameState.paddle1Y - gameState.ballY + gameState.paddleheight / 2;
        // normalized value of the range of where the ball hits the paddle. (-1 to 1)
        const normalizedRelativeIntersectionY = relativeIntersectY / (gameState.paddleheight / 2);
        const bounceAngle = normalizedRelativeIntersectionY * gameState.MAX_BOUNCE_ANGLE;

        // Reverse X direction and apply bounce angle
        gameState.ballSpeedX = -gameState.ballSpeedX;
        gameState.ballSpeedY = gameState.ballSpeed * -Math.sin(bounceAngle);
    }

    //paddle2 bounce angle calculation
    if (
        gameState.ballY > gameState.paddle2Y &&
        gameState.ballY < gameState.paddle2Y + gameState.paddleheight &&
        gameState.ballX > gameState.canvas.width - gameState.paddlewidth
    ) {
        const relativeIntersectY = gameState.paddle2Y - gameState.ballY + gameState.paddleheight / 2;
        const normalizedRelativeIntersectionY = relativeIntersectY / (gameState.paddleheight / 2);
        const bounceAngle = normalizedRelativeIntersectionY * gameState.MAX_BOUNCE_ANGLE;

        // Reverse X direction and apply bounce angle
        gameState.ballSpeedX = -gameState.ballSpeedX;
        gameState.ballSpeedY = gameState.ballSpeed * -Math.sin(bounceAngle);
    }
}

export function spriteCollision(gameState) {
    for (let i = 0; i < gameState.activePowerUps.length; i++) {
        const powerUp = gameState.activePowerUps[i];
        if (
            gameState.ballX > powerUp.x &&
            gameState.ballX < powerUp.x + powerUp.width &&
            gameState.ballY > powerUp.y &&
            gameState.ballY < powerUp.y + powerUp.height
        ) {
            // Apply power-up effects
            if (powerUp.image === gameState.sprites.bigPaddleSprite) {
                gameState.paddleheight = 200;
            }
            if (powerUp.image === gameState.sprites.fastBallSprite) {
                gameState.ballSpeed = 10;
            }
            if (powerUp.image === gameState.sprites.freezePaddleSprite) {
                gameState.paddleSpeed = 5;
            }

            // Remove the power-up after collision
            gameState.activePowerUps.splice(i, 1);
            gameState.powerUpN--;
        }
    }
}
