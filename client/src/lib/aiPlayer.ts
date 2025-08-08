import { PLAYER } from './constants';
import { GridCell, HQCell } from './stores/useChainReaction';
import { calculateCriticalMass, isAdjacentTo } from './gameUtils';

export enum AI_STRATEGY {
  WEIGHTS_BASED = 'weights',
  MINIMAX = 'minimax'
}

interface AIMove {
  row: number;
  col: number;
  score: number;
}

interface GameState {
  grid: GridCell[][];
  currentPlayer: PLAYER;
  isBaseMode: boolean;
  hqs?: HQCell[];
}

interface MoveEvaluation {
  move: AIMove;
  immediate: number;
  tactical: number;
  strategic: number;
  risk: number;
  chainReaction: number;
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
 * Deep copy of grid for simulations
 */
const cloneGrid = (grid: GridCell[][]): GridCell[][] => {
  return grid.map(row => row.map(cell => ({ ...cell })));
};

/**
 * Count cells controlled by a player
 */
const countPlayerCells = (grid: GridCell[][], player: PLAYER): number => {
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
 * Count total atoms controlled by a player
 */
const countPlayerAtoms = (grid: GridCell[][], player: PLAYER): number => {
  let count = 0;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col].player === player) {
        count += grid[row][col].atoms;
      }
    }
  }
  return count;
};

/**
 * Simulate placing a dot and return the resulting grid state
 */
const simulateMove = (
  grid: GridCell[][],
  row: number,
  col: number,
  player: PLAYER
): { grid: GridCell[][], explosions: number, capturedCells: number } => {
  const simGrid = cloneGrid(grid);
  let explosions = 0;
  let capturedCells = 0;
  
  // Apply the move
  if (simGrid[row][col].player === player) {
    simGrid[row][col].atoms += 1;
  } else {
    if (simGrid[row][col].player !== null) capturedCells++;
    simGrid[row][col].player = player;
    simGrid[row][col].atoms = 1;
  }
  
  // Process chain reactions
  const processExplosions = () => {
    let hasExplosion = false;
    
    for (let r = 0; r < simGrid.length; r++) {
      for (let c = 0; c < simGrid[0].length; c++) {
        const cell = simGrid[r][c];
        const criticalMass = calculateCriticalMassForAI(simGrid, r, c);
        
        if (cell.atoms >= criticalMass) {
          hasExplosion = true;
          explosions++;
          
          // Remove atoms from exploding cell
          simGrid[r][c].atoms = 0;
          simGrid[r][c].player = null;
          
          // Distribute to adjacent cells
          const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          for (const [dr, dc] of directions) {
            const newRow = r + dr;
            const newCol = c + dc;
            
            if (newRow >= 0 && newRow < simGrid.length && 
                newCol >= 0 && newCol < simGrid[0].length) {
              if (simGrid[newRow][newCol].player !== player && simGrid[newRow][newCol].player !== null) {
                capturedCells++;
              }
              simGrid[newRow][newCol].atoms += 1;
              simGrid[newRow][newCol].player = player;
            }
          }
        }
      }
    }
    
    return hasExplosion;
  };
  
  // Keep processing until no more explosions
  while (processExplosions()) {
    // Continue processing
  }
  
  return { grid: simGrid, explosions, capturedCells };
};

/**
 * WEIGHTS-BASED AI SYSTEM
 * Uses sophisticated weighted scoring with domain-specific heuristics
 */
class WeightsBasedAI {
  private readonly WEIGHTS = {
    // Immediate tactical benefits
    CAPTURE_CELL: 15,
    BUILD_ON_OWN: 8,
    EMPTY_CELL: 3,
    
    // Chain reaction values
    CHAIN_MULTIPLIER: 25,
    EXPLOSION_BONUS: 40,
    BIG_CHAIN_BONUS: 60, // For chains of 4+ cells
    
    // Positional strategy
    CORNER_EARLY: 35,
    EDGE_EARLY: 20,
    CENTER_MID: 15,
    
    // Critical mass strategy
    NEAR_CRITICAL: 50,
    ONE_FROM_CRITICAL: 80,
    
    // Defensive considerations
    DEFEND_CRITICAL: 45,
    AVOID_DANGER: -60,
    BLOCK_OPPONENT: 30,
    
    // Base mode specific
    HQ_ATTACK: 70,
    HQ_DEFENSE: 55,
    PATH_TO_HQ: 25,
    
    // Risk assessment
    VULNERABILITY_PENALTY: -40,
    ISOLATION_PENALTY: -20,
    OVEREXTENSION_PENALTY: -35
  };

  evaluateMove(
    grid: GridCell[][],
    row: number,
    col: number,
    currentPlayer: PLAYER,
    isBaseMode: boolean,
    hqs?: HQCell[]
  ): MoveEvaluation {
    const cell = grid[row][col];
    let immediate = 0;
    let tactical = 0;
    let strategic = 0;
    let risk = 0;
    let chainReaction = 0;

    // Immediate scoring
    if (cell.player === currentPlayer) {
      immediate += this.WEIGHTS.BUILD_ON_OWN;
      
      const criticalMass = calculateCriticalMassForAI(grid, row, col);
      if (cell.atoms === criticalMass - 1) {
        immediate += this.WEIGHTS.ONE_FROM_CRITICAL;
      } else if (cell.atoms === criticalMass - 2) {
        immediate += this.WEIGHTS.NEAR_CRITICAL;
      }
    } else if (cell.player === null) {
      immediate += this.WEIGHTS.EMPTY_CELL;
    } else {
      immediate += this.WEIGHTS.CAPTURE_CELL;
    }

    // Simulate the move for chain reaction analysis
    const simulation = simulateMove(grid, row, col, currentPlayer);
    chainReaction = simulation.explosions * this.WEIGHTS.EXPLOSION_BONUS;
    
    if (simulation.explosions >= 2) {
      chainReaction += this.WEIGHTS.CHAIN_MULTIPLIER * simulation.explosions;
    }
    if (simulation.explosions >= 4) {
      chainReaction += this.WEIGHTS.BIG_CHAIN_BONUS;
    }

    immediate += simulation.capturedCells * this.WEIGHTS.CAPTURE_CELL;

    // Strategic positioning
    const isCorner = (row === 0 || row === grid.length - 1) && (col === 0 || col === grid[0].length - 1);
    const isEdge = row === 0 || row === grid.length - 1 || col === 0 || col === grid[0].length - 1;
    const isCenter = Math.abs(row - grid.length / 2) <= 1 && Math.abs(col - grid[0].length / 2) <= 1;
    
    const playerCells = countPlayerCells(grid, currentPlayer);
    const gamePhase = this.getGamePhase(grid, playerCells);
    
    if (gamePhase === 'early') {
      if (isCorner) strategic += this.WEIGHTS.CORNER_EARLY;
      else if (isEdge) strategic += this.WEIGHTS.EDGE_EARLY;
    } else if (gamePhase === 'mid' && isCenter) {
      strategic += this.WEIGHTS.CENTER_MID;
    }

    // Tactical analysis
    tactical += this.evaluateTacticalPosition(grid, row, col, currentPlayer);
    
    // Risk assessment
    risk += this.evaluateRisk(grid, row, col, currentPlayer, isBaseMode, hqs);

    // Base mode specific evaluation
    if (isBaseMode && hqs) {
      const baseScore = this.evaluateBaseMode(grid, row, col, currentPlayer, hqs);
      strategic += baseScore;
    }

    return {
      move: { row, col, score: immediate + tactical + strategic + risk + chainReaction },
      immediate,
      tactical,
      strategic,
      risk,
      chainReaction
    };
  }

  private getGamePhase(grid: GridCell[][], playerCells: number): 'early' | 'mid' | 'late' {
    const totalCells = grid.length * grid[0].length;
    const cellRatio = playerCells / totalCells;
    
    if (cellRatio < 0.15) return 'early';
    if (cellRatio < 0.4) return 'mid';
    return 'late';
  }

  private evaluateTacticalPosition(
    grid: GridCell[][],
    row: number,
    col: number,
    currentPlayer: PLAYER
  ): number {
    let score = 0;
    
    // Count adjacent cells by type
    let ownAdjacent = 0;
    let opponentAdjacent = 0;
    let opponentNearCritical = 0;
    
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < grid.length && newCol >= 0 && newCol < grid[0].length) {
        const adjCell = grid[newRow][newCol];
        
        if (adjCell.player === currentPlayer) {
          ownAdjacent++;
        } else if (adjCell.player !== null) {
          opponentAdjacent++;
          
          const criticalMass = calculateCriticalMassForAI(grid, newRow, newCol);
          if (adjCell.atoms >= criticalMass - 1) {
            opponentNearCritical++;
          }
        }
      }
    }
    
    // Bonus for connecting with own cells
    score += ownAdjacent * 10;
    
    // Penalty for being surrounded by opponents
    if (opponentAdjacent >= 3) {
      score += this.WEIGHTS.VULNERABILITY_PENALTY;
    }
    
    // Defense against opponent critical cells
    score += opponentNearCritical * this.WEIGHTS.DEFEND_CRITICAL;
    
    return score;
  }

  private evaluateRisk(
    grid: GridCell[][],
    row: number,
    col: number,
    currentPlayer: PLAYER,
    isBaseMode: boolean,
    hqs?: HQCell[]
  ): number {
    let riskScore = 0;
    
    // Simulate opponent responses
    const opponents = Object.values(PLAYER).filter(p => p !== currentPlayer);
    
    for (const opponent of opponents) {
      const opponentMoves = this.findValidMoves(grid, opponent, isBaseMode, hqs);
      
      for (const move of opponentMoves) {
        const opponentSim = simulateMove(grid, move.row, move.col, opponent);
        
        // Check how many of our cells would be captured
        const ourCellsBefore = countPlayerCells(grid, currentPlayer);
        const ourCellsAfter = countPlayerCells(opponentSim.grid, currentPlayer);
        const cellsLost = ourCellsBefore - ourCellsAfter;
        
        if (cellsLost > 0) {
          riskScore += cellsLost * this.WEIGHTS.VULNERABILITY_PENALTY;
        }
      }
    }
    
    return riskScore;
  }

  private evaluateBaseMode(
    grid: GridCell[][],
    row: number,
    col: number,
    currentPlayer: PLAYER,
    hqs: HQCell[]
  ): number {
    let score = 0;
    
    const playerHQ = hqs.find(hq => hq.player === currentPlayer);
    const enemyHQs = hqs.filter(hq => hq.player !== currentPlayer && hq.health > 0);
    
    // Attack evaluation
    for (const enemyHQ of enemyHQs) {
      const distance = Math.abs(row - enemyHQ.row) + Math.abs(col - enemyHQ.col);
      
      if (distance === 1) {
        score += this.WEIGHTS.HQ_ATTACK * (5 - enemyHQ.health);
      } else if (distance <= 3) {
        score += this.WEIGHTS.PATH_TO_HQ * (4 - distance) * (5 - enemyHQ.health);
      }
    }
    
    // Defense evaluation
    if (playerHQ && playerHQ.health <= 3) {
      const distanceToOwnHQ = Math.abs(row - playerHQ.row) + Math.abs(col - playerHQ.col);
      if (distanceToOwnHQ <= 2) {
        score += this.WEIGHTS.HQ_DEFENSE * (4 - playerHQ.health) * (3 - distanceToOwnHQ);
      }
    }
    
    return score;
  }

  private findValidMoves(
    grid: GridCell[][],
    player: PLAYER,
    isBaseMode: boolean,
    hqs?: HQCell[]
  ): AIMove[] {
    const moves: AIMove[] = [];
    
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        if (isValidMoveForAI(grid, row, col, player, isBaseMode, hqs)) {
          moves.push({ row, col, score: 0 });
        }
      }
    }
    
    return moves;
  }
}

/**
 * MINIMAX-STYLE AI SYSTEM
 * Uses game tree search with alpha-beta pruning and advanced evaluation
 */
class MinimaxAI {
  private readonly MAX_DEPTH = 4;
  private readonly EVAL_WEIGHTS = {
    MATERIAL: 100,
    POSITION: 50,
    MOBILITY: 30,
    SAFETY: 80,
    TEMPO: 25
  };

  evaluateMove(
    grid: GridCell[][],
    row: number,
    col: number,
    currentPlayer: PLAYER,
    isBaseMode: boolean,
    hqs?: HQCell[]
  ): MoveEvaluation {
    const gameState: GameState = { grid, currentPlayer, isBaseMode, hqs };
    
    // Use minimax with alpha-beta pruning
    const score = this.minimax(
      gameState,
      { row, col, score: 0 },
      this.MAX_DEPTH,
      -Infinity,
      Infinity,
      true
    );

    return {
      move: { row, col, score },
      immediate: score,
      tactical: 0,
      strategic: 0,
      risk: 0,
      chainReaction: 0
    };
  }

  private minimax(
    state: GameState,
    move: AIMove,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number {
    if (depth === 0) {
      return this.evaluatePosition(state);
    }

    // Apply the move to get new state
    const newGrid = this.applyMove(state.grid, move.row, move.col, state.currentPlayer);
    const newState: GameState = {
      ...state,
      grid: newGrid,
      currentPlayer: this.getNextPlayer(state.currentPlayer, state.grid)
    };

    if (isMaximizing) {
      let maxEval = -Infinity;
      const moves = this.generateMoves(newState);
      
      for (const candidateMove of moves) {
        const eval_score = this.minimax(newState, candidateMove, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, eval_score);
        alpha = Math.max(alpha, eval_score);
        
        if (beta <= alpha) {
          break; // Alpha-beta pruning
        }
      }
      
      return maxEval;
    } else {
      let minEval = Infinity;
      const moves = this.generateMoves(newState);
      
      for (const candidateMove of moves) {
        const eval_score = this.minimax(newState, candidateMove, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, eval_score);
        beta = Math.min(beta, eval_score);
        
        if (beta <= alpha) {
          break; // Alpha-beta pruning
        }
      }
      
      return minEval;
    }
  }

  private evaluatePosition(state: GameState): number {
    let score = 0;
    
    // Material evaluation
    score += this.evaluateMaterial(state.grid, state.currentPlayer) * this.EVAL_WEIGHTS.MATERIAL;
    
    // Positional evaluation
    score += this.evaluatePosition_internal(state.grid, state.currentPlayer) * this.EVAL_WEIGHTS.POSITION;
    
    // Mobility evaluation
    score += this.evaluateMobility(state) * this.EVAL_WEIGHTS.MOBILITY;
    
    // Safety evaluation
    score += this.evaluateSafety(state.grid, state.currentPlayer) * this.EVAL_WEIGHTS.SAFETY;
    
    // Tempo evaluation
    score += this.evaluateTempo(state.grid, state.currentPlayer) * this.EVAL_WEIGHTS.TEMPO;
    
    return score;
  }

  private evaluateMaterial(grid: GridCell[][], player: PLAYER): number {
    const playerCells = countPlayerCells(grid, player);
    const playerAtoms = countPlayerAtoms(grid, player);
    
    let opponentCells = 0;
    let opponentAtoms = 0;
    
    for (const opponent of Object.values(PLAYER)) {
      if (opponent !== player) {
        opponentCells += countPlayerCells(grid, opponent);
        opponentAtoms += countPlayerAtoms(grid, opponent);
      }
    }
    
    return (playerCells - opponentCells) + (playerAtoms - opponentAtoms) * 0.1;
  }

  private evaluatePosition_internal(grid: GridCell[][], player: PLAYER): number {
    let positionScore = 0;
    
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        if (grid[row][col].player === player) {
          // Corner and edge bonuses
          const isCorner = (row === 0 || row === grid.length - 1) && (col === 0 || col === grid[0].length - 1);
          const isEdge = row === 0 || row === grid.length - 1 || col === 0 || col === grid[0].length - 1;
          
          if (isCorner) positionScore += 3;
          else if (isEdge) positionScore += 2;
          
          // Central control bonus
          const centerDistance = Math.abs(row - grid.length / 2) + Math.abs(col - grid[0].length / 2);
          positionScore += Math.max(0, 5 - centerDistance);
        }
      }
    }
    
    return positionScore;
  }

  private evaluateMobility(state: GameState): number {
    const playerMoves = this.generateMoves(state).length;
    
    let opponentMoves = 0;
    for (const opponent of Object.values(PLAYER)) {
      if (opponent !== state.currentPlayer) {
        const opponentState = { ...state, currentPlayer: opponent };
        opponentMoves += this.generateMoves(opponentState).length;
      }
    }
    
    return playerMoves - opponentMoves * 0.5;
  }

  private evaluateSafety(grid: GridCell[][], player: PLAYER): number {
    let safetyScore = 0;
    
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        if (grid[row][col].player === player) {
          const criticalMass = calculateCriticalMassForAI(grid, row, col);
          const currentAtoms = grid[row][col].atoms;
          
          // Cells near critical mass are risky
          if (currentAtoms >= criticalMass - 1) {
            safetyScore -= 2;
          }
          
          // Check for threats from adjacent opponent cells
          const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < grid.length && 
                newCol >= 0 && newCol < grid[0].length) {
              const adjCell = grid[newRow][newCol];
              
              if (adjCell.player !== null && adjCell.player !== player) {
                const adjCritical = calculateCriticalMassForAI(grid, newRow, newCol);
                if (adjCell.atoms >= adjCritical - 1) {
                  safetyScore -= 3; // Immediate threat
                }
              }
            }
          }
        }
      }
    }
    
    return safetyScore;
  }

  private evaluateTempo(grid: GridCell[][], player: PLAYER): number {
    let tempoScore = 0;
    
    // Count cells that are one move away from explosion
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        if (grid[row][col].player === player) {
          const criticalMass = calculateCriticalMassForAI(grid, row, col);
          if (grid[row][col].atoms === criticalMass - 1) {
            tempoScore += 2; // Ready to explode next turn
          }
        }
      }
    }
    
    return tempoScore;
  }

  private applyMove(grid: GridCell[][], row: number, col: number, player: PLAYER): GridCell[][] {
    const result = simulateMove(grid, row, col, player);
    return result.grid;
  }

  private generateMoves(state: GameState): AIMove[] {
    const moves: AIMove[] = [];
    
    for (let row = 0; row < state.grid.length; row++) {
      for (let col = 0; col < state.grid[0].length; col++) {
        if (isValidMoveForAI(state.grid, row, col, state.currentPlayer, state.isBaseMode, state.hqs)) {
          moves.push({ row, col, score: 0 });
        }
      }
    }
    
    return moves;
  }

  private getNextPlayer(currentPlayer: PLAYER, grid: GridCell[][]): PLAYER {
    const players = Object.values(PLAYER);
    const activePlayers = players.filter(player => countPlayerCells(grid, player) > 0);
    
    if (activePlayers.length <= 1) return currentPlayer;
    
    const currentIndex = activePlayers.indexOf(currentPlayer);
    return activePlayers[(currentIndex + 1) % activePlayers.length];
  }
}

/**
 * Main AI interface - chooses between strategies
 */
export const getAIMove = (
  grid: GridCell[][],
  currentPlayer: PLAYER,
  isBaseMode: boolean = false,
  hqs?: HQCell[],
  strategy: AI_STRATEGY = AI_STRATEGY.WEIGHTS_BASED
): AIMove | null => {
  console.log(`🧠 AI (${strategy}) thinking for player ${currentPlayer}...`);
  
  const validMoves: AIMove[] = [];
  
  // Find all valid moves
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (isValidMoveForAI(grid, row, col, currentPlayer, isBaseMode, hqs)) {
        validMoves.push({ row, col, score: 0 });
      }
    }
  }
  
  if (validMoves.length === 0) {
    console.log(`❌ No valid moves found for player ${currentPlayer}`);
    return null;
  }
  
  console.log(`🎯 Found ${validMoves.length} valid moves`);
  
  // Choose AI system
  const aiSystem = strategy === AI_STRATEGY.WEIGHTS_BASED 
    ? new WeightsBasedAI() 
    : new MinimaxAI();
  
  // Evaluate all moves
  const evaluatedMoves: MoveEvaluation[] = validMoves.map(move => 
    aiSystem.evaluateMove(grid, move.row, move.col, currentPlayer, isBaseMode, hqs)
  );
  
  // Sort by total score
  evaluatedMoves.sort((a, b) => b.move.score - a.move.score);
  
  const bestMove = evaluatedMoves[0];
  
  console.log(`🎲 Best move: (${bestMove.move.row}, ${bestMove.move.col}) with score ${bestMove.move.score.toFixed(1)}`);
  console.log(`📊 Breakdown - Immediate: ${bestMove.immediate.toFixed(1)}, Tactical: ${bestMove.tactical.toFixed(1)}, Strategic: ${bestMove.strategic.toFixed(1)}, Risk: ${bestMove.risk.toFixed(1)}, Chain: ${bestMove.chainReaction.toFixed(1)}`);
  
  return bestMove.move;
};