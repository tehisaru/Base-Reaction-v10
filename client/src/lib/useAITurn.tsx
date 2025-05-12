import { useEffect } from 'react';
import { PLAYER } from './constants';
import { useChainReaction } from './stores/useChainReaction';
import { PlayerSettingsManager, PLAYER_CONTROL } from '../components/Menu/MainMenu';
import { getAIMove } from './aiPlayer';

/**
 * A React hook to process AI turns
 */
export const useAITurn = () => {
  const { 
    currentPlayer, 
    gameOver,
    grid,
    isBaseMode,
    hqs,
    placeDot,
    animating
  } = useChainReaction();

  useEffect(() => {
    // Skip if game is over or animations are in progress
    if (gameOver || animating) {
      return;
    }

    // Check if current player is AI-controlled
    const isCurrentPlayerAI = PlayerSettingsManager.isAIPlayer(currentPlayer);
    
    if (isCurrentPlayerAI) {
      console.log(`AI Turn for ${currentPlayer} player`);
      
      // Add a small delay to make the AI move feel more natural
      const timeoutId = setTimeout(() => {
        // Get the AI's move
        const difficulty = PlayerSettingsManager.getAIDifficulty(currentPlayer);
        const aiMove = getAIMove(grid, currentPlayer, isBaseMode, hqs, difficulty);
        
        if (aiMove) {
          console.log(`AI ${currentPlayer} (${difficulty}) placed dot at (${aiMove.row}, ${aiMove.col})`);
          placeDot(aiMove.row, aiMove.col);
        } else {
          console.warn(`AI ${currentPlayer} couldn't find a valid move`);
        }
      }, 750); // Delay AI moves by 750ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayer, gameOver, grid, isBaseMode, hqs, placeDot, animating]);
};