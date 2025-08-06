import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface TutorialScreenProps {
  mode: "classic" | "base-reaction";
  onBack?: () => void; // Optional callback to handle back navigation
}

const typewriterFont = { fontFamily: 'Menlo, monospace' };

const TutorialScreen: React.FC<TutorialScreenProps> = ({ mode, onBack }) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-black p-4 py-8" style={{ maxHeight: "100vh" }}>
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-white" style={typewriterFont}>
        {mode === "classic" ? "Classic Mode" : "Base Reaction Mode"} Tutorial
      </h1>
      <div className="max-w-3xl mx-auto text-white p-4 md:p-6" style={{ transition: "all 0.3s ease" }}>
        
        {mode === "classic" ? (
          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-semibold mb-2" style={typewriterFont}>How to Play</h2>
              <ul className="list-disc pl-6 space-y-1" style={typewriterFont}>
                <li>Click empty cells or your own colored cells to add dots</li>
                <li>When cells get too full, they explode and spread to neighbors</li>
                <li>Win by being the only player with dots remaining</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold mb-2" style={typewriterFont}>Critical Mass (When Cells Explode)</h2>
              <ul className="list-disc pl-6 space-y-1" style={typewriterFont}>
                <li><strong>Corner cells:</strong> 2 dots → explode</li>
                <li><strong>Edge cells:</strong> 3 dots → explode</li>
                <li><strong>Center cells:</strong> 4 dots → explode</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold mb-2" style={typewriterFont}>Key Strategy</h2>
              <ul className="list-disc pl-6 space-y-1" style={typewriterFont}>
                <li>Corners explode fastest - use them for quick attacks</li>
                <li>Watch for chain reactions that can clear the board</li>
                <li>Sometimes building up your position is better than attacking</li>
              </ul>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-semibold mb-2" style={typewriterFont}>How to Play</h2>
              <ul className="list-disc pl-6 space-y-1" style={typewriterFont}>
                <li>Destroy enemy headquarters by reducing their health to zero</li>
                <li>You can only place dots near your HQ or next to your existing dots</li>
                <li>Exploding next to enemy HQs damages them</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold mb-2" style={typewriterFont}>HQ Bases</h2>
              <ul className="list-disc pl-6 space-y-1" style={typewriterFont}>
                <li>Each player starts with an HQ that has 5 health</li>
                <li>HQs glow brighter when healthy, dimmer when damaged</li>
                <li>Protect your HQ while attacking enemy HQs</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold mb-2" style={typewriterFont}>Power-ups</h2>
              <ul className="list-disc pl-6 space-y-1" style={typewriterFont}>
                <li><strong>Heart (♥):</strong> Heal your HQ or damage an enemy HQ</li>
                <li><strong>Diamond (♦):</strong> Spreads your dots to nearby empty cells</li>
              </ul>
            </section>
          </div>
        )}
        
        <div className="mt-8 mb-16 flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (onBack) {
                onBack(); // Use callback if provided (when accessed from MainMenu)
              } else {
                navigate("/"); // Fallback to home navigation
              }
            }}
            className="py-4 px-8 rounded-2xl text-white bg-black hover:bg-gray-800 transition-all duration-200 border-2 border-white w-full md:w-auto"
            style={typewriterFont}
          >
            Back to Menu
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (onBack) {
                onBack(); // Go back to main menu first
                // Then navigate to mode selection by setting the correct game mode
                setTimeout(() => {
                  navigate("/");
                }, 100);
              } else {
                navigate("/"); // Navigate to main menu for mode selection
              }
            }}
            className="py-4 px-8 rounded-2xl text-white bg-black hover:bg-gray-800 transition-all duration-200 border-2 border-white w-full md:w-auto"
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
