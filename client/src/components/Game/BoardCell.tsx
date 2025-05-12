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
  isHQDamaged?: boolean; // Track if this HQ cell was just damaged
  isHQHealed?: boolean; // Track if this HQ cell was just healed
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
  isHQDamaged,
  isHQHealed
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
        transition: "all 0.3s ease" // Match the background transition speed
      }}
      onClick={() => {
        if (isValidMove) {
          onCellClick(row, col);
        }
      }}
    >
      {/* Power-up icon if present - completely flat with same transition speed */}
      {powerUpType && cell.atoms === 0 && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ transition: "all 0.3s ease" }} // Match the background transition speed
        >
          {powerUpType === 'diamond' && (
            <svg 
              width="26" 
              height="26" 
              viewBox="0 0 24 24" 
              fill="rgb(50, 200, 50)" 
              stroke="rgb(0, 200, 0)" 
              strokeWidth="1"
              style={{ transition: "all 0.3s ease" }} // Match the background transition speed
            >
              <path d="M12 2L2 12L12 22L22 12L12 2Z" />
            </svg>
          )}
          {powerUpType === 'heart' && (
            <svg 
              width="26" 
              height="26" 
              viewBox="0 0 24 24" 
              fill="rgb(50, 200, 50)" 
              stroke="rgb(0, 200, 0)" 
              strokeWidth="1"
              style={{ transition: "all 0.3s ease" }} // Match the background transition speed
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
        </div>
      )}

      {/* HQ base as a big circle - no drop shadows for flat design */}
      {isHQ && hqHealth !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ 
            padding: '2px' // Add padding to make space for the circle
          }}
        >
          <motion.div 
            className="rounded-full flex items-center justify-center"
            initial={{ scale: 1.3 }} // Start already scaled
            animate={(isHQDamaged || isHQHealed) ? {
              scale: [1.3, 1.5, 1.3], // Pulse from already scaled size
              // Removed boxShadow animation for flat design
            } : {
              scale: 1.3 // Keep steady size
            }}
            transition={{ 
              duration: 0.5,
              ease: "easeInOut"
            }}
            style={{
              width: '80%', 
              height: '80%',
              backgroundColor: PLAYER_COLORS[cell.player!], // Fully opaque background
              transition: "all 0.3s ease", // Match background transition speed
              boxShadow: `0 0 10px ${PLAYER_COLORS[cell.player!]}` // Constant glow for HQ
            }}
          >
            <span className="text-xl font-bold text-white">
              {hqHealth}
            </span>
          </motion.div>
          
          <AnimatePresence>
            {isHQDamaged && (
              <>
                {/* Only keep the explosion ring effect */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  style={{
                    backgroundColor: 'transparent',
                    border: `3px solid ${PLAYER_COLORS[cell.player!]}`,
                    boxShadow: 'none' // No shadow for flat design
                  }}
                />
              </>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {isHQHealed && (
              <>
                {/* Only keep the healing ring effect */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  style={{
                    backgroundColor: 'transparent',
                    border: `3px solid rgba(100, 255, 100, 0.8)`,
                    boxShadow: 'none' // No shadow for flat design
                  }}
                />
              </>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Render atoms (except on HQ cells in base mode) */}
      <AnimatePresence>
        {cell.atoms > 0 && cell.player && !isHQ && (
          <div className="absolute inset-0 flex items-center justify-center">
            {positions.map((pos, index) => (
              <motion.div
                key={`${row}-${col}-${index}`}
                initial={{ 
                  scale: 0,
                  x: 0, // Start from center for smoother animation
                  y: 0
                }}
                animate={{ 
                  scale: 1,
                  x: aboutToExplode ? pos.x + shakeOffsets[index]?.x || 0 : pos.x,
                  y: aboutToExplode ? pos.y + shakeOffsets[index]?.y || 0 : pos.y
                }}
                exit={{ 
                  scale: [1, 0.8, 0],
                  x: [pos.x, pos.x * 1.5], // Move slightly outward when disappearing
                  y: [pos.y, pos.y * 1.5]
                }}
                transition={{ 
                  duration: ANIMATION_DURATION / 1000,
                  type: aboutToExplode ? "tween" : "spring",
                  stiffness: 300,
                  damping: 20,
                  repeat: 0
                }}
                className="absolute rounded-full"
                style={{
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                  backgroundColor: PLAYER_COLORS[cell.player!],
                  boxShadow: aboutToExplode 
                    ? `0 0 8px ${PLAYER_COLORS[cell.player!]}` // Glow effect when near critical
                    : 'none',
                  transform: `scale(${(cell.atoms / criticalMass) * 0.7 + 0.3})` // Shrink based on critical mass ratio (min 0.3, max 1.0)
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BoardCell;