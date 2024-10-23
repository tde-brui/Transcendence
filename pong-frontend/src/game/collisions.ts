import { gameState } from "./gameState.js";

export function paddleCollision()
{
	//paddle1 bounce angle calculation
	if (gameState.ballY > gameState.paddle1Y && gameState.ballY < gameState.paddle1Y + gameState.paddleheight && gameState.ballX < gameState.paddlewidth)
		{
			// range of where the ball hits the paddle.
			// For example. If you have paddlesize 100, this will be in a range from -50 to 50.
			let relativeIntersectY = gameState.paddle1Y - gameState.ballY + gameState.paddleheight / 2;
			// normalized value of the range of where the ball hits the paddle. (-1 to 1);
			let normalizedRelativeIntersectionY = relativeIntersectY / (gameState.paddleheight / 2);
			let bounceAngle = normalizedRelativeIntersectionY * gameState.MAX_BOUNCE_ANGLE;
	
			gameState.ballSpeedX = -gameState.ballSpeedX;
			gameState.ballSpeedY = gameState.ballSpeed * -Math.sin(bounceAngle);
		}
		//paddle2 bounce angle calculation
		if (gameState.ballY > gameState.paddle2Y && gameState.ballY < gameState.paddle2Y + gameState.paddleheight && gameState.ballX > gameState.canvas.width - gameState.paddlewidth)
		{
			let relativeIntersectY = gameState.paddle2Y - gameState.ballY + gameState.paddleheight / 2;
			let normalizedRelativeIntersectionY = relativeIntersectY / (gameState.paddleheight / 2);
			let bounceAngle = normalizedRelativeIntersectionY * gameState.MAX_BOUNCE_ANGLE;
	
			gameState.ballSpeedY = gameState.ballSpeed * -Math.sin(bounceAngle);
			gameState.ballSpeedX = -gameState.ballSpeedX;
		}
}

export function spriteCollision()
{
	for (let i = 0; i < gameState.activePowerUps.length; i++)
	{
		if (gameState.ballX > gameState.activePowerUps[i].x && gameState.ballX < gameState.activePowerUps[i].x + gameState.activePowerUps[i].width && gameState.ballY > gameState.activePowerUps[i].y && gameState.ballY < gameState.activePowerUps[i].y + gameState.activePowerUps[i].height)
		{
			if (gameState.activePowerUps[i].image === gameState.sprites.bigPaddleSprite)
				gameState.paddleheight = 200;
			if (gameState.activePowerUps[i].image === gameState.sprites.fastBallSprite)
				gameState.ballSpeedX = 10;
			if (gameState.activePowerUps[i].image === gameState.sprites.freezePaddleSprite)
				gameState.paddleSpeed = 5;
			gameState.activePowerUps.splice(i, 1);
			gameState.powerUpN--;
		}
	}
}