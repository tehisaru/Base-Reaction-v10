import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PLAYER, PLAYER_COLORS } from "../../lib/constants";
import { AI_DIFFICULTY } from "../../lib/aiPlayer";
import TutorialScreen from "./TutorialScreen";

// Enum to represent player control type
export enum PLAYER_CONTROL {
  HUMAN = 'human',
  AI = 'ai'
}

// Player settings interface with AI support
export type PlayerConfig = {
  player: PLAYER;
  control: PLAYER_CONTROL;
  aiDifficulty?: AI_DIFFICULTY;
}

// Create a store to save player selection
export type PlayerSelectionSettings = {
  numberOfPlayers: 2 | 3 | 4;
  players: PLAYER[];
  playerConfigs: PlayerConfig[];
};

// Default player assignments by count
export const playerAssignments = {
  2: [PLAYER.RED, PLAYER.BLUE],
  3: [PLAYER.RED, PLAYER.BLUE, PLAYER.VIOLET],
  4: [PLAYER.RED, PLAYER.BLUE, PLAYER.VIOLET, PLAYER.BLACK]
};

// Create default player configurations - all human players for multiplayer
const createDefaultPlayerConfigs = (players: PLAYER[]): PlayerConfig[] => {
  return players.map(player => ({
    player,
    control: PLAYER_CONTROL.HUMAN, // Always human for all players in multiplayer
    aiDifficulty: undefined
  }));
};

// Create a dedicated player settings module
export const PlayerSettingsManager = {
  // Get current settings from localStorage
  getSettings: (): PlayerSelectionSettings => {
    const storedSettings = localStorage.getItem('playerSettings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        
        // Check if playerConfigs exists, if not add it
        if (!parsedSettings.playerConfigs) {
          parsedSettings.playerConfigs = createDefaultPlayerConfigs(parsedSettings.players);
        }
        
        return parsedSettings;
      } catch {
        // If parsing fails, return default
        const defaultPlayers = playerAssignments[2];
        return { 
          numberOfPlayers: 2, 
          players: defaultPlayers,
          playerConfigs: createDefaultPlayerConfigs(defaultPlayers)
        };
      }
    }
    
    // Default settings
    const defaultPlayers = playerAssignments[2];
    return { 
      numberOfPlayers: 2, 
      players: defaultPlayers,
      playerConfigs: createDefaultPlayerConfigs(defaultPlayers)
    };
  },
  
  // Save settings to localStorage
  saveSettings: (settings: PlayerSelectionSettings): void => {
    // Ensure playerConfigs exists
    if (!settings.playerConfigs) {
      settings.playerConfigs = createDefaultPlayerConfigs(settings.players);
    }
    
    localStorage.setItem('playerSettings', JSON.stringify(settings));
  },
  
  // Check if a player is AI-controlled
  isAIPlayer: (player: PLAYER): boolean => {
    const settings = PlayerSettingsManager.getSettings();
    const playerConfig = settings.playerConfigs.find(config => config.player === player);
    return playerConfig?.control === PLAYER_CONTROL.AI;
  },
  
  // Get AI difficulty for a player
  getAIDifficulty: (player: PLAYER): AI_DIFFICULTY => {
    const settings = PlayerSettingsManager.getSettings();
    const playerConfig = settings.playerConfigs.find(config => config.player === player);
    return playerConfig?.aiDifficulty || AI_DIFFICULTY.MEDIUM;
  },
  
  // Update a player's control type
  setPlayerControl: (player: PLAYER, control: PLAYER_CONTROL, aiDifficulty?: AI_DIFFICULTY): void => {
    const settings = PlayerSettingsManager.getSettings();
    
    // Find and update the player config
    const playerConfig = settings.playerConfigs.find(config => config.player === player);
    if (playerConfig) {
      playerConfig.control = control;
      playerConfig.aiDifficulty = control === PLAYER_CONTROL.AI ? 
        (aiDifficulty || AI_DIFFICULTY.MEDIUM) : undefined;
    } else {
      // If player config doesn't exist, create it
      settings.playerConfigs.push({
        player,
        control,
        aiDifficulty: control === PLAYER_CONTROL.AI ? 
          (aiDifficulty || AI_DIFFICULTY.MEDIUM) : undefined
      });
    }
    
    // Save updated settings
    PlayerSettingsManager.saveSettings(settings);
  }
};

// Re-export methods to maintain backward compatibility
export const getPlayerSettings = (): PlayerSelectionSettings => {
  return PlayerSettingsManager.getSettings();
};

export const setPlayerSettings = (settings: PlayerSelectionSettings): void => {
  PlayerSettingsManager.saveSettings(settings);
};

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  
  // Menu state
  const [menuScreen, setMenuScreen] = useState<'main' | 'mode' | 'singleplayer' | 'multiplayer' | 'tutorial' | 'tutorial-content'>('main');
  const [tutorialMode, setTutorialMode] = useState<'classic' | 'base-reaction'>('classic');
  const [selectedMode, setSelectedMode] = useState<'classic' | 'base-reaction'>('classic');
  const [aiDifficulty, setAIDifficulty] = useState<AI_DIFFICULTY>(AI_DIFFICULTY.MEDIUM);
  
  // Initialize number of players from existing settings
  const initialNumPlayers = (): 2 | 3 | 4 => {
    const settings = PlayerSettingsManager.getSettings();
    return settings.numberOfPlayers;
  };
  
  const [numPlayers, setNumPlayers] = useState<2 | 3 | 4>(initialNumPlayers());
  
  // Get initial player configurations
  const initialSettings = PlayerSettingsManager.getSettings();
  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>(
    initialSettings.playerConfigs || createDefaultPlayerConfigs(playerAssignments[numPlayers])
  );
  
  // Update player configurations when number of players changes
  const handleNumPlayersChange = (num: 2 | 3 | 4) => {
    setNumPlayers(num);
    
    // Get the current player colors for the new number of players
    const newPlayerColors = playerAssignments[num];
    
    // Create new player configs - all human players for multiplayer
    const newPlayerConfigs = newPlayerColors.map(player => {
      // All players are human in multiplayer mode
      return {
        player,
        control: PLAYER_CONTROL.HUMAN,
        aiDifficulty: undefined
      };
    });
    
    setPlayerConfigs(newPlayerConfigs);
  };
  
  // Setup singleplayer game (human vs AI)
  const setupSingleplayer = (difficulty: AI_DIFFICULTY) => {
    // Create a config with just 2 players (red human, blue AI)
    const singleplayerConfig = [
      {
        player: PLAYER.RED,
        control: PLAYER_CONTROL.HUMAN,
        aiDifficulty: undefined
      },
      {
        player: PLAYER.BLUE,
        control: PLAYER_CONTROL.AI,
        aiDifficulty: difficulty
      }
    ];
    
    // Force number of players to 2 for singleplayer
    setNumPlayers(2);
    setPlayerConfigs(singleplayerConfig);
    
    // Save and start the game with singleplayer settings
    setPlayerSettings({
      numberOfPlayers: 2,
      players: [PLAYER.RED, PLAYER.BLUE],
      playerConfigs: singleplayerConfig
    });
    
    // Navigate to selected game mode
    navigate(`/${selectedMode}`);
  };
  
  // Toggle player control between human and AI
  const togglePlayerControl = (player: PLAYER) => {
    const updatedConfigs = [...playerConfigs];
    const playerIndex = updatedConfigs.findIndex(config => config.player === player);
    
    if (playerIndex !== -1) {
      const currentControl = updatedConfigs[playerIndex].control;
      
      if (currentControl === PLAYER_CONTROL.HUMAN) {
        updatedConfigs[playerIndex].control = PLAYER_CONTROL.AI;
        updatedConfigs[playerIndex].aiDifficulty = aiDifficulty;
      } else {
        updatedConfigs[playerIndex].control = PLAYER_CONTROL.HUMAN;
        updatedConfigs[playerIndex].aiDifficulty = undefined;
      }
    }
    
    setPlayerConfigs(updatedConfigs);
  };
  
  // Save settings and start the game
  const saveAndStartGame = () => {
    // Save player settings
    setPlayerSettings({
      numberOfPlayers: numPlayers,
      players: playerAssignments[numPlayers],
      playerConfigs: playerConfigs
    });
    
    // Navigate to selected game mode
    navigate(`/${selectedMode}`);
  };
  
  // Button style for consistent UI
  const buttonStyle = {
    base: "py-3 px-6 rounded-xl text-white text-sm transition-all duration-200 border-2 border-white w-full",
    primary: "bg-black hover:bg-gray-800",
    selected: "bg-white text-black hover:bg-gray-200",
    back: "py-3 px-6 rounded-xl text-white text-sm border-2 border-white hover:bg-gray-800 transition-all duration-200 w-full",
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-center text-white" style={{ fontFamily: 'Menlo, monospace' }}>
          Base Reaction
        </h1>
      </motion.div>
      
      {/* Main Menu Screen */}
      {menuScreen === 'main' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-black p-8 max-w-md w-full"
        >
          <div className="grid grid-cols-1 gap-4 w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedMode('classic');
                setMenuScreen('mode');
              }}
              className={`${buttonStyle.base} ${buttonStyle.primary} py-3 w-full text-center`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Classic Mode
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedMode('base-reaction');
                setMenuScreen('mode');
              }}
              className={`${buttonStyle.base} ${buttonStyle.primary} py-3 w-full text-center`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Base Reaction
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMenuScreen('tutorial')}
              className={`${buttonStyle.base} ${buttonStyle.primary} py-3 w-full text-center`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Tutorial
            </motion.button>
          </div>
        </motion.div>
      )}
      
      {/* Game Mode Selection Screen */}
      {menuScreen === 'mode' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-black p-8 max-w-md w-full"
        >
          <h2 className="text-xl font-bold mb-4 text-center" style={{ fontFamily: 'Menlo, monospace' }}>
            {selectedMode === 'classic' ? 'Classic Mode' : 'Base Reaction Mode'}
          </h2>
          
          <div className="grid grid-cols-1 gap-3 mb-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMenuScreen('singleplayer')}
              className={`${buttonStyle.base} ${buttonStyle.primary} py-3`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Singleplayer
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMenuScreen('multiplayer')}
              className={`${buttonStyle.base} ${buttonStyle.primary} py-3`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Multiplayer
            </motion.button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMenuScreen('main')}
            className={`${buttonStyle.back} w-full text-center`}
            style={{ fontFamily: 'Menlo, monospace' }}
          >
            Back
          </motion.button>
        </motion.div>
      )}
      
      {/* Singleplayer Difficulty Selection */}
      {menuScreen === 'singleplayer' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-black p-8 max-w-md w-full"
        >
          <h2 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'Menlo, monospace' }}>
            Select AI Difficulty
          </h2>
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setupSingleplayer(AI_DIFFICULTY.EASY)}
              className={`${buttonStyle.base} ${buttonStyle.primary} py-5`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Easy
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setupSingleplayer(AI_DIFFICULTY.MEDIUM)}
              className={`${buttonStyle.base} ${buttonStyle.primary} py-5`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Medium
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setupSingleplayer(AI_DIFFICULTY.HARD)}
              className={`${buttonStyle.base} ${buttonStyle.primary} py-5`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Hard
            </motion.button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMenuScreen('mode')}
            className={`${buttonStyle.back} w-full text-center`}
            style={{ fontFamily: 'Menlo, monospace' }}
          >
            Back
          </motion.button>
        </motion.div>
      )}
      
      {/* Tutorial Selection Screen */}
      {menuScreen === 'tutorial' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-black p-8 max-w-md w-full"
        >
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: 'Menlo, monospace' }}>
            Select Tutorial
          </h2>
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setTutorialMode('classic');
                setMenuScreen('tutorial-content');
              }}
              className={`${buttonStyle.base} ${buttonStyle.primary} py-5`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Classic Mode
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setTutorialMode('base-reaction');
                setMenuScreen('tutorial-content');
              }}
              className={`${buttonStyle.base} ${buttonStyle.primary} py-5`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Base Reaction Mode
            </motion.button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMenuScreen('main')}
            className={`${buttonStyle.back} w-full text-center`}
            style={{ fontFamily: 'Menlo, monospace' }}
          >
            Back
          </motion.button>
        </motion.div>
      )}
      
      {/* Tutorial Content */}
      {menuScreen === 'tutorial-content' && (
        <div className="w-full max-w-3xl">
          <TutorialScreen mode={tutorialMode} />
          <div className="mt-4 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMenuScreen('tutorial')}
              className="py-3 px-6 bg-black hover:bg-gray-800 rounded-2xl text-white font-semibold transition-all duration-300 border-2 border-white"
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Back to Tutorial Selection
            </motion.button>
          </div>
        </div>
      )}
      
      {/* Multiplayer Setup */}
      {menuScreen === 'multiplayer' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-black p-8 max-w-md w-full"
        >
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: 'Menlo, monospace' }}>
            Multiplayer Setup
          </h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Menlo, monospace' }}>Number of Players</h3>
            <div className="grid grid-cols-3 gap-4">
              {[2, 3, 4].map((num) => (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNumPlayersChange(num as 2 | 3 | 4)}
                  className={`py-4 px-0 rounded-2xl border-2 border-white text-xl ${
                    numPlayers === num 
                      ? buttonStyle.selected
                      : buttonStyle.primary
                  }`}
                  style={{ fontFamily: 'Menlo, monospace' }}
                >
                  {num}
                </motion.button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Menlo, monospace' }}>Players</h3>
            <div className="grid grid-cols-1 gap-4">
              {playerConfigs.map((config) => (
                <div 
                  key={config.player} 
                  className="flex items-center p-4 rounded-xl"
                  style={{ 
                    backgroundColor: PLAYER_COLORS[config.player],
                    opacity: 0.9
                  }}
                >
                  <span className="font-semibold text-xl" style={{ fontFamily: 'Menlo, monospace' }}>
                    {config.player.charAt(0).toUpperCase() + config.player.slice(1)} Player
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveAndStartGame}
              className={`${buttonStyle.base} ${buttonStyle.primary} text-center`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Start Game
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMenuScreen('mode')}
              className={`${buttonStyle.back} text-center`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Back
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MainMenu;
