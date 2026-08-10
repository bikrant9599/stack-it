import React from 'react';
import { motion } from 'motion/react';
import { Play, Trophy, Sparkles, Volume2, VolumeX, Settings } from 'lucide-react';
import { DifficultyMode, VisualTheme } from '../types';
import { THEMES } from '../utils/geometry';
import { soundEngine } from '../utils/audio';

interface StartOverlayProps {
  highScore: number;
  bestHeight: number;
  difficulty: DifficultyMode;
  theme: VisualTheme;
  isMuted: boolean;
  onStartGame: () => void;
  onChangeDifficulty: (diff: DifficultyMode) => void;
  onChangeTheme: (theme: VisualTheme) => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
}

export const StartOverlay: React.FC<StartOverlayProps> = ({
  highScore,
  bestHeight,
  difficulty,
  theme,
  isMuted,
  onStartGame,
  onChangeDifficulty,
  onChangeTheme,
  onToggleMute,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-4 sm:p-6 pb-safe pt-safe pl-safe pr-safe z-20 pointer-events-none overflow-hidden max-h-[100dvh]">
      {/* Top Header Bar */}
      <div className="w-full max-w-md flex justify-between items-center pointer-events-auto">
        <div className="glass-panel px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center space-x-1.5 sm:space-x-2 text-amber-300 shadow-lg">
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-300">BEST:</span>
          <span className="text-xs sm:text-sm font-bold text-white">{highScore} ({bestHeight}m)</span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onToggleMute();
            }}
            className="glass-panel p-2 sm:p-2.5 rounded-full text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />}
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenSettings();
            }}
            className="glass-panel p-2 sm:p-2.5 rounded-full text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-xs sm:max-w-sm flex flex-col items-center text-center pointer-events-auto my-auto py-2"
      >
        {/* Title Badge */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] sm:text-xs font-medium tracking-widest uppercase mb-2">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Realistic 3D Physics</span>
        </div>

        {/* Game Main Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-indigo-300 drop-shadow-md mb-1">
          STACK IT
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-medium mb-4 sm:mb-8 max-w-xs leading-relaxed">
          Align moving blocks to construct the ultimate physics tower.
        </p>

        {/* Start Play Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            soundEngine.playButtonClick();
            onStartGame();
          }}
          className="w-full py-3 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-base sm:text-lg shadow-xl shadow-indigo-500/30 flex items-center justify-center space-x-2.5 hover:brightness-110 active:brightness-95 transition-all mb-4 sm:mb-6 cursor-pointer"
        >
          <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
          <span>START STACKING</span>
        </motion.button>

        {/* Quick Mode Switcher */}
        <div className="w-full glass-panel p-2 sm:p-3 rounded-2xl flex justify-between items-center space-x-1">
          {(['CASUAL', 'PHYSICS', 'HARDCORE'] as DifficultyMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                soundEngine.playButtonClick();
                onChangeDifficulty(mode);
              }}
              className={`flex-1 py-1 sm:py-1.5 px-1.5 rounded-xl text-[10px] sm:text-xs font-semibold transition-all cursor-pointer ${
                difficulty === mode
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Bottom Controls Info */}
      <div className="w-full max-w-md text-center pointer-events-auto">
        <p className="text-[10px] sm:text-xs text-slate-400 font-medium bg-slate-900/50 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full inline-block border border-white/5">
          💡 <span className="text-slate-200 font-semibold">Tap screen</span> or press <span className="text-slate-200 font-semibold">SPACE</span> to drop
        </p>
      </div>
    </div>
  );
};
