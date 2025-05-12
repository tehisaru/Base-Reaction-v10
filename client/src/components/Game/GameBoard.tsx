import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BoardCell from "./BoardCell";
import { CELL_SIZE, PLAYER } from "../../lib/constants";
import type { GridCell, PowerUpCell, HQCell } from "../../lib/stores/useChainReaction";
import { useAudio } from "../../lib/stores/useAudio";
import { useChainReaction } from "../../lib/stores/useChainReaction";

interface GameBoardProps {
  grid: GridCell[][];
  rows: number;
  cols: number;
  currentPlayer: PLAYER;
  onCellClick: (row: number, col: number) => void;
  isValidMove: (row: number, col: number) => boolean;
  powerUps?: PowerUpCell[];
  hqs?: HQCell[];
  isAnimating: boolean;
  setIsAnimating: (animating: boolean) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  rows,
  cols,
  currentPlayer,
  onCellClick,
  isValidMove,
  powerUps = [],
  hqs = [],
  isAnimating,
  setIsAnimating
}) => {
  const [lastClickedCell, setLastClickedCell] = useState<{row: number, col: number} | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const { playHit } = useAudio();
  const { lastHQDamaged } = useChainReaction();
  
  // Trigger entrance animation immediately when the component mounts
  useEffect(() => {
    // Start animation immediately
    setGameStarted(true);
  }, []);
  
  // Handle cell click with animation tracking
  const handleCellClick = (row: number, col: number) => {
    // REMOVED animation check to allow dot placement at any time
    
    // Play sound effect
    playHit();
    
    // Track this cell as last clicked
    setLastClickedCell({row, col});
    
    // Start animation and then process the move
    setIsAnimating(true);
    console.log(`Cell clicked: (${row},${col}), starting animation`);
    
    // Process the move immediately but keep animation state
    onCellClick(row, col);
    
    // Set a fallback timer to reset animation state in case the chain reaction logic doesn't do it
    // This timer is shorter for cells that don't trigger a chain reaction
    setTimeout(() => {
      // Always reset animation flag after a short delay
      console.log("Animation timeout reached - resetting animation state");
      setIsAnimating(false);
    }, 200); // Even shorter timeout for better responsiveness
  };
  
  // Get the power-up type for a specific cell
  const getPowerUpType = (row: number, col: number) => {
    const powerUp = powerUps.find(p => p.row === row && p.col === col);
    return powerUp?.type || null;
  };
  
  // Check if a cell is an HQ
  const getHQInfo = (row: number, col: number) => {
    const hq = hqs.find(h => h.row === row && h.col === col);
    return hq ? { isHQ: true, health: hq.health } : { isHQ: false };
  };
  
  // Define the entrance animation
  const boardContainerVariants = {
    hidden: { 
      scale: 0.8, 
      opacity: 1,
      rotate: -45,
      transformOrigin: "center center"
    },
    visible: { 
      scale: 1, 
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: 0.5,
        delay: 0
      }
    }
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center p-6 rounded-lg"
      initial="hidden"
      animate={gameStarted ? "visible" : "hidden"}
      variants={boardContainerVariants}
      style={{ 
        width: cols * CELL_SIZE + cols * 2 + 24, // Account for borders and padding
        height: rows * CELL_SIZE + rows * 2 + 24,
        background: "rgba(255, 255, 255, 0.05)",
        border: "none", // Remove border for completely flat look
        boxShadow: "0 0 15px rgba(255, 255, 255, 0.3)" // Add constant glow to board edges
      }}
    >
      {grid.map((rowCells, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex">
          {rowCells.map((cell, colIndex) => {
            const powerUpType = getPowerUpType(rowIndex, colIndex);
            const { isHQ, health } = getHQInfo(rowIndex, colIndex);
            const isHighlighted = lastClickedCell?.row === rowIndex && lastClickedCell?.col === colIndex;
            
            // Check if this is an HQ that was just damaged or healed
            // Add key based on current timestamp to force re-render and animation
            const isHQEffected = isHQ && lastHQDamaged !== undefined && 
                               lastHQDamaged.row === rowIndex && 
                               lastHQDamaged.col === colIndex;
            // Get the effect type if any
            const hqEffectType = isHQEffected ? lastHQDamaged?.type : undefined;
            
            return (
              <motion.div
                // Add lastHQDamaged timestamp to key to force re-render when damage occurs
                key={`cell-${rowIndex}-${colIndex}${isHQEffected ? `-${lastHQDamaged?.timestamp}` : ''}`}
                whileHover={{ scale: isValidMove(rowIndex, colIndex) ? 1.05 : 1 }}
                animate={{ 
                  scale: isHighlighted ? [1, 1.1, 1] : 1,
                  transition: { duration: 0.3 }
                }}
              >
                <BoardCell
                  key={isHQ ? `hq-${health}-${isHQEffected ? lastHQDamaged?.timestamp : Date.now()}` : undefined}
                  row={rowIndex}
                  col={colIndex}
                  cell={cell}
                  totalRows={rows}
                  totalCols={cols}
                  onCellClick={handleCellClick}
                  isValidMove={isValidMove(rowIndex, colIndex)}
                  powerUpType={powerUpType}
                  isHQ={isHQ}
                  hqHealth={health}
                  isHQDamaged={isHQEffected && hqEffectType === 'damage'}
                  isHQHealed={isHQEffected && hqEffectType === 'heal'}
                />
              </motion.div>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
};

export default GameBoard;
