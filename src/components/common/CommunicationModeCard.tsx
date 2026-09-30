import React from 'react';
import { Type, Mic, Hand, Volume2, ArrowRight, Sliders, Check } from 'lucide-react';
import { InputMethod, OutputMethod } from '../../types';
import { speechService } from '../../services/speech';

interface CommunicationModeCardProps {
  inputMethod: InputMethod;
  outputMethod: OutputMethod;
  onChangePreferences: (input: InputMethod, output: OutputMethod) => Promise<void>;
  onOpenDetailedSettings?: () => void;
  isHighContrast?: boolean;
}

export const CommunicationModeCard: React.FC<CommunicationModeCardProps> = ({
  inputMethod,
  outputMethod,
  onChangePreferences,
  onOpenDetailedSettings,
  isHighContrast = false,
}) => {
  const normInput: 'text' | 'voice' | 'sign' =
    inputMethod === 'gesture' ? 'sign' : (inputMethod as 'text' | 'voice' | 'sign') || 'text';
  const normOutput: 'text' | 'voice' | 'sign' =
    outputMethod === 'gesture' ? 'sign' : (outputMethod as 'text' | 'voice' | 'sign') || 'text';

  const handleSetInput = (val: 'text' | 'voice' | 'sign') => {
    speechService.playTone('click');
    speechService.triggerHaptic(40);
    onChangePreferences(val, normOutput);
  };

  const handleSetOutput = (val: 'text' | 'voice' | 'sign') => {
    speechService.playTone('click');
    speechService.triggerHaptic(40);
    onChangePreferences(normInput, val);
  };

  return (
    <div
      className={`p-4 rounded-3xl border transition-all shadow-lg ${
        isHighContrast
          ? 'bg-black text-yellow-300 border-yellow-400'
          : 'bg-slate-900/90 text-white border-white/10'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Communication Mode Settings
            </h3>
            <p className="text-[11px] text-white/60">
              Active: <span className="text-emerald-400 font-bold capitalize">{normInput} Input</span> ➔{' '}
              <span className="text-sky-400 font-bold capitalize">{normOutput} Output</span>
            </p>
          </div>
        </div>

        {onOpenDetailedSettings && (
          <button
            onClick={onOpenDetailedSettings}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 font-semibold transition"
          >
            Configure
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* INPUT METHOD SELECTOR */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 mb-1.5">
            <span>INPUT METHOD (How you send):</span>
            <span className="font-mono text-[10px] text-white/50 capitalize">Currently: {normInput}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'text' as const, label: 'Text', icon: Type },
              { id: 'voice' as const, label: 'Voice', icon: Mic },
              { id: 'sign' as const, label: 'Sign', icon: Hand },
            ].map(opt => {
              const Icon = opt.icon;
              const isSelected = normInput === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSetInput(opt.id)}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    isSelected
                      ? isHighContrast
                        ? 'bg-yellow-400 text-black border-yellow-400 font-black'
                        : 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* OUTPUT METHOD SELECTOR */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-sky-400 mb-1.5">
            <span>OUTPUT METHOD (How you receive):</span>
            <span className="font-mono text-[10px] text-white/50 capitalize">Currently: {normOutput}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'text' as const, label: 'Text', icon: Type },
              { id: 'voice' as const, label: 'Voice', icon: Volume2 },
              { id: 'sign' as const, label: 'Sign', icon: Hand },
            ].map(opt => {
              const Icon = opt.icon;
              const isSelected = normOutput === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSetOutput(opt.id)}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    isSelected
                      ? isHighContrast
                        ? 'bg-yellow-400 text-black border-yellow-400 font-black'
                        : 'bg-sky-600 border-sky-500 text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
