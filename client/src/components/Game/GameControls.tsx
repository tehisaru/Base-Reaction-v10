import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PLAYER, PLAYER_COLORS, PLAYER_BG_COLORS } from "../../lib/constants";
import { PlayerSettingsManager, PLAYER_CONTROL } from "../Menu/MainMenu";

interface GameControlsProps {
  currentPlayer: PLAYER;
  onUndo: () => void;
  onRestart: () => void;
  canUndo: boolean;
  isBaseMode: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  currentPlayer,
  onUndo,
  onRestart,
  canUndo,
  isBaseMode
}) => {
  const navigate = useNavigate();

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // R key restarts the game
      if (e.key === "r" || e.key === "R") {
        onRestart();
      }

      // Z key (with Ctrl/Cmd) for undo
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && canUndo) {
        onUndo();
      }

      // Escape key to go back to menu
      if (e.key === "Escape") {
        navigate("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canUndo, onRestart, onUndo, navigate]);

  return (
    <div 
      className="flex flex-col items-center justify-center w-full max-w-3xl p-3 mb-4"
      style={{ 
        backgroundColor: 'transparent',
        transition: "background-color 0.3s ease"
      }}
    >
      <div className="flex items-center space-x-3">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-3 py-1 rounded-xl border-2 border-white text-white text-sm transition-all duration-300 ${
            canUndo 
              ? "hover:bg-gray-800" 
              : "opacity-50 cursor-not-allowed"
          }`}
          style={{ 
            fontFamily: 'Menlo, monospace',
            backgroundColor: '#000000'
          }}
        >
          Undo
        </button>

        <button
          onClick={onRestart}
          className="px-3 py-1 rounded-xl border-2 border-white text-white text-sm hover:bg-gray-800 transition-all duration-300"
          style={{ 
            fontFamily: 'Menlo, monospace',
            backgroundColor: '#000000'
          }}
        >
          Restart
        </button>

        <button
          onClick={() => navigate("/")}
          className="px-3 py-1 rounded-xl border-2 border-white text-white text-sm hover:bg-gray-800 transition-all duration-300"
          style={{ 
            fontFamily: 'Menlo, monospace',
            backgroundColor: '#000000'
          }}
        >
          Menu
        </button>
      </div>
    </div>
  );
};

export default GameControls;