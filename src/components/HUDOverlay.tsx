import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pause, Volume2, VolumeX, Sparkles, Flame, Trophy } from 'lucide-react';
import { ComboFeedback } from '../types';
import { soundEngine } from '../utils/audio';

interface HUDOverlayProps {
  score: number;
  heightMeters: number;
  bestScore: number;
  combo: ComboFeedback | null;
  isMuted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  score,
  heightMeters,
  bestScore,
  combo,
  isMuted,
  onPause,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 p-3 sm:p-6 pb-safe pt-safe pl-safe pr-safe flex flex-col justify-between pointer-events-none z-10 select-none overflow-hidden max-h-[100dvh]">
      {/* Top Header Controls, Score & Best Score */}
      <div className="w-full flex justify-between items-start pointer-events-auto gap-2">
        {/* Score & Best Card Group */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Current Score */}
          <div className="glass-panel px-3.5 py-2 sm:px-5 sm:py-3 rounded-2xl shadow-xl flex flex-col border border-white/10">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
              SCORE
            </span>
            <div className="flex items-baseline space-x-1.5 sm:space-x-2">
              <span className="text-xl sm:text-3xl font-black text-white tracking-tight">{score}</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-300">({heightMeters}m)</span>
            </div>
          </div>

          {/* Best Score */}
          <div className="glass-panel px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-xl flex flex-col border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center space-x-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                BEST
              </span>
            </div>
            <span className="text-lg sm:text-2xl font-black text-amber-300 tracking-tight mt-0.5 sm:mt-0">
              {Math.max(score, bestScore)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex space-x-1.5 sm:space-x-2 shrink-0">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onToggleMute();
            }}
            className="glass-panel p-2.5 sm:p-3 rounded-2xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors shadow-lg cursor-pointer"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />}
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onPause();
            }}
            className="glass-panel p-2.5 sm:p-3 rounded-2xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors shadow-lg cursor-pointer"
            title="Pause Game"
          >
            <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Center Combo Feedback Display */}
      <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
        <AnimatePresence mode="wait">
          {combo && (
            <motion.div
              key={combo.timestamp}
              initial={{ scale: 0.5, opacity: 0, y: 15 }}
              animate={{ scale: 1.1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              <div className="glass-panel px-6 py-2.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/30 to-rose-500/30 shadow-2xl flex items-center space-x-2">
                {combo.count >= 3 ? (
                  <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-300" />
                )}
                <span className="text-lg font-black tracking-wider text-amber-300 uppercase">
                  {combo.text}
                </span>
              </div>
              {combo.count > 1 && (
                <span className="text-xs font-bold text-amber-200/90 tracking-widest mt-1 uppercase drop-shadow">
                  {combo.count}x Perfect Combo Streak!
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Hint */}
      <div className="w-full text-center pointer-events-none mb-2">
        <span className="text-xs font-semibold text-white/50 tracking-wider uppercase bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
          Tap anywhere to drop
        </span>
      </div>
    </div>
  );
};
