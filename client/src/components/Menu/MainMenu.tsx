import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PLAYER, PLAYER_COLORS } from "../../lib/constants";
import { AI_STRATEGY } from "../../lib/aiPlayer";
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
  aiStrategy?: AI_STRATEGY;
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
    aiStrategy: undefined
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
  
  // Get AI strategy for a player
  getAIStrategy: (player: PLAYER): AI_STRATEGY => {
    const settings = PlayerSettingsManager.getSettings();
    const playerConfig = settings.playerConfigs.find(config => config.player === player);
    return playerConfig?.aiStrategy || AI_STRATEGY.WEIGHTS_BASED;
  },
  
  // Update a player's control type
  setPlayerControl: (player: PLAYER, control: PLAYER_CONTROL, aiStrategy?: AI_STRATEGY): void => {
    const settings = PlayerSettingsManager.getSettings();
    
    // Find and update the player config
    const playerConfig = settings.playerConfigs.find(config => config.player === player);
    if (playerConfig) {
      playerConfig.control = control;
      playerConfig.aiStrategy = control === PLAYER_CONTROL.AI ? 
        (aiStrategy || AI_STRATEGY.WEIGHTS_BASED) : undefined;
    } else {
      // If player config doesn't exist, create it
      settings.playerConfigs.push({
        player,
        control,
        aiStrategy: control === PLAYER_CONTROL.AI ? 
          (aiStrategy || AI_STRATEGY.WEIGHTS_BASED) : undefined
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
  const [aiStrategy, setAIStrategy] = useState<AI_STRATEGY>(AI_STRATEGY.WEIGHTS_BASED);
  
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
        aiStrategy: undefined
      };
    });
    
    setPlayerConfigs(newPlayerConfigs);
  };
  
  // Setup singleplayer game (human vs AI)
  const setupSingleplayer = (strategy: AI_STRATEGY) => {
    // Create a config with just 2 players (red human, blue AI)
    const singleplayerConfig = [
      {
        player: PLAYER.RED,
        control: PLAYER_CONTROL.HUMAN,
        aiStrategy: undefined
      },
      {
        player: PLAYER.BLUE,
        control: PLAYER_CONTROL.AI,
        aiStrategy: strategy
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
  
  // Toggle player control between human and AI (now enabled in multiplayer mode)
  const togglePlayerControl = (player: PLAYER) => {
    console.log('Toggling player control for:', player);
    
    const updatedConfigs = [...playerConfigs];
    const playerIndex = updatedConfigs.findIndex(config => config.player === player);
    
    if (playerIndex !== -1) {
      const currentControl = updatedConfigs[playerIndex].control;
      
      if (currentControl === PLAYER_CONTROL.HUMAN) {
        updatedConfigs[playerIndex].control = PLAYER_CONTROL.AI;
        updatedConfigs[playerIndex].aiStrategy = aiStrategy;
      } else {
        updatedConfigs[playerIndex].control = PLAYER_CONTROL.HUMAN;
        updatedConfigs[playerIndex].aiStrategy = undefined;
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
  
  // Button style for consistent UI - all buttons same height and quick animations
  const buttonStyle = {
    base: "py-4 px-6 rounded-xl text-white text-base transition-all duration-100 border-2 border-white w-full h-14 flex items-center justify-center",
    primary: "bg-black hover:bg-gray-800",
    selected: "bg-white text-black hover:bg-gray-200",
    back: "py-4 px-6 rounded-xl text-white text-base border-2 border-white hover:bg-gray-800 transition-all duration-100 w-full h-14 flex items-center justify-center",
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 pt-20 md:pt-24">
      {/* Fixed position title - responsive sizing, moved lower */}
      <div className="fixed top-16 md:top-24 left-0 right-0 z-10">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-6xl font-bold text-center text-white mb-4" 
          style={{ fontFamily: 'Menlo, monospace' }}
        >
          Base Reaction
        </motion.h1>
      </div>
      
      {/* Main Menu Screen */}
      {menuScreen === 'main' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-black p-6 md:p-8 w-full max-w-sm md:w-80"
        >
          <div className="grid grid-cols-1 gap-4 w-full">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              onClick={() => {
                setSelectedMode('classic');
                setMenuScreen('multiplayer');
              }}
              className={`${buttonStyle.base} ${buttonStyle.primary}`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Classic Mode
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              onClick={() => {
                setSelectedMode('base-reaction');
                setMenuScreen('multiplayer');
              }}
              className={`${buttonStyle.base} ${buttonStyle.primary}`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Base Reaction
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              onClick={() => setMenuScreen('tutorial')}
              className={`${buttonStyle.base} ${buttonStyle.primary}`}
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
          className="bg-black p-6 md:p-8 w-full max-w-sm md:w-80"
        >
          <h2 className="text-xl font-bold mb-4 text-center" style={{ fontFamily: 'Menlo, monospace' }}>
            {selectedMode === 'classic' ? 'Classic Mode' : 'Base Reaction Mode'}
          </h2>
          
          <div className="grid grid-cols-1 gap-3 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              onClick={() => setMenuScreen('singleplayer')}
              className={`${buttonStyle.base} ${buttonStyle.primary}`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Singleplayer
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              onClick={() => setMenuScreen('multiplayer')}
              className={`${buttonStyle.base} ${buttonStyle.primary}`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Multiplayer
            </motion.button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            onClick={() => setMenuScreen('main')}
            className={`${buttonStyle.back}`}
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
          className="bg-black p-8 w-80"
        >
          <h2 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'Menlo, monospace' }}>
            Select AI Strategy
          </h2>
          <p className="text-sm text-gray-400 mb-4 text-center">
            Choose between two advanced AI systems to challenge yourself
          </p>
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setupSingleplayer(AI_STRATEGY.WEIGHTS_BASED)}
              className={`${buttonStyle.base} ${buttonStyle.primary}`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              <div className="text-left">
                <div className="font-bold">Play vs AI</div>
                <div className="text-xs text-gray-300">Strategic AI opponent</div>
              </div>
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
          className="bg-black p-8 w-80"
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
              className={`${buttonStyle.base} ${buttonStyle.primary}`}
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
              className={`${buttonStyle.base} ${buttonStyle.primary}`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Base Reaction Mode
            </motion.button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            onClick={() => setMenuScreen('main')}
            className={`${buttonStyle.back}`}
            style={{ fontFamily: 'Menlo, monospace' }}
          >
            Back
          </motion.button>
        </motion.div>
      )}
      
      {/* Tutorial Content */}
      {menuScreen === 'tutorial-content' && (
        <div className="w-full max-w-3xl mt-20 md:mt-24"> {/* Add more top margin to avoid overlaying title */}
          <TutorialScreen mode={tutorialMode} onBack={() => setMenuScreen('tutorial')} />
        </div>
      )}
      
      {/* Multiplayer Setup */}
      {menuScreen === 'multiplayer' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-black p-3 md:p-8 w-[90%] sm:w-[80%] max-w-sm md:max-w-md mx-auto"
        >
          <div className="mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3" style={{ fontFamily: 'Menlo, monospace' }}>Number of Players</h3>
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {[2, 3, 4].map((num) => (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  onClick={() => handleNumPlayersChange(num as 2 | 3 | 4)}
                  className={`h-12 md:h-14 px-3 md:px-6 rounded-xl border-2 border-white text-lg md:text-xl transition-all duration-100 flex items-center justify-center ${
                    numPlayers === num 
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-black hover:bg-gray-800 text-white'
                  }`}
                  style={{ fontFamily: 'Menlo, monospace' }}
                >
                  {num}
                </motion.button>
              ))}
            </div>
          </div>
          


          <div className="mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-center" style={{ fontFamily: 'Menlo, monospace' }}>Players</h3>
            <div className="flex justify-center">
              <div className="grid grid-cols-4 gap-3 w-fit">
              {playerConfigs.map((config) => (
                <motion.div 
                  key={config.player} 
                  className={`w-16 h-16 rounded-full cursor-pointer relative ${config.player === PLAYER.BLACK ? 'border-2 border-white' : ''}`}
                  style={{ 
                    backgroundColor: PLAYER_COLORS[config.player]
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => togglePlayerControl(config.player)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {config.control === PLAYER_CONTROL.HUMAN ? (
                      <img 
                        src="/icons/human_icon.png" 
                        alt="Human" 
                        className="w-8 h-8"
                      />
                    ) : (
                      <img 
                        src="/icons/AI_icon.png" 
                        alt="AI" 
                        className="w-8 h-8"
                      />
                    )}
                  </div>
                </motion.div>
              ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              onClick={saveAndStartGame}
              className={`${buttonStyle.base} ${buttonStyle.primary}`}
              style={{ fontFamily: 'Menlo, monospace' }}
            >
              Start Game
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              onClick={() => setMenuScreen('main')}
              className={`${buttonStyle.back}`}
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
