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
      className="flex flex-col items-center justify-center w-full max-w-3xl p-4 mb-6"
      style={{ 
        backgroundColor: 'transparent',
        transition: "background-color 0.5s ease"
      }}
    >
      <div className="flex items-center space-x-10">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-6 py-3 rounded-xl text-white text-base font-medium transition-all duration-500 ${
            canUndo 
              ? "hover:opacity-80" 
              : "opacity-50 cursor-not-allowed"
          }`}
          style={{ 
            fontFamily: 'Menlo, monospace',
            backgroundColor: 'rgb(15, 15, 15)', // Much darker gray with no transparency
            border: 'none',
            transition: "opacity 0.3s ease" // Simplified transition
          }}
        >
          Undo
        </button>

        <button
          onClick={onRestart}
          className="px-6 py-3 rounded-xl text-white text-base font-medium hover:opacity-80 transition-all duration-500"
          style={{ 
            fontFamily: 'Menlo, monospace',
            backgroundColor: 'rgb(15, 15, 15)', // Much darker gray with no transparency
            border: 'none',
            transition: "opacity 0.3s ease" // Simplified transition
          }}
        >
          Restart
        </button>

        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 rounded-xl text-white text-base font-medium hover:opacity-80 transition-all duration-500"
          style={{ 
            fontFamily: 'Menlo, monospace',
            backgroundColor: 'rgb(15, 15, 15)', // Much darker gray with no transparency
            border: 'none',
            transition: "opacity 0.3s ease" // Simplified transition
          }}
        >
          Menu
        </button>
      </div>
    </div>
  );
};

export default GameControls;