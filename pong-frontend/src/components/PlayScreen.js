import React, { useEffect, useRef } from 'react';
import { createGameState, loadSprites } from './dist/gameState.js';
import { initGame } from './dist/game.js'; // Assuming this is the game loop logic

function PlayScreen() {
    const canvasRef = useRef(null);
    const gameStateRef = useRef(null); // To hold the game state

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Initialize the gameState with the canvas and context
        const gameState = createGameState(canvas, ctx);
        gameStateRef.current = gameState;

        // Load sprites
        loadSprites(gameState);

        // Start the game
        initGame(gameState); // Initialize game loop, pass gameState as argument

    }, []); // Runs only once after the component mounts

    return (
        <div className="flex items-center justify-center h-screen bg-black">
            <canvas ref={canvasRef} width="800" height="500" className="block mx-auto bg-black"></canvas>
        </div>
    );
}

export default PlayScreen;
