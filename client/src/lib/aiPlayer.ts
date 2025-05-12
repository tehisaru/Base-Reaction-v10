import { PLAYER } from './constants';
import { GridCell, HQCell } from './stores/useChainReaction';
import { calculateCriticalMass, isAdjacentTo } from './gameUtils';

export enum AI_DIFFICULTY {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

interface AIMove {
  row: number;
  col: number;
  score: number;
}

/**
 * Determines if a move is valid according to game rules
 */
export const isValidMoveForAI = (
  grid: GridCell[][],
  row: number,
  col: number,
  currentPlayer: PLAYER,
  isBaseMode: boolean,
  hqs?: HQCell[]
): boolean => {
  // Cell is out of bounds
  if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) {
    return false;
  }

  const cell = grid[row][col];
  
  // Check if this is an HQ cell (cannot place on HQ cells)
  if (isBaseMode && hqs && hqs.some(hq => hq.row === row && hq.col === col)) {
    return false;
  }

  // Classic Mode: Cell is empty or already owned by the current player
  if (!isBaseMode) {
    return cell.player === null || cell.player === currentPlayer;
  }
  
  // Base Reaction Mode
  
  // Cell already has atoms and is owned by another player
  if (cell.player !== null && cell.player !== currentPlayer) {
    return false;
  }
  
  // Check if this is the first move (player can only place on their row or column)
  if (hqs) {
    // Find the current player's HQ
    const playerHQ = hqs.find(hq => hq.player === currentPlayer);
    
    if (playerHQ) {
      // Check if this is the first move
      let hasPlayerDots = false;
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c].player === currentPlayer && grid[r][c].atoms > 0) {
            hasPlayerDots = true;
            break;
          }
        }
        if (hasPlayerDots) break;
      }
      
      // First move - can only place on player's row or column
      if (!hasPlayerDots) {
        // Can only place on the row or column of the HQ
        return row === playerHQ.row || col === playerHQ.col;
      }
      
      // After first move - can place adjacent to existing dots or near HQ
      let hasAdjacentDot = false;
      
      // Check if adjacent to player's HQ (3x3 area around HQ)
      const nearHQ = Math.abs(row - playerHQ.row) <= 1 && Math.abs(col - playerHQ.col) <= 1;
      
      // Check if adjacent to any existing player dot
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c].player === currentPlayer && grid[r][c].atoms > 0) {
            if (isAdjacentTo(row, col, r, c)) {
              hasAdjacentDot = true;
              break;
            }
          }
        }
        if (hasAdjacentDot) break;
      }
      
      return nearHQ || hasAdjacentDot;
    }
  }
  
  return true;
};

/**
 * Calculate critical mass for a cell
 */
export const calculateCriticalMassForAI = (
  grid: GridCell[][],
  row: number,
  col: number
): number => {
  return calculateCriticalMass(row, col, grid.length, grid[0].length);
};

/**
 * Count how many cells a player controls
 */
const countPlayerCells = (
  grid: GridCell[][],
  player: PLAYER
): number => {
  let count = 0;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col].player === player && grid[row][col].atoms > 0) {
        count++;
      }
    }
  }
  return count;
};

/**
 * Check if a cell would chain explode if filled to capacity
 * Returns the number of cells in the potential chain
 */
const simulateChainReaction = (
  grid: GridCell[][],
  startRow: number,
  startCol: number,
  player: PLAYER
): number => {
  // Create a copy of the grid for simulation
  const tempGrid = JSON.parse(JSON.stringify(grid)) as GridCell[][];
  
  // Fill the target cell to critical mass
  const criticalMass = calculateCriticalMassForAI(tempGrid, startRow, startCol);
  tempGrid[startRow][startCol].atoms = criticalMass;
  tempGrid[startRow][startCol].player = player;
  
  // Count affected cells
  let cellsInChain = 0;
  const explodedCells = new Set<string>();
  
  // Simulate explosions
  const explodeCellRecursive = (row: number, col: number): void => {
    const cellKey = `${row},${col}`;
    if (explodedCells.has(cellKey)) return;
    
    const cell = tempGrid[row][col];
    const critical = calculateCriticalMassForAI(tempGrid, row, col);
    
    if (cell.atoms >= critical) {
      explodedCells.add(cellKey);
      cellsInChain++;
      
      // Distribute atoms to adjacent cells
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      
      // Remove atoms from current cell
      tempGrid[row][col].atoms = 0;
      tempGrid[row][col].player = null;
      
      // Add atoms to adjacent cells
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (newRow >= 0 && newRow < tempGrid.length && 
            newCol >= 0 && newCol < tempGrid[0].length) {
          tempGrid[newRow][newCol].atoms += 1;
          tempGrid[newRow][newCol].player = player;
          
          // Recursively check if this new cell will explode
          if (tempGrid[newRow][newCol].atoms >= calculateCriticalMassForAI(tempGrid, newRow, newCol)) {
            explodeCellRecursive(newRow, newCol);
          }
        }
      }
    }
  };
  
  // Start the chain reaction at the initial cell
  explodeCellRecursive(startRow, startCol);
  
  return cellsInChain;
};

/**
 * Identify opponent cells that are close to explosion
 */
const findOpponentVulnerableCells = (
  grid: GridCell[][],
  currentPlayer: PLAYER
): { row: number, col: number, priority: number }[] => {
  const vulnerableCells = [];
  
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      const cell = grid[row][col];
      
      // If cell belongs to an opponent and has atoms
      if (cell.player !== null && cell.player !== currentPlayer && cell.atoms > 0) {
        const criticalMass = calculateCriticalMassForAI(grid, row, col);
        const remainingAtomsUntilCritical = criticalMass - cell.atoms;
        
        // Check if it's close to explosion (1 or 2 atoms away)
        if (remainingAtomsUntilCritical <= 2) {
          // Higher priority for cells that are closer to explosion
          const priority = remainingAtomsUntilCritical === 1 ? 3 : 1;
          vulnerableCells.push({ row, col, priority });
        }
      }
    }
  }
  
  return vulnerableCells;
};

/**
 * Evaluate a cell's score for AI decision making
 * Enhanced for Hard difficulty
 */
const evaluateMove = (
  grid: GridCell[][],
  row: number,
  col: number,
  currentPlayer: PLAYER,
  isBaseMode: boolean,
  hqs?: HQCell[],
  difficulty: AI_DIFFICULTY = AI_DIFFICULTY.MEDIUM
): number => {
  const cell = grid[row][col];
  const criticalMass = calculateCriticalMassForAI(grid, row, col);
  let score = 0;
  
  // Base score calculation for all difficulties
  if (cell.player === currentPlayer) {
    // Adding to own cell
    score += 10;
    
    // If cell is near critical mass, prioritize it
    if (cell.atoms === criticalMass - 1) {
      score += 50; // About to explode
    } else if (cell.atoms === criticalMass - 2) {
      score += 20; // Getting close to explosion
    }
  } else if (cell.player === null) {
    // Empty cell
    score += 5;
  }
  
  // Add randomness based on difficulty
  switch (difficulty) {
    case AI_DIFFICULTY.EASY:
      // More random moves
      score += Math.floor(Math.random() * 40);
      break;
    case AI_DIFFICULTY.MEDIUM:
      // Some randomness but more strategic
      score += Math.floor(Math.random() * 20);
      break;
    case AI_DIFFICULTY.HARD:
      // Very little randomness for hard AI
      score += Math.floor(Math.random() * 3);
      break;
  }
  
  // Enhanced evaluation for HARD difficulty
  if (difficulty === AI_DIFFICULTY.HARD) {
    // Simulate chain reaction and value moves that create bigger chains
    const chainSize = simulateChainReaction(grid, row, col, currentPlayer);
    score += chainSize * 25; // Increased importance of chain reactions
    
    // Strategic positioning - corners and edges are more valuable in early game
    const isCorner = (row === 0 || row === grid.length - 1) && (col === 0 || col === grid[0].length - 1);
    const isEdge = row === 0 || row === grid.length - 1 || col === 0 || col === grid[0].length - 1;
    
    const playerCellCount = countPlayerCells(grid, currentPlayer);
    const isEarlyGame = playerCellCount < 6;
    const isMidGame = playerCellCount >= 6 && playerCellCount < 12;
    
    // More strategic early game positioning
    if (isEarlyGame) {
      if (isCorner) score += 80; // Increased corner preference
      else if (isEdge) score += 40; // Increased edge preference
    } else if (isMidGame) {
      // In mid-game, still prefer corners but less strongly
      if (isCorner) score += 30;
    }
    
    // Find opponent cells that are about to explode and prioritize capturing them
    const vulnerableCells = findOpponentVulnerableCells(grid, currentPlayer);
    for (const vulnerableCell of vulnerableCells) {
      // If this move is adjacent to a vulnerable cell, it's a high priority target
      if (isAdjacentTo(row, col, vulnerableCell.row, vulnerableCell.col)) {
        score += 55 * vulnerableCell.priority; // Increased opportunistic capture
      }
    }
    
    // Defensive play - avoid placing next to opponent's cells that are about to explode
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[r][c].player !== null && 
            grid[r][c].player !== currentPlayer && 
            grid[r][c].atoms === calculateCriticalMassForAI(grid, r, c) - 1 &&
            isAdjacentTo(row, col, r, c)) {
          // This is a dangerous move - highly penalize it
          score -= 80; // Increased penalty for dangerous moves
        }
      }
    }
    
    // Advanced strategies for Hard AI
    
    // 1. Look for cells that will trigger multi-cell chain reactions
    if (chainSize >= 3) {
      score += 30 * (chainSize - 2); // Additional bonus for large chains
    }
    
    // 2. Avoid moves that would make it easy for opponents to capture
    // Check if this move would put us in a position where an opponent can easily capture
    let dangerScore = 0;
    
    // Count adjacent cells owned by opponents
    let adjacentOpponentCells = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(grid.length - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(grid[0].length - 1, col + 1); c++) {
        if ((r !== row || c !== col) && // not the same cell
            grid[r][c].player !== null &&
            grid[r][c].player !== currentPlayer) {
          adjacentOpponentCells++;
          
          // Extra penalty if opponent cell is close to critical mass
          const opponentCriticalMass = calculateCriticalMassForAI(grid, r, c);
          if (grid[r][c].atoms >= opponentCriticalMass - 2) {
            dangerScore -= 25;
          }
        }
      }
    }
    
    if (adjacentOpponentCells >= 2) {
      dangerScore -= 15 * adjacentOpponentCells;
    }
    
    // 3. Think one step ahead - simulate if this move would lead to losing dots on opponent's turn
    // Create a copy of the grid to simulate the move
    const simulatedGrid = JSON.parse(JSON.stringify(grid)) as GridCell[][];
    
    // Apply the move
    if (simulatedGrid[row][col].player === currentPlayer) {
      simulatedGrid[row][col].atoms += 1;
    } else {
      simulatedGrid[row][col].player = currentPlayer;
      simulatedGrid[row][col].atoms = 1;
    }
    
    // Check if this move would make us vulnerable to chain reactions on opponent's turn
    // Find all opponent possible moves that would capture our cells
    let maxLossRisk = 0;
    
    // Find all opponent players
    const opponentPlayers = Object.values(PLAYER).filter(player => player !== currentPlayer);
    
    for (let oppRow = 0; oppRow < grid.length; oppRow++) {
      for (let oppCol = 0; oppCol < grid[0].length; oppCol++) {
        // For each opponent cell that could make a move
        for (const opponent of opponentPlayers) {
          // Check if this would be a valid move for the opponent
          if (isValidMoveForAI(simulatedGrid, oppRow, oppCol, opponent, isBaseMode, hqs)) {
            // Simulate the opponent's move
            const opponentSimGrid = JSON.parse(JSON.stringify(simulatedGrid)) as GridCell[][];
            
            if (opponentSimGrid[oppRow][oppCol].player === opponent) {
              opponentSimGrid[oppRow][oppCol].atoms += 1;
            } else {
              opponentSimGrid[oppRow][oppCol].player = opponent;
              opponentSimGrid[oppRow][oppCol].atoms = 1;
            }
            
            // Count how many of our cells would be captured
            let capturedCells = 0;
            for (let r = 0; r < grid.length; r++) {
              for (let c = 0; c < grid[0].length; c++) {
                if (simulatedGrid[r][c].player === currentPlayer && 
                    (opponentSimGrid[r][c].player !== currentPlayer || opponentSimGrid[r][c].atoms === 0)) {
                  capturedCells++;
                }
              }
            }
            
            // Update max risk
            maxLossRisk = Math.max(maxLossRisk, capturedCells);
          }
        }
      }
    }
    
    // Heavily penalize moves that could lead to significant losses on the next turn
    if (maxLossRisk > 0) {
      dangerScore -= maxLossRisk * 40;
    }
    
    score += dangerScore;
    
    // 3. Prioritize moves that control more territory
    // Higher score for moves that would give us control of more cells
    if (chainSize > 0) {
      const cellsControlledBefore = countPlayerCells(grid, currentPlayer);
      
      // Create a copy of the grid to simulate the move
      const simulatedGrid = JSON.parse(JSON.stringify(grid));
      simulatedGrid[row][col].player = currentPlayer;
      simulatedGrid[row][col].atoms++;
      
      // If this would cause an explosion, don't double-count it since chainSize already covers this
      const cellsControlledAfter = countPlayerCells(simulatedGrid, currentPlayer);
      const cellsGained = cellsControlledAfter - cellsControlledBefore;
      
      if (cellsGained > 0) {
        score += cellsGained * 20;
      }
    }
  }
  
  // Base mode specific scoring
  if (isBaseMode && hqs) {
    // Find opponent HQs
    const opponentHQs = hqs.filter(hq => hq.player !== currentPlayer && hq.health > 0);
    
    // Calculate distance to enemy HQs - prioritize moves closer to enemies
    for (const enemyHQ of opponentHQs) {
      const distance = Math.abs(row - enemyHQ.row) + Math.abs(col - enemyHQ.col);
      
      if (difficulty === AI_DIFFICULTY.HARD) {
        // Hard AI aggressively targets enemy HQs
        score += Math.max(0, 45 - distance * 4); // Increased aggression
        
        // Extra bonus for cells that can attack enemy HQ directly
        if (distance === 1) {
          score += 80; // Much higher bonus for direct attack positions
        } else if (distance === 2) {
          score += 40; // Also bonus for cells that are 2 away (could reach HQ with chain)
        }
        
        // Consider enemy HQ health in targeting
        if (enemyHQ.health <= 2) {
          // Aggressive targeting of nearly defeated enemies
          score += (3 - enemyHQ.health) * 40;
        }
        
        // Check if this move could create a chain reaction toward enemy HQ
        const potentialPath = hasPathToHQ(grid, row, col, enemyHQ.row, enemyHQ.col);
        if (potentialPath) {
          score += 60;
        }
      } else if (difficulty === AI_DIFFICULTY.MEDIUM) {
        // Medium AI considers attacking but less aggressively
        score += Math.max(0, 15 - distance);
      }
    }
    
    // Find player's HQ
    const playerHQ = hqs.find(hq => hq.player === currentPlayer);
    
    if (playerHQ) {
      // Calculate distance to own HQ
      const distanceToOwnHQ = Math.abs(row - playerHQ.row) + Math.abs(col - playerHQ.col);
      
      if (difficulty === AI_DIFFICULTY.HARD) {
        if (playerHQ.health <= 2) {
          // Hard AI prioritizes defense when HQ is low
          score += Math.max(0, 70 - distanceToOwnHQ * 5); // Stronger defense when low health
        } else if (playerHQ.health === 3) {
          // Still defensive when health is moderate
          score += Math.max(0, 40 - distanceToOwnHQ * 3);
        } else {
          // Some basic defense even when health is good
          score += Math.max(0, 20 - distanceToOwnHQ * 2);
        }
        
        // Strategic balance between offense and defense based on HQ health
        const lowestEnemyHealth = Math.min(...opponentHQs.map(hq => hq.health));
        
        // If any enemy HQ is close to defeat and our HQ has decent health, prioritize offense
        if (lowestEnemyHealth <= 2 && playerHQ.health >= 3) {
          score -= Math.max(0, 30 - distanceToOwnHQ * 3); // Reduce defensive score to favor offense
        }
        
        // If our HQ is in better shape than any enemy, be more aggressive
        if (playerHQ.health > lowestEnemyHealth) {
          const healthDifference = playerHQ.health - lowestEnemyHealth;
          score -= Math.max(0, 15 * healthDifference - distanceToOwnHQ * 3);
        }
      } else if (difficulty === AI_DIFFICULTY.MEDIUM && playerHQ.health < 3) {
        // Medium AI considers defense but less strongly
        score += Math.max(0, 15 - distanceToOwnHQ * 2);
      }
    }
  }
  
  // Helper function to check if there's a potential path for chain reaction
  function hasPathToHQ(grid: GridCell[][], startRow: number, startCol: number, 
                       targetRow: number, targetCol: number): boolean {
    // Check if there's a potential path of filled or nearly filled cells toward the HQ
    // This is a simple heuristic, not a complete pathing algorithm
    const direction = {
      row: Math.sign(targetRow - startRow),
      col: Math.sign(targetCol - startCol)
    };
    
    let currentRow = startRow;
    let currentCol = startCol;
    let pathFound = false;
    let steps = 0;
    const maxSteps = 3; // Limit path search to a reasonable length
    
    while (steps < maxSteps && !pathFound) {
      currentRow += direction.row;
      currentCol += direction.col;
      
      // Check if we've reached target area
      if (Math.abs(currentRow - targetRow) <= 1 && Math.abs(currentCol - targetCol) <= 1) {
        pathFound = true;
        break;
      }
      
      // Check if we're still on the grid
      if (currentRow < 0 || currentRow >= grid.length || 
          currentCol < 0 || currentCol >= grid[0].length) {
        break;
      }
      
      // Check if this cell has atoms (owned by anyone)
      const cell = grid[currentRow][currentCol];
      if (cell.atoms === 0) {
        break; // Path broken by empty cell
      }
      
      steps++;
    }
    
    return pathFound;
  }
  
  return score;
};

/**
 * AI makes a decision for the best move
 */
export const getAIMove = (
  grid: GridCell[][],
  currentPlayer: PLAYER,
  isBaseMode: boolean = false,
  hqs?: HQCell[],
  difficulty: AI_DIFFICULTY = AI_DIFFICULTY.MEDIUM
): AIMove | null => {
  const validMoves: AIMove[] = [];
  
  // Find all valid moves
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (isValidMoveForAI(grid, row, col, currentPlayer, isBaseMode, hqs)) {
        const score = evaluateMove(grid, row, col, currentPlayer, isBaseMode, hqs, difficulty);
        validMoves.push({ row, col, score });
      }
    }
  }
  
  if (validMoves.length === 0) {
    return null;
  }
  
  // Sort moves by score (highest first)
  validMoves.sort((a, b) => b.score - a.score);
  
  let selectedMove: AIMove;
  
  // Different selection strategies based on difficulty
  switch (difficulty) {
    case AI_DIFFICULTY.EASY:
      // Random selection from top 50% of moves
      const easyIndex = Math.floor(Math.random() * Math.max(1, Math.floor(validMoves.length / 2)));
      selectedMove = validMoves[easyIndex];
      break;
      
    case AI_DIFFICULTY.MEDIUM:
      // Random selection from top 25% of moves
      const mediumIndex = Math.floor(Math.random() * Math.max(1, Math.floor(validMoves.length / 4)));
      selectedMove = validMoves[mediumIndex];
      break;
      
    case AI_DIFFICULTY.HARD:
    default:
      // Hard AI uses advanced strategies based on the game situation
      // Calculate the average score of all available moves
      const avgScore = validMoves.reduce((sum, move) => sum + move.score, 0) / validMoves.length;
      
      // If there's a standout move with score significantly higher than average, always take it
      if (validMoves.length > 1 && validMoves[0].score > avgScore * 2) {
        selectedMove = validMoves[0]; // Take the clear best move
      }
      // If there's a move with score significantly higher than the next best, take it
      else if (validMoves.length > 1 && validMoves[0].score > validMoves[1].score * 1.8) {
        selectedMove = validMoves[0]; // Take the clearly better move
      } 
      // Occasionally choose from top 2 moves to add minimal unpredictability (only 5% of the time)
      else if (validMoves.length >= 2 && Math.random() < 0.05) {
        const topIndex = Math.floor(Math.random() * 2);
        selectedMove = validMoves[topIndex];
      }
      // Almost always select the best move (95% of the time)
      else {
        selectedMove = validMoves[0];
      }
      break;
  }
  
  return selectedMove;
};