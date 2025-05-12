import { PLAYER, PLAYER_COLORS, DOT_POSITIONS } from "./constants";
import type { GridCell } from "./stores/useChainReaction";

// Calculate the critical mass of a cell based on its position
export const calculateCriticalMass = (
  row: number,
  col: number,
  rows: number,
  cols: number
): number => {
  // Corner cells (2 neighbors)
  if (
    (row === 0 && col === 0) ||
    (row === 0 && col === cols - 1) ||
    (row === rows - 1 && col === 0) ||
    (row === rows - 1 && col === cols - 1)
  ) {
    return 2;
  }

  // Edge cells (3 neighbors)
  if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
    return 3;
  }

  // Center cells (4 neighbors)
  return 4;
};

// Get positions for dots in a cell based on the number of dots
export const getDotPositions = (
  atoms: number,
  cellSize: number,
  dotSize: number
): { x: number; y: number }[] => {
  const positions = DOT_POSITIONS[atoms as keyof typeof DOT_POSITIONS];
  
  if (!positions) {
    // If we don't have a specific layout, create a circular pattern
    const radius = (cellSize - dotSize * 2) / 3;
    const angleStep = (2 * Math.PI) / atoms;
    
    return Array(atoms)
      .fill(0)
      .map((_, i) => {
        const angle = i * angleStep;
        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        };
      });
  }
  
  return positions;
};

// Check if a grid cell is about to explode (at critical mass - 1)
export const isAboutToExplode = (
  cell: GridCell,
  row: number,
  col: number,
  rows: number,
  cols: number
): boolean => {
  const criticalMass = calculateCriticalMass(row, col, rows, cols);
  return cell.atoms === criticalMass - 1;
};

// Generate a random offset for dot animation
export const randomOffset = (range: number): number => {
  return (Math.random() - 0.5) * range;
};

// Check if a cell is adjacent (including diagonally) to another cell
export const isAdjacentTo = (row1: number, col1: number, row2: number, col2: number): boolean => {
  return Math.abs(row1 - row2) <= 1 && Math.abs(col1 - col2) <= 1;
};

// Calculate if a player has won in classic mode
export const checkClassicWinner = (grid: GridCell[][]): PLAYER | null => {
  const players = new Set<PLAYER>();
  
  // Collect all players with atoms on the board
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      if (cell.player) {
        players.add(cell.player);
      }
    }
  }
  
  // If there's only one player left, they're the winner
  if (players.size === 1) {
    return Array.from(players)[0];
  }
  
  // Game still ongoing
  return null;
};

// Get the background color for the current turn
export const getTurnBackgroundColor = (currentPlayer: PLAYER): string => {
  return currentPlayer === PLAYER.RED 
    ? "rgb(255, 230, 230)" // Light red
    : "rgb(230, 242, 255)"; // Light blue
};

// Get text color based on background for better contrast
export const getTextColor = (bgColor: string): string => {
  // Simple check - if background is dark, use white text, otherwise black
  const isLight = bgColor.includes("255") || bgColor.includes("230");
  return isLight ? "#000000" : "#ffffff";
};
