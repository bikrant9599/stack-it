import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Award, Flame, Target, Home } from 'lucide-react';
import { GameStats } from '../types';
import { soundEngine } from '../utils/audio';

interface GameOverOverlayProps {
  stats: GameStats;
  highScore: number;
  isNewRecord: boolean;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  stats,
  highScore,
  isNewRecord,
  onRestart,
  onHome,
}) => {
  useEffect(() => {
    if (isNewRecord) {
      soundEngine.playHighScoreSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981'],
      });
    }
  }, [isNewRecord]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 pb-safe pt-safe pl-safe pr-safe z-30 bg-black/65 backdrop-blur-md overflow-hidden max-h-[100dvh]"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-xs sm:max-w-sm glass-panel p-4 sm:p-6 rounded-3xl border border-white/15 flex flex-col items-center text-center shadow-2xl max-h-[92dvh] overflow-y-auto scrollbar-none"
      >
        {/* Header Badge */}
        {isNewRecord ? (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-2 sm:mb-3">
            <Trophy className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>NEW RECORD!</span>
          </div>
        ) : (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-2 sm:mb-3">
            <span>TOWER COLLAPSED</span>
          </div>
        )}

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
          {isNewRecord ? 'Outstanding!' : 'Game Over'}
        </h2>
        <p className="text-[11px] sm:text-xs text-slate-300 mb-4 sm:mb-6">
          {isNewRecord
            ? 'You reached an unprecedented tower height!'
            : 'Keep practicing your timing to build higher!'}
        </p>

        {/* Score Display Card */}
        <div className="w-full bg-slate-900/60 rounded-2xl p-3 sm:p-4 border border-white/5 mb-4 sm:mb-5 flex justify-around items-center">
          <div className="flex flex-col items-center">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              SCORE
            </span>
            <span className="text-3xl sm:text-4xl font-black text-amber-400">{stats.score}</span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300">{stats.heightMeters} meters</span>
          </div>

          <div className="h-9 sm:h-10 w-[1px] bg-white/10" />

          <div className="flex flex-col items-center">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              BEST
            </span>
            <span className="text-3xl sm:text-4xl font-black text-white">{highScore}</span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300">{(highScore * 0.6).toFixed(1)}m</span>
          </div>
        </div>

        {/* Detailed Stats Breakdown */}
        <div className="w-full grid grid-cols-2 gap-2 mb-4 sm:mb-6">
          <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl flex items-center space-x-2.5 text-left">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 shrink-0" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase">Perfect Drops</div>
              <div className="text-xs sm:text-sm font-bold text-white">{stats.perfectCount}</div>
            </div>
          </div>

          <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl flex items-center space-x-2.5 text-left">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase">Max Combo</div>
              <div className="text-xs sm:text-sm font-bold text-white">{stats.maxCombo}x</div>
            </div>
          </div>

          <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl flex items-center space-x-2.5 text-left">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase">Accuracy</div>
              <div className="text-xs sm:text-sm font-bold text-white">{stats.accuracyPercent}%</div>
            </div>
          </div>

          <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl flex items-center space-x-2.5 text-left">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase">Blocks Dropped</div>
              <div className="text-xs sm:text-sm font-bold text-white">{stats.totalBlocksDropped}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex space-x-2.5 sm:space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundEngine.playButtonClick();
              onHome();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            className="p-3 sm:p-3.5 rounded-2xl glass-panel text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer min-h-[44px]"
            title="Main Menu"
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              soundEngine.playButtonClick();
              onRestart();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            className="flex-1 py-3 sm:py-3.5 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RESTART</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
