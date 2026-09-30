import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Info, CheckCircle2, ChevronRight, Hand, Activity } from 'lucide-react';
import { SignVocabularyItem } from '../../types';
import { SIGN_VOCABULARY } from '../../data/signVocabulary';

interface SignDisplayCardProps {
  signTokens?: string[];
  translatedText?: string;
  targetLanguage: string;
  isHighContrast?: boolean;
}

export const SignDisplayCard: React.FC<SignDisplayCardProps> = ({
  signTokens = [],
  translatedText = '',
  targetLanguage,
  isHighContrast = false,
}) => {
  const [activeSignIndex, setActiveSignIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);

  // Match sign tokens or fallback by text
  const matchedSigns: SignVocabularyItem[] = [];
  if (signTokens.length > 0) {
    for (const token of signTokens) {
      const found = SIGN_VOCABULARY.find(s => s.id === token || s.id === `sign-${token}`);
      if (found && !matchedSigns.some(m => m.id === found.id)) {
        matchedSigns.push(found);
      }
    }
  }

  // Fallback match by keywords
  if (matchedSigns.length === 0) {
    const lower = (translatedText || '').toLowerCase();
    for (const sign of SIGN_VOCABULARY) {
      if (lower.includes(sign.name.toLowerCase().split('/')[0].trim()) ||
          Object.values(sign.translations).some(t => lower.includes(t.toLowerCase()))) {
        matchedSigns.push(sign);
      }
    }
  }

  // Default to Help or Hello if still empty
  if (matchedSigns.length === 0) {
    matchedSigns.push(SIGN_VOCABULARY[0]);
  }

  const currentSign = matchedSigns[activeSignIndex] || matchedSigns[0];

  // Animation cycle between step 0 and 1
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev === 0 ? 1 : 0));
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying, activeSignIndex]);

  return (
    <div
      className={`rounded-2xl p-4 my-2 border transition-all ${
        isHighContrast
          ? 'bg-black text-yellow-300 border-yellow-400'
          : 'bg-emerald-950/20 text-slate-100 border-emerald-500/30 shadow-md'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Hand className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold opacity-75">
              Sign Representation Output
            </span>
            <div className="text-sm font-bold text-emerald-400">
              {currentSign.name}
            </div>
          </div>
        </div>

        {matchedSigns.length > 1 && (
          <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 text-xs">
            {matchedSigns.map((sign, idx) => (
              <button
                key={sign.id}
                onClick={() => {
                  setActiveSignIndex(idx);
                  setAnimationStep(0);
                }}
                className={`px-2 py-1 rounded text-xs transition ${
                  activeSignIndex === idx
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Visual Gesture Canvas / Animated Graphic */}
      <div className="relative h-44 rounded-xl bg-gradient-to-b from-slate-900 to-black flex items-center justify-center overflow-hidden border border-white/10">
        {/* Animated Hand/Pose Silhouette SVG */}
        <div className="relative w-full h-full flex items-center justify-center">
          <svg
            className={`w-32 h-32 transition-transform duration-700 ease-in-out ${
              animationStep === 1
                ? 'scale-105 translate-y-[-6px] rotate-3'
                : 'scale-95 translate-y-[4px] rotate-[-2deg]'
            }`}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Torso/Head reference outline */}
            <circle cx="50" cy="24" r="12" stroke="#4ade80" strokeWidth="2" strokeDasharray="3 3" opacity="0.4" />
            <path d="M25 65 C25 45, 75 45, 75 65" stroke="#4ade80" strokeWidth="2" strokeDasharray="3 3" opacity="0.3" />

            {/* Hand Gestures based on vocabulary */}
            {currentSign.id === 'sign-hello' && (
              <g className="text-emerald-400">
                <path
                  d={
                    animationStep === 0
                      ? 'M 55 24 Q 68 18 72 25 L 75 38 L 62 42 Z'
                      : 'M 60 22 Q 76 15 82 24 L 80 40 L 65 42 Z'
                  }
                  fill="#10b981"
                  opacity="0.8"
                />
                <circle cx="72" cy="22" r="3" fill="#34d399" />
                <path d="M 68 15 Q 76 10 82 14" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}

            {currentSign.id === 'sign-thank-you' && (
              <g className="text-emerald-400">
                <path
                  d={
                    animationStep === 0
                      ? 'M 45 28 L 55 28 L 52 38 L 45 38 Z'
                      : 'M 48 38 L 62 48 L 56 56 L 45 44 Z'
                  }
                  fill="#10b981"
                  opacity="0.85"
                />
                <path d="M 52 32 L 68 46" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}

            {currentSign.id === 'sign-hospital' && (
              <g>
                <path d="M 35 45 L 35 60 M 28 52 L 42 52" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                <path
                  d={
                    animationStep === 0
                      ? 'M 50 48 L 38 52'
                      : 'M 54 46 L 36 54'
                  }
                  stroke="#34d399"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Generic hand representation for other signs */}
            {currentSign.id !== 'sign-hello' && currentSign.id !== 'sign-thank-you' && currentSign.id !== 'sign-hospital' && (
              <g>
                <rect x="42" y="38" width="16" height="22" rx="4" fill="#10b981" opacity="0.8" />
                <circle cx="50" cy="34" r="5" fill="#34d399" />
                <path
                  d={
                    animationStep === 0
                      ? 'M 42 42 L 35 34'
                      : 'M 58 42 L 65 34'
                  }
                  stroke="#a7f3d0"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            )}
          </svg>

          {/* Movement Indicator Overlay */}
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
            <span className="font-mono text-emerald-400">
              Phase {animationStep + 1}/2: {animationStep === 0 ? 'Starting Pose' : 'Execution Stroke'}
            </span>
            <span className="text-white/70 truncate max-w-[170px]">
              {currentSign.handShape}
            </span>
          </div>
        </div>

        {/* Play / Pause Toggle Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 hover:bg-black text-white/80 hover:text-white transition"
          aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
        >
          {isPlaying ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      {/* Movement Instructions & Description */}
      <div className="mt-3 text-xs space-y-1.5">
        <div className="flex items-start gap-2 text-white/90">
          <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span><strong>Movement:</strong> {currentSign.movementDescription}</span>
        </div>
        <div className="flex items-start gap-2 text-white/75">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
          <span><strong>Gesture Hint:</strong> {currentSign.gestureHint}</span>
        </div>
      </div>

      {/* Target Language Translation for this sign */}
      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-white/60">Target Meaning:</span>
        <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">
          {currentSign.translations[targetLanguage] || currentSign.translations['en']}
        </span>
      </div>
    </div>
  );
};
