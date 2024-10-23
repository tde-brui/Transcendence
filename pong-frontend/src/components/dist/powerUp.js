import { gameState } from "./gameState.js";
var PowerUp = /** @class */ (function () {
    function PowerUp(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    return PowerUp;
}());
export { PowerUp };
export function spawnPowerup() {
    var powerUp = gameState.powerUps[Math.floor(Math.random() * gameState.powerUps.length)];
    var spawnX = Math.random() * gameState.canvas.width;
    var spawnY = Math.random() * gameState.canvas.height;
    var powerUpSprite = null;
    if (powerUp === "fasterBall" && gameState.powerUpN < 3)
        powerUpSprite = new PowerUp(gameState.sprites.fastBallSprite, spawnX, spawnY, 50, 50);
    if (powerUp === "biggerPaddle" && gameState.powerUpN < 3)
        powerUpSprite = new PowerUp(gameState.sprites.bigPaddleSprite, spawnX, spawnY, 50, 50);
    if (powerUp === "freezeOpponent" && gameState.powerUpN < 3)
        powerUpSprite = new PowerUp(gameState.sprites.freezePaddleSprite, spawnX, spawnY, 50, 50);
    if (powerUpSprite) {
        gameState.activePowerUps.push(powerUpSprite);
        gameState.powerUpN++;
    }
}
