import React from "react";
import { motion } from "framer-motion";
import { PLAYER, PLAYER_COLORS } from "../../lib/constants";

interface GameOverOverlayProps {
  winner: PLAYER | null;
  onRestart: () => void;
  onBackToMenu: () => void;
}

const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  winner,
  onRestart,
  onBackToMenu
}) => {
  
  if (!winner) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="bg-black text-white rounded-lg p-8 max-w-md w-full mx-4"
        style={{ transition: "all 0.3s ease" }}
      >
        <h2 className="text-3xl font-bold text-center mb-6" style={{ fontFamily: 'Menlo, monospace' }}>Game Over!</h2>
        
        <div className="flex items-center justify-center mb-8">
          <div 
            className="w-12 h-12 rounded-full mr-4" 
            style={{ backgroundColor: PLAYER_COLORS[winner] }}
          ></div>
          <p className="text-2xl font-bold" style={{ fontFamily: 'Menlo, monospace' }}>
            {winner === PLAYER.RED ? "Red" : "Blue"} wins!
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            className="py-3 px-6 bg-black hover:bg-gray-800 rounded-2xl text-white font-semibold transition-all duration-300 border-2 border-white"
            style={{ 
              fontFamily: 'Menlo, monospace'
            }}
          >
            Play Again
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBackToMenu}
            className="py-3 px-6 bg-black hover:bg-gray-800 rounded-2xl text-white font-semibold transition-all duration-300 border-2 border-white"
            style={{ 
              fontFamily: 'Menlo, monospace'
            }}
          >
            Back to Menu
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameOverOverlay;
