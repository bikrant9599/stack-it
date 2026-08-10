import React from 'react';
import { motion } from 'motion/react';
import { X, Palette, Zap, Volume2, VolumeX, Info, Check } from 'lucide-react';
import { DifficultyMode, VisualTheme } from '../types';
import { THEMES } from '../utils/geometry';
import { soundEngine } from '../utils/audio';

interface SettingsModalProps {
  difficulty: DifficultyMode;
  theme: VisualTheme;
  isMuted: boolean;
  onClose: () => void;
  onChangeDifficulty: (diff: DifficultyMode) => void;
  onChangeTheme: (theme: VisualTheme) => void;
  onToggleMute: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  difficulty,
  theme,
  isMuted,
  onClose,
  onChangeDifficulty,
  onChangeTheme,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 pb-safe pt-safe pl-safe pr-safe z-40 bg-black/70 backdrop-blur-md overflow-hidden max-h-[100dvh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xs sm:max-w-sm glass-panel p-4 sm:p-6 rounded-3xl border border-white/15 flex flex-col max-h-[85dvh] overflow-y-auto text-slate-100 shadow-2xl scrollbar-none"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Game Settings</span>
          </h3>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Toggle */}
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>Audio & Sound FX</span>
          </div>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onToggleMute();
            }}
            className="w-full bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 flex justify-between items-center hover:bg-slate-900/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
              <span className="text-sm font-semibold text-white">
                {isMuted ? 'Sound Muted' : 'Sound Enabled'}
              </span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${!isMuted ? 'bg-emerald-500' : 'bg-slate-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${!isMuted ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>

        {/* Difficulty Mode */}
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Physics & Difficulty</span>
          </div>
          <div className="space-y-2">
            {[
              { id: 'CASUAL', title: 'Casual', desc: 'Standard speed with wider placement tolerances.' },
              { id: 'PHYSICS', title: 'Realistic Physics', desc: 'True center-of-mass weight & stack wobble.' },
              { id: 'HARDCORE', title: 'Hardcore Speed', desc: 'Narrower blocks & fast block movement.' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  soundEngine.playButtonClick();
                  onChangeDifficulty(mode.id as DifficultyMode);
                }}
                className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                  difficulty === mode.id
                    ? 'bg-indigo-600/30 border-indigo-500/80 text-white'
                    : 'bg-slate-900/40 border-white/5 text-slate-300 hover:bg-white/5'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-white">{mode.title}</div>
                  <div className="text-[11px] text-slate-400">{mode.desc}</div>
                </div>
                {difficulty === mode.id && <Check className="w-5 h-5 text-indigo-400 shrink-0 ml-2" />}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Themes */}
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-2">
            <Palette className="w-4 h-4 text-pink-400" />
            <span>Visual Theme</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(THEMES) as VisualTheme[]).map((thmKey) => {
              const thm = THEMES[thmKey];
              const isSelected = theme === thmKey;
              return (
                <button
                  key={thmKey}
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onChangeTheme(thmKey);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-500/80 text-white'
                      : 'bg-slate-900/40 border-white/5 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="text-xs font-bold mb-2 flex justify-between items-center">
                    <span>{thm.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className="flex space-x-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: thm.getPaletteColor(i) }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
          <div className="font-bold mb-1 flex items-center space-x-1 text-indigo-300">
            <Info className="w-3.5 h-3.5" />
            <span>How to Play</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
            <li>Tap or press SPACE to drop the block.</li>
            <li>Overhanging edges get cut off realistically.</li>
            <li>3+ consecutive perfect drops trigger combo bonuses!</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};
