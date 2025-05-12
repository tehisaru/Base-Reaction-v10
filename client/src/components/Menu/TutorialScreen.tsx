import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface TutorialScreenProps {
  mode: "classic" | "base-reaction";
}

const typewriterFont = { fontFamily: 'Menlo, monospace' };

const TutorialScreen: React.FC<TutorialScreenProps> = ({ mode }) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-black p-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-white" style={typewriterFont}>
        {mode === "classic" ? "Classic Mode" : "Base Reaction Mode"} Tutorial
      </h1>
      <div className="max-w-3xl mx-auto bg-black bg-opacity-70 text-white rounded-3xl border-2 border-white p-6 max-h-[80vh] overflow-y-auto" style={{ transition: "all 0.3s ease" }}>
        
        {mode === "classic" ? (
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-2" style={typewriterFont}>Goal</h2>
              <p style={typewriterFont}>Be the only player with dots on the board.</p>
            </section>
          
            
            <section>
              <h2 className="text-xl font-semibold mb-2" style={typewriterFont}>Turn Structure</h2>
              <ul className="list-disc pl-6 space-y-2" style={typewriterFont}>
                <li>Players can only place dots in empty cells or cells containing their color.</li>
                <li>Each cell has a "critical mass" that causes explosion when reached:
                  <ul className="list-circle pl-6 mt-1">
                    <li>Corner cells: 2 dots</li>
                    <li>Edge cells: 3 dots</li>
                    <li>Center cells: 4 dots</li>
                  </ul>
                </li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2" style={typewriterFont}>AI Players</h2>
              <p style={typewriterFont}>You can play against AI opponents with different difficulty levels:</p>
              <ul className="list-disc pl-6 space-y-2" style={typewriterFont}>
                <li><strong>Easy:</strong> Makes more random moves with occasional strategy</li>
                <li><strong>Medium:</strong> More balanced decision making with some strategic play</li>
                <li><strong>Hard:</strong> Makes highly strategic moves and targets weak points</li>
              </ul>
              <p className="mt-2" style={typewriterFont}>Configure AI opponents in the game setup screen before starting a game.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2" style={typewriterFont}>Controls</h2>
              <ul className="list-disc pl-6 space-y-2" style={typewriterFont}>
                <li>Click on a valid cell to place a dot</li>
                <li>Press 'R' to restart the game</li>
                <li>Click "Undo" or press Ctrl+Z to undo your last move</li>
              </ul>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-2" style={typewriterFont}>Goal</h2>
              <p style={typewriterFont}>Reduce the enemy's HQ health to zero.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2" style={typewriterFont}>Turn Structure</h2>
              <ul className="list-disc pl-6 space-y-2" style={typewriterFont}>
                <li>Players can only place dots:
                  <ul className="list-circle pl-6 mt-1">
                    <li>Along their HQ side (column for left/right bases, row for top/bottom bases)</li>
                    <li>Adjacent to their HQ (orthogonal or diagonal)</li>
                    <li>Adjacent to their existing dots (orthogonal or diagonal)</li>
                  </ul>
                </li>
                <li>Critical mass mechanics are the same as Classic mode.</li>
                <li>Exploding next to an enemy HQ damages it.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2" style={typewriterFont}>Power-ups</h2>
              <h3 className="text-lg font-semibold mb-1" style={typewriterFont}>In 2-Player Games</h3>
              <ul className="list-disc pl-6 space-y-2 mb-3" style={typewriterFont}>
                <li>
                  <strong>Diamond:</strong> When a player places a dot on a diamond, each cell in that row gets one dot of the player's color added (only applies to empty cells or cells with the player's color).
                </li>
                <li>
                  <strong>Heart:</strong> If the player's HQ has less than 5 lives, add one life. Otherwise, take one life from the enemy HQ.
                </li>
              </ul>
              
              <h3 className="text-lg font-semibold mb-1" style={typewriterFont}>In 3-4 Player Games</h3>
              <ul className="list-disc pl-6 space-y-2" style={typewriterFont}>
                <li>
                  <strong>Diamond:</strong> When a player places a dot on a diamond, a 3×3 grid of cells centered on the diamond gets one dot of the player's color added to each cell (only applies to empty cells or cells with the player's color).
                </li>
                <li>
                  <strong>Heart:</strong> The player's HQ gains one life (up to a maximum of 5). In 3-4 player games, hearts never damage enemy HQs.
                </li>
              </ul>
            </section>
          
            <section>
              <h2 className="text-xl font-semibold mb-2" style={typewriterFont}>Controls</h2>
              <ul className="list-disc pl-6 space-y-2" style={typewriterFont}>
                <li>Click on a valid cell to place a dot</li>
                <li>Press 'R' to restart the game</li>
                <li>Click "Undo" or press Ctrl+Z to undo your last move</li>
              </ul>
            </section>
          </div>
        )}
        
        <div className="mt-8 flex justify-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="py-4 px-8 rounded-2xl text-white font-semibold bg-black hover:bg-gray-800 transition-all duration-200 border-2 border-white"
            style={typewriterFont}
          >
            Back
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(mode === "classic" ? "/classic" : "/base-reaction")}
            className="py-4 px-8 rounded-2xl text-white font-semibold bg-black hover:bg-gray-800 transition-all duration-200 border-2 border-white"
            style={typewriterFont}
          >
            Play {mode === "classic" ? "Classic" : "Base Reaction"}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default TutorialScreen;
