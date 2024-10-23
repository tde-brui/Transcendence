import { gameState } from "./gameState.js";

export class PowerUp {
	image: HTMLImageElement;
	x: number;
	y: number;
	width: number;
	height: number;
	constructor (image: HTMLImageElement, x: number, y: number, width: number, height: number)
	{
		this.image = image;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
}

export function spawnPowerup()
{
	const powerUp = gameState.powerUps[Math.floor(Math.random() * gameState.powerUps.length)];
	const spawnX = Math.random() * gameState.canvas.width;
	const spawnY = Math.random() * gameState.canvas.height;

	let powerUpSprite: PowerUp | null = null;
	if (powerUp === "fasterBall" && gameState.powerUpN < 3)
		powerUpSprite = new PowerUp(gameState.sprites.fastBallSprite, spawnX, spawnY, 50, 50);
	if (powerUp === "biggerPaddle" && gameState.powerUpN < 3)
		powerUpSprite = new PowerUp(gameState.sprites.bigPaddleSprite, spawnX, spawnY, 50, 50);
	if (powerUp === "freezeOpponent" && gameState.powerUpN < 3)
		powerUpSprite = new PowerUp(gameState.sprites.freezePaddleSprite, spawnX, spawnY, 50, 50);
	if (powerUpSprite)
	{
		gameState.activePowerUps.push(powerUpSprite);
		gameState.powerUpN++;
	}
}