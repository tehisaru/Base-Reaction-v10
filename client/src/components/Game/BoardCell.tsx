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
  heartSelectionMode?: boolean; // Track if we're in heart selection mode
  pendingHeartPlayer?: string; // Track which player triggered the heart
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
  isHQDestroyed,
  heartSelectionMode = false,
  pendingHeartPlayer
}) => {
  const criticalMass = calculateCriticalMass(row, col, totalRows, totalCols);
  const aboutToExplode = isAboutToExplode(cell, row, col, totalRows, totalCols);
  
  // Heart target logic for 3+ player games
  const isHeartTarget = heartSelectionMode && 
    isHQ && 
    cell.player !== null && 
    cell.player !== pendingHeartPlayer;

  const cellRef = useRef<HTMLDivElement>(null);

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
    <div className="relative" style={{ width: CELL_SIZE, height: CELL_SIZE }}>
      {/* Background glow layer - underneath everything */}
      {isHQ && hqHealth !== undefined && hqHealth > 0 && (
        <div
          className="absolute inset-0"
          style={{
            background: isHeartTarget 
              ? "radial-gradient(circle, rgba(255,0,0,0.8) 0%, rgba(255,0,0,0.3) 50%, transparent 100%)"
              : `radial-gradient(circle, ${PLAYER_COLORS[cell.player!]}aa 0%, ${PLAYER_COLORS[cell.player!]}44 50%, transparent 100%)`,
            borderRadius: "4px",
            transform: `scale(${1 + (hqHealth * 0.3)})`, // Scale glow based on health
            transition: "all 0.3s ease",
            zIndex: 1
          }}
        />
      )}
      
      {/* Main cell */}
      <div
        ref={cellRef}
        className="relative"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          cursor: (isValidMove || isHeartTarget) ? "pointer" : "not-allowed",
          backgroundColor: isHQ 
            ? `${PLAYER_COLORS[cell.player!]}66` // 40% opacity of player color for HQ
            : "rgba(255, 255, 255, 0.1)", // Slightly visible white background
          border: "none", // Remove border for completely flat look
          margin: "1px",
          transition: "all 0.3s ease", // Match the background transition speed
          zIndex: 2
        }}
        onClick={() => {
          if (isValidMove || isHeartTarget) {
            onCellClick(row, col);
          }
        }}
      >
        {/* Power-up icon if present - completely flat with same transition speed and strong green glow */}
        {powerUpType && cell.atoms === 0 && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ 
              transition: "all 0.3s ease", // Match the background transition speed
              overflow: "visible", // Allow glow to extend beyond boundaries
              zIndex: 10 // Ensure glow appears on top
            }}
          >
            {powerUpType === 'diamond' && (
              <div style={{
                filter: "drop-shadow(0 0 12px rgb(0, 255, 0)) drop-shadow(0 0 20px rgba(0, 255, 0, 0.5))", // Strong green glow without container clipping
                transition: "all 0.3s ease"
              }}>
                <svg 
                  width="26" 
                  height="26" 
                  viewBox="0 0 24 24" 
                  fill="rgb(50, 200, 50)" 
                  stroke="rgb(0, 200, 0)" 
                  strokeWidth="1"
                  style={{ 
                    transition: "all 0.3s ease" // Match the background transition speed
                  }}
                >
                  <path d="M12 2L2 12L12 22L22 12L12 2Z" />
                </svg>
              </div>
            )}
            {powerUpType === 'heart' && (
              <div style={{
                filter: "drop-shadow(0 0 12px rgb(0, 255, 0)) drop-shadow(0 0 20px rgba(0, 255, 0, 0.5))", // Strong green glow without container clipping
                transition: "all 0.3s ease"
              }}>
                <svg 
                  width="26" 
                  height="26" 
                  viewBox="0 0 24 24" 
                  fill="rgb(50, 200, 50)" 
                  stroke="rgb(0, 200, 0)" 
                  strokeWidth="1"
                  style={{ 
                    transition: "all 0.3s ease" // Match the background transition speed
                  }}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* HQ base as a big circle - only show if health > 0 */}
        {isHQ && hqHealth !== undefined && hqHealth > 0 && (
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
                transition: "all 0.8s ease", // Match background transition speed
                zIndex: 3
              }}
            >
              <span className="text-xl font-bold text-white">
                {hqHealth}
              </span>
            </motion.div>
          </div>
        )}

        {/* Dots - only show if not an HQ or if HQ is destroyed */}
        <AnimatePresence>
          {cell.atoms > 0 && (!isHQ || (isHQ && hqHealth === 0)) && (
            <div className="absolute inset-0">
              {getDotPositions(cell.atoms, criticalMass).map((pos, index) => (
                <motion.div
                  key={`dot-${index}`}
                  initial={{ 
                    scale: 0,
                    x: pos.x,
                    y: pos.y
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
                      ? `0 0 8px ${PLAYER_COLORS[cell.player!]}` // Strong glow effect when near critical
                      : `0 0 2px ${PLAYER_COLORS[cell.player!]}`, // Very slight glow at all times
                    transform: `scale(${(cell.atoms / criticalMass) * 0.7 + 0.3})` // Shrink based on critical mass ratio (min 0.3, max 1.0)
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BoardCell;