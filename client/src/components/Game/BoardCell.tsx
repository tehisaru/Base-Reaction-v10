import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CELL_SIZE, 
  DOT_SIZE, 
  PLAYER_COLORS, 
  ANIMATION_DURATION 
} from "../../lib/constants";
import { 
  getDotPositions, 
  calculateCriticalMass, 
  isAboutToExplode, 
  randomOffset 
} from "../../lib/gameUtils";
import type { GridCell, PowerUpType } from "../../lib/stores/useChainReaction";

type BoardCellProps = {
  row: number;
  col: number;
  cell: GridCell;
  totalRows: number;
  totalCols: number;
  onCellClick: (row: number, col: number) => void;
  isValidMove: boolean;
  powerUpType?: PowerUpType;
  isHQ?: boolean;
  hqHealth?: number;
  maxHqHealth?: number; // Track max health to calculate damage spots
  isHQDamaged?: boolean; // Track if this HQ cell was just damaged
  isHQHealed?: boolean; // Track if this HQ cell was just healed
  isHQDestroyed?: boolean; // Track if this HQ cell was just destroyed
};

// HQ Base component with health-based glow effects
const HQBaseComponent: React.FC<{
  hqHealth: number;
  maxHqHealth: number;
  playerColor: string;
  isHQDamaged?: boolean;
  isHQHealed?: boolean;
  isHQDestroyed?: boolean;
}> = ({ hqHealth, maxHqHealth, playerColor, isHQDamaged, isHQHealed, isHQDestroyed }) => {
  const [isFlickering, setIsFlickering] = useState(false);

  // Health-based glow calculations - 3 health = current level, 4-5 = stronger, 2 = weaker, 1 = none
  const glowIntensity = hqHealth <= 1 ? 0 : hqHealth === 2 ? 0.4 : hqHealth === 3 ? 1 : hqHealth === 4 ? 1.5 : 2.0;
  const glowSize = hqHealth <= 1 ? 0 : hqHealth === 2 ? 8 : hqHealth === 3 ? 15 : hqHealth === 4 ? 25 : 35;
  
  // Flickering effect for 2 health
  useEffect(() => {
    if (hqHealth === 2) {
      const flickerInterval = setInterval(() => {
        setIsFlickering(prev => !prev);
      }, 200 + Math.random() * 300); // Asymmetric flickering
      
      return () => clearInterval(flickerInterval);
    } else {
      setIsFlickering(false);
    }
  }, [hqHealth]);

  const flickerOpacity = hqHealth === 2 && isFlickering ? 0.3 : 1;
  const baseGray = hqHealth === 1 ? 'rgb(120, 120, 120)' : playerColor;

  return (
    <motion.div 
      className="rounded-full flex items-center justify-center"
      initial={{ scale: 1.3 }}
      animate={isHQDestroyed ? {
        scale: [1.3, 6, 0],
        opacity: [1, 1, 0]
      } : (isHQDamaged || isHQHealed) ? {
        scale: [1.3, 1.5, 1.3],
      } : {
        scale: 1.3
      }}
      transition={{ 
        duration: isHQDestroyed ? 2.0 : 0.5,
        ease: "easeInOut"
      }}
      style={{
        width: '80%', 
        height: '80%',
        backgroundColor: baseGray,
        transition: "all 0.1s ease",
        boxShadow: glowIntensity > 0 ? 
          `0 0 ${glowSize}px ${playerColor}, 0 0 ${glowSize * 2}px ${playerColor}50` : 
          'none',
        opacity: flickerOpacity
      }}
    >
      <span className="text-xl font-bold text-white">
        {hqHealth}
      </span>
    </motion.div>
  );
};

const BoardCell: React.FC<BoardCellProps> = ({
  row,
  col,
  cell,
  totalRows,
  totalCols,
  onCellClick,
  isValidMove,
  powerUpType,
  isHQ,
  hqHealth,
  maxHqHealth = 5,
  isHQDamaged,
  isHQHealed,
  isHQDestroyed
}) => {
  const criticalMass = calculateCriticalMass(row, col, totalRows, totalCols);
  const aboutToExplode = isAboutToExplode(cell, row, col, totalRows, totalCols);
  const cellRef = useRef<HTMLDivElement>(null);

  // Get position of dots in the cell
  const positions = getDotPositions(cell.atoms, CELL_SIZE, DOT_SIZE);
  
  // Create state to hold shaking positions
  // Initialize with one offset per atom
  const [shakeOffsets, setShakeOffsets] = useState(() => 
    Array.from({length: cell.atoms}, () => ({x: 0, y: 0}))
  );
  
  // Update the animation effect when aboutToExplode changes or atoms change
  useEffect(() => {
    if (aboutToExplode && cell.atoms > 0) {
      // Use proper shaking animation for cells about to explode
      const interval = setInterval(() => {
        // Use more noticeable shake offsets
        setShakeOffsets(
          Array.from({length: cell.atoms}, () => ({
            x: randomOffset(7), // Increased shake intensity
            y: randomOffset(7)
          }))
        );
      }, 50); // Faster interval for more visible shaking
      
      return () => clearInterval(interval);
    } else {
      // Reset offsets when not about to explode
      setShakeOffsets(Array.from({length: cell.atoms}, () => ({x: 0, y: 0})));
    }
  }, [aboutToExplode, cell.atoms]);

  return (
    <div
      ref={cellRef}
      className="relative"
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        cursor: isValidMove ? "pointer" : "not-allowed",
        backgroundColor: isHQ 
          ? `${PLAYER_COLORS[cell.player!]}66` // 40% opacity of player color for HQ
          : "rgba(255, 255, 255, 0.1)", // Slightly visible white background
        border: "none", // Remove border for completely flat look
        margin: "1px",
        transition: "all 0.1s ease" // Faster hover transition
      }}
      onClick={() => {
        if (isValidMove) {
          onCellClick(row, col);
        }
      }}
    >
      {/* Power-up icon if present - also show when there are dots */}
      {powerUpType && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ 
            transition: "all 0.1s ease", // Faster transition
            overflow: "visible", // Allow glow to extend beyond boundaries
            zIndex: 10 // Ensure glow appears on top
          }}
        >
          {powerUpType === 'diamond' && (
            <div style={{
              filter: "drop-shadow(0 0 12px rgb(0, 255, 0)) drop-shadow(0 0 20px rgba(0, 255, 0, 0.5))", // Strong green glow without container clipping
              transition: "all 0.1s ease"
            }}>
              <svg 
                width="26" 
                height="26" 
                viewBox="0 0 24 24" 
                fill="rgb(50, 200, 50)" 
                stroke="rgb(0, 200, 0)" 
                strokeWidth="1"
                style={{ 
                  transition: "all 0.1s ease" // Faster transition
                }}
              >
                <path d="M12 2L2 12L12 22L22 12L12 2Z" />
              </svg>
            </div>
          )}
          {powerUpType === 'heart' && (
            <div style={{
              filter: "drop-shadow(0 0 12px rgb(0, 255, 0)) drop-shadow(0 0 20px rgba(0, 255, 0, 0.5))", // Strong green glow without container clipping
              transition: "all 0.1s ease"
            }}>
              <svg 
                width="26" 
                height="26" 
                viewBox="0 0 24 24" 
                fill="rgb(50, 200, 50)" 
                stroke="rgb(0, 200, 0)" 
                strokeWidth="1"
                style={{ 
                  transition: "all 0.1s ease" // Faster transition
                }}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* HQ base with health-based glow effects */}
      {isHQ && hqHealth !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ 
            padding: '2px' // Add padding to make space for the circle
          }}
        >
          <HQBaseComponent 
            hqHealth={hqHealth}
            maxHqHealth={maxHqHealth}
            playerColor={PLAYER_COLORS[cell.player!]}
            isHQDamaged={isHQDamaged}
            isHQHealed={isHQHealed}
            isHQDestroyed={isHQDestroyed}
          />
        </div>
      )}

      {/* Dots with shaking animation */}
      {!isHQ && cell.atoms > 0 && positions.map((pos, index) => (
        <motion.div
          key={`${row}-${col}-${index}`}
          className="absolute rounded-full"
          style={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            left: CELL_SIZE / 2 + pos.x + (aboutToExplode ? shakeOffsets[index]?.x || 0 : 0) - DOT_SIZE / 2,
            top: CELL_SIZE / 2 + pos.y + (aboutToExplode ? shakeOffsets[index]?.y || 0 : 0) - DOT_SIZE / 2,
            backgroundColor: PLAYER_COLORS[cell.player!],
            boxShadow: aboutToExplode 
              ? `0 0 8px ${PLAYER_COLORS[cell.player!]}, 0 0 16px ${PLAYER_COLORS[cell.player!]}` 
              : `0 0 4px ${PLAYER_COLORS[cell.player!]}`,
            border: `2px solid ${PLAYER_COLORS[cell.player!]}`,
            transition: aboutToExplode ? "none" : "all 0.1s ease"
          }}
        />
      ))}

      {/* Critical mass indicator */}
      {cell.atoms > 0 && cell.atoms === criticalMass && (
        <div className="absolute top-1 right-1">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default BoardCell;