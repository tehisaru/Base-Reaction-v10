import { useEffect } from 'react';
import { PLAYER } from './constants';
import { useChainReaction } from './stores/useChainReaction';
import { PlayerSettingsManager, PLAYER_CONTROL } from '../components/Menu/MainMenu';
import { getAIMove, AI_STRATEGY } from './aiPlayer';

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
    powerUps,
    placeDot,
    animating,
    heartSelectionMode,
    pendingHeartPlayer
  } = useChainReaction();

  useEffect(() => {
    // Skip if game is over or animations are in progress
    if (gameOver || animating) {
      return;
    }

    // Check if current player is AI-controlled
    const isCurrentPlayerAI = PlayerSettingsManager.isAIPlayer(currentPlayer);
    
    if (isCurrentPlayerAI) {
      // Handle heart power-up enemy selection for AI
      if (heartSelectionMode && pendingHeartPlayer === currentPlayer) {
        console.log(`🤖 AI ${currentPlayer} in heart selection mode - choosing enemy target`);
        
        const timeoutId = setTimeout(() => {
          // Find all enemy HQs that can be targeted
          const enemyHQs = hqs?.filter(hq => hq.player !== currentPlayer) || [];
          
          if (enemyHQs.length > 0) {
            // AI picks a random enemy (or could use strategy later)
            const targetEnemy = enemyHQs[Math.floor(Math.random() * enemyHQs.length)];
            console.log(`🤖 AI ${currentPlayer} selecting enemy ${targetEnemy.player} for heart damage`);
            placeDot(targetEnemy.row, targetEnemy.col);
          } else {
            console.warn(`🤖 AI ${currentPlayer} found no enemy targets, canceling heart selection`);
            // Click an empty cell to cancel selection
            placeDot(0, 0);
          }
        }, 750); // Same delay as normal moves
        
        return () => clearTimeout(timeoutId);
      }
      
      // Normal AI turn logic
      if (!heartSelectionMode) {
        console.log(`AI Turn for ${currentPlayer} player`);
        
        // Add a small delay to make the AI move feel more natural
        const timeoutId = setTimeout(() => {
          // Get the AI's strategy (default to hard for aggressive play)
          const strategy = PlayerSettingsManager.getAIStrategy(currentPlayer);
          const aiMove = getAIMove(grid, currentPlayer, isBaseMode, hqs, strategy, powerUps);
          
          if (aiMove) {
            console.log(`AI ${currentPlayer} (${strategy}) placed dot at (${aiMove.row}, ${aiMove.col}) with score ${aiMove.score.toFixed(1)}`);
            placeDot(aiMove.row, aiMove.col);
          } else {
            console.warn(`AI ${currentPlayer} couldn't find a valid move`);
          }
        }, 750); // Delay AI moves by 750ms
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [currentPlayer, gameOver, grid, isBaseMode, hqs, powerUps, placeDot, animating, heartSelectionMode, pendingHeartPlayer]);
};