import React, { useState, useEffect } from 'react';
import { GameState, DifficultyMode, VisualTheme, ComboFeedback, GameStats } from './types';
import { LoadingScreen } from './components/LoadingScreen';
import { ThreeCanvas } from './components/ThreeCanvas';
import { StartOverlay } from './components/StartOverlay';
import { HUDOverlay } from './components/HUDOverlay';
import { GameOverOverlay } from './components/GameOverOverlay';
import { SettingsModal } from './components/SettingsModal';
import { soundEngine } from './utils/audio';

export default function App() {
  // Game state
  const [gameState, setGameState] = useState<GameState>('LOADING');

  // Preferences saved in localStorage
  const [difficulty, setDifficulty] = useState<DifficultyMode>(() => {
    return (localStorage.getItem('stackit_difficulty') as DifficultyMode) || 'CASUAL';
  });

  const [theme, setTheme] = useState<VisualTheme>(() => {
    return (localStorage.getItem('stackit_theme') as VisualTheme) || 'PASTEL';
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('stackit_muted') === 'true';
  });

  // High Scores
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('stackit_highscore') || '0', 10);
  });

  const [bestHeight, setBestHeight] = useState<number>(() => {
    return parseFloat(localStorage.getItem('stackit_bestheight') || '0.0');
  });

  // Real-time Game Statistics
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentHeight, setCurrentHeight] = useState<number>(0);
  const [comboFeedback, setComboFeedback] = useState<ComboFeedback | null>(null);

  // Game Over Details
  const [lastStats, setLastStats] = useState<GameStats | null>(null);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Sync Mute state to sound engine
  useEffect(() => {
    soundEngine.setMuted(isMuted);
    localStorage.setItem('stackit_muted', isMuted ? 'true' : 'false');
  }, [isMuted]);

  // Persist difficulty
  const handleDifficultyChange = (mode: DifficultyMode) => {
    setDifficulty(mode);
    localStorage.setItem('stackit_difficulty', mode);
  };

  // Persist theme
  const handleThemeChange = (newTheme: VisualTheme) => {
    setTheme(newTheme);
    localStorage.setItem('stackit_theme', newTheme);
  };

  // Start Game
  const handleStartGame = () => {
    setCurrentScore(0);
    setCurrentHeight(0);
    setComboFeedback(null);
    setIsNewRecord(false);
    setGameState('PLAYING');
  };

  // Handle Block Placed Callback from 3D Canvas
  const handleBlockPlaced = (comboCount: number, isPerfect: boolean) => {
    if (isPerfect) {
      let text = 'PERFECT!';
      if (comboCount === 2) text = 'DOUBLE PERFECT!';
      if (comboCount === 3) text = 'TRIPLE COMBO!';
      if (comboCount >= 4) text = `SUPER STREAK x${comboCount}!`;

      setComboFeedback({
        text,
        count: comboCount,
        multiplier: Math.min(comboCount, 5),
        timestamp: Date.now(),
      });

      // Clear combo text after 1.2s
      setTimeout(() => {
        setComboFeedback(null);
      }, 1200);
    } else {
      setComboFeedback(null);
    }
  };

  // Handle Stats Update from Canvas
  const handleUpdateStats = (score: number, heightMeters: number) => {
    setCurrentScore(score);
    setCurrentHeight(heightMeters);
  };

  // Handle Game Over Callback
  const handleGameOver = (stats: GameStats) => {
    setLastStats(stats);

    let newRecord = false;
    if (stats.score > highScore) {
      newRecord = true;
      setHighScore(stats.score);
      setBestHeight(stats.heightMeters);
      localStorage.setItem('stackit_highscore', stats.score.toString());
      localStorage.setItem('stackit_bestheight', stats.heightMeters.toString());
    }

    setIsNewRecord(newRecord);
    setGameState('GAMEOVER');
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-950 overflow-hidden font-sans select-none touch-none">
      {/* Cinematic Loading Screen Overlay */}
      {gameState === 'LOADING' && (
        <LoadingScreen onComplete={() => setGameState('START')} />
      )}

      {/* 3D Canvas Layer */}
      {gameState !== 'LOADING' && (
        <ThreeCanvas
          gameState={gameState}
          difficulty={difficulty}
          theme={theme}
          onBlockPlaced={handleBlockPlaced}
          onGameOver={handleGameOver}
          onUpdateStats={handleUpdateStats}
        />
      )}

      {/* Start Screen Overlay */}
      {gameState === 'START' && (
        <StartOverlay
          highScore={highScore}
          bestHeight={bestHeight}
          difficulty={difficulty}
          theme={theme}
          isMuted={isMuted}
          onStartGame={handleStartGame}
          onChangeDifficulty={handleDifficultyChange}
          onChangeTheme={handleThemeChange}
          onToggleMute={() => setIsMuted(!isMuted)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Playing HUD Overlay */}
      {gameState === 'PLAYING' && (
        <HUDOverlay
          score={currentScore}
          heightMeters={currentHeight}
          bestScore={highScore}
          combo={comboFeedback}
          isMuted={isMuted}
          onPause={() => setGameState('PAUSED')}
          onToggleMute={() => setIsMuted(!isMuted)}
        />
      )}

      {/* Paused Screen Overlay */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 pb-safe pt-safe overflow-hidden max-h-[100dvh]">
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/15 text-center max-w-xs w-full shadow-2xl">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Game Paused</h3>
            <p className="text-xs text-slate-300 mb-6">Current Score: <span className="font-bold text-amber-400">{currentScore}</span> ({currentHeight}m)</p>
            <div className="space-y-3">
              <button
                onClick={() => setGameState('PLAYING')}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors cursor-pointer min-h-[44px]"
              >
                RESUME
              </button>
              <button
                onClick={() => setGameState('START')}
                className="w-full py-3 bg-white/10 text-slate-200 font-semibold rounded-xl hover:bg-white/20 transition-colors cursor-pointer min-h-[44px]"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen Overlay */}
      {gameState === 'GAMEOVER' && lastStats && (
        <GameOverOverlay
          stats={lastStats}
          highScore={highScore}
          isNewRecord={isNewRecord}
          onRestart={handleStartGame}
          onHome={() => setGameState('START')}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          difficulty={difficulty}
          theme={theme}
          isMuted={isMuted}
          onClose={() => setIsSettingsOpen(false)}
          onChangeDifficulty={handleDifficultyChange}
          onChangeTheme={handleThemeChange}
          onToggleMute={() => setIsMuted(!isMuted)}
        />
      )}
    </div>
  );
}
