import React, { useState, useRef, useEffect } from 'react';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import { useGameStore } from './store/gameStore';
import { Play, Gamepad2, ChevronRight, ChevronDown, Trophy } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { getWalletName, saveWalletName } from './lib/supabase';

function App() {
  const { 
    isPlaying,
    gameOver,
    score,
    playerName,
    setPlaying,
    setPlayerName,
    setWalletAddress,
    resetAll,
  } = useGameStore();

  const { address, isDisconnected } = useAccount({
    onDisconnect() {
      // Reset game state and return to start menu when wallet disconnects
      resetAll();
    },
  });

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [loadingName, setLoadingName] = useState(false);

  // Update wallet address in store when it changes
  useEffect(() => {
    setWalletAddress(address);
  }, [address, setWalletAddress]);

  // Load saved name when wallet connects
  useEffect(() => {
    async function loadWalletName() {
      if (address) {
        setLoadingName(true);
        try {
          const savedName = await getWalletName(address);
          if (savedName) {
            setPlayerName(savedName);
          }
        } catch (error) {
          console.error('Error loading wallet name:', error);
        }
        setLoadingName(false);
      }
    }
    loadWalletName();
  }, [address, setPlayerName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Ignore clicks if the leaderboard isn't shown
      if (!showLeaderboard) return;

      // Get the clicked element
      const target = event.target as Node;

      // Check if click is outside both the leaderboard and toggle button
      const isOutsideLeaderboard = leaderboardRef.current && !leaderboardRef.current.contains(target);
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target);

      if (isOutsideLeaderboard && isOutsideButton) {
        setShowLeaderboard(false);
      }
    };

    // Add listener with a slight delay to avoid immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLeaderboard]);

  const handleStart = async () => {
    if (!playerName.trim()) return;
    
    // Save name if wallet is connected
    if (address) {
      await saveWalletName(address, playerName);
    }
    
    setPlaying(true);
  };

  const toggleLeaderboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLeaderboard(prev => !prev);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-winter-pattern">
      <div className="min-h-screen bg-black/30 backdrop-blur-sm py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Wallet Connection */}
          <div className="fixed top-8 right-8 z-10 md:block hidden">
            <ConnectButton />
          </div>

          {/* Desktop Leaderboard */}
          <div className="fixed top-8 left-8 z-10 md:block hidden">
            <button
              ref={buttonRef}
              onClick={toggleLeaderboard}
              className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur text-blue-600 rounded-xl shadow-lg hover:bg-blue-50 transition-all mb-2"
            >
              {showLeaderboard ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              Top Players
            </button>
            
            <div
              ref={leaderboardRef}
              className={`transition-all duration-300 ease-in-out overflow-hidden ${showLeaderboard ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-80">
                <Leaderboard />
              </div>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden flex justify-between items-start mb-4 pt-2">
            <button
              ref={buttonRef}
              onClick={toggleLeaderboard}
              className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur text-blue-600 rounded-xl shadow-lg hover:bg-blue-50 transition-all"
            >
              {showLeaderboard ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              Top Players
            </button>
            <ConnectButton />
          </div>

          {/* Mobile Leaderboard Modal */}
          {showLeaderboard && (
            <div 
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center p-4"
              onClick={toggleLeaderboard}
            >
              <div 
                ref={leaderboardRef}
                className="bg-white/95 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Top Players</h3>
                  <button
                    onClick={toggleLeaderboard}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
                <Leaderboard />
              </div>
            </div>
          )}

          {/* Hero Header */}
          <div className="text-center mb-12 pt-16 md:pt-0">
            <div className="inline-block animate-float">
              <div className="relative">
                <Gamepad2 className="w-24 h-24 text-white opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12" />
                <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-[0_0_25px_rgba(0,0,0,0.5)] relative">
                  Flappy Penguin
                </h1>
              </div>
            </div>
            <p className="text-xl text-white/90 mt-4 font-medium drop-shadow-lg">
              Can you navigate through the rugs?
            </p>
          </div>
          
          <div className="relative grid grid-cols-1 gap-8 max-w-4xl mx-auto">
            {/* Game Container */}
            <div>
              {!isPlaying && !gameOver ? (
                <div className="bg-white/95 backdrop-blur p-8 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-center mb-6">
                    <Gamepad2 className="w-12 h-12 text-blue-500 animate-float" />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
                    Welcome to the Circuit!
                  </h2>
                  
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="bg-blue-50 p-6 rounded-xl">
                      <h3 className="font-semibold mb-2 text-blue-800">How to Play:</h3>
                      <ul className="space-y-2 text-blue-700">
                        <li>• Click or press spacebar to make the penguin flap</li>
                        <li>• Avoid hitting the floating rugs</li>
                        <li>• Score points by passing through gaps</li>
                        <li>• Try to beat the high score!</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter your name"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                          disabled={loadingName}
                        />
                        {loadingName && (
                          <div className="absolute inset-y-0 right-3 flex items-center">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-4">
                        <button
                          onClick={handleStart}
                          disabled={!playerName.trim()}
                          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors font-semibold text-lg"
                        >
                          <Play className="w-6 h-6" />
                          Start Game
                        </button>

                        {!address && (
                          <div className="text-center space-y-3">
                            <p className="text-sm text-gray-600">
                              Want to compete for potential prizes? Connect your wallet!
                            </p>
                            <div className="flex justify-center">
                              <ConnectButton />
                            </div>
                          </div>
                        )}

                        {address && (
                          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                            <Trophy className="w-4 h-4" />
                            <span>You may be eligible for prizes!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Game />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <footer className="mt-12 text-center text-white/80">
          <p className="text-sm">© {currentYear} Flappy Penguin. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;