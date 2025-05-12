import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameBoard from "../components/Game/GameBoard";
import GameControls from "../components/Game/GameControls";
import GameOverOverlay from "../components/Game/GameOverOverlay";
import { useChainReaction } from "../lib/stores/useChainReaction";
import { PLAYER_BG_COLORS } from "../lib/constants";
import { useAITurn } from "../lib/useAITurn";
import { PlayerSettingsManager } from "../components/Menu/MainMenu";

const ClassicMode: React.FC = () => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Initialize AI for automatic turns
  useAITurn();
  
  const {
    grid,
    rows,
    cols,
    currentPlayer,
    gameOver,
    winner,
    history,
    placeDot,
    undo,
    restart,
    isValidMove,
    initClassicMode
  } = useChainReaction();
  
  // Initialize classic mode on component mount
  useEffect(() => {
    initClassicMode();
    
    // Set up keyboard shortcut for restarting with R
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        restart();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [initClassicMode, restart]);
  
  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    // Check if current player is AI-controlled
    const isCurrentPlayerAI = PlayerSettingsManager.isAIPlayer(currentPlayer);
    
    // Only allow clicks if:
    // 1. Game is not over
    // 2. It's a valid move
    // 3. Current player is NOT AI-controlled (prevent human playing during AI turn)
    if (!gameOver && isValidMove(row, col) && !isCurrentPlayerAI) {
      placeDot(row, col);
      
      // Add fallback timeout to ensure animation state resets
      // Using a shorter timeout for better responsiveness
      setTimeout(() => {
        // Always reset animation state
        console.log("Animation timeout in ClassicMode - forcing reset");
        setIsAnimating(false);
      }, 200); // Very short timeout for better responsiveness
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500"
      style={{ backgroundColor: PLAYER_BG_COLORS[currentPlayer] }}
    >
      <h1 className="text-3xl font-bold mb-6 text-white" style={{ fontFamily: 'Menlo, monospace' }}>Chain Reaction</h1>
      
      <GameControls
        currentPlayer={currentPlayer}
        onUndo={undo}
        onRestart={restart}
        canUndo={history.length > 0}
        isBaseMode={false}
      />
      
      <GameBoard
        grid={grid}
        rows={rows}
        cols={cols}
        currentPlayer={currentPlayer}
        onCellClick={handleCellClick}
        isValidMove={isValidMove}
        isAnimating={isAnimating}
        setIsAnimating={setIsAnimating}
      />
      
      {gameOver && winner && (
        <GameOverOverlay
          winner={winner}
          onRestart={restart}
          onBackToMenu={() => navigate("/")}
        />
      )}
    </div>
  );
};

export default ClassicMode;
