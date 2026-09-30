import React from 'react';
import { X, Type, Mic, Hand, Volume2, CheckCircle2, ArrowRight } from 'lucide-react';
import { InputMethod, OutputMethod } from '../../types';
import { speechService } from '../../services/speech';

interface CommunicationModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInput: InputMethod;
  currentOutput: OutputMethod;
  onSavePreferences: (inputMethod: InputMethod, outputMethod: OutputMethod) => Promise<void>;
  isHighContrast?: boolean;
}

export const CommunicationModeModal: React.FC<CommunicationModeModalProps> = ({
  isOpen,
  onClose,
  currentInput,
  currentOutput,
  onSavePreferences,
  isHighContrast = false,
}) => {
  if (!isOpen) return null;

  const normalizedInput: 'text' | 'voice' | 'sign' =
    currentInput === 'gesture' ? 'sign' : (currentInput as 'text' | 'voice' | 'sign') || 'text';
  const normalizedOutput: 'text' | 'voice' | 'sign' =
    currentOutput === 'gesture' ? 'sign' : (currentOutput as 'text' | 'voice' | 'sign') || 'text';

  const handleSelectInput = async (method: 'text' | 'voice' | 'sign') => {
    speechService.playTone('click');
    speechService.triggerHaptic(40);
    await onSavePreferences(method, normalizedOutput);
  };

  const handleSelectOutput = async (method: 'text' | 'voice' | 'sign') => {
    speechService.playTone('click');
    speechService.triggerHaptic(40);
    await onSavePreferences(normalizedInput, method);
  };

  const inputOptions: { id: 'text' | 'voice' | 'sign'; label: string; desc: string; icon: any }[] = [
    {
      id: 'text',
      label: 'Text',
      desc: 'Type messages with keyboard & quick phrases',
      icon: Type,
    },
    {
      id: 'voice',
      label: 'Voice',
      desc: 'Speak using real-time microphone recognition',
      icon: Mic,
    },
    {
      id: 'sign',
      label: 'Sign',
      desc: 'Sign language gesture detection via camera',
      icon: Hand,
    },
  ];

  const outputOptions: { id: 'text' | 'voice' | 'sign'; label: string; desc: string; icon: any }[] = [
    {
      id: 'text',
      label: 'Text',
      desc: 'Visual readable text in target native script',
      icon: Type,
    },
    {
      id: 'voice',
      label: 'Voice',
      desc: 'Spoken audio output via Text-to-Speech synthesis',
      icon: Volume2,
    },
    {
      id: 'sign',
      label: 'Sign',
      desc: 'Visual animated sign language representations',
      icon: Hand,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border ${
          isHighContrast
            ? 'bg-black text-yellow-300 border-yellow-400'
            : 'bg-slate-900 text-white border-slate-800'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Communication Mode Settings</h2>
            <p className="text-xs text-white/60">Configure your Input & Output methods</p>
          </div>
          <button
            onClick={() => {
              speechService.playTone('click');
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          {/* Active Mode Summary Chip */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/60">Active Communication Route:</span>
            <div className="flex items-center gap-1.5 font-bold font-mono text-emerald-400">
              <span className="capitalize">{normalizedInput}</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/40" />
              <span className="capitalize">{normalizedOutput}</span>
            </div>
          </div>

          {/* INPUT METHOD SELECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                1. Select Input Method (How you communicate)
              </span>
            </div>
            <div className="space-y-2">
              {inputOptions.map(opt => {
                const Icon = opt.icon;
                const isSelected = normalizedInput === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectInput(opt.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? isHighContrast
                          ? 'bg-yellow-400 text-black border-yellow-400 font-bold'
                          : 'bg-emerald-600/30 border-emerald-500 text-white shadow-lg'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-white/10 text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>{opt.label}</span>
                          {isSelected && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-white/60 mt-0.5">{opt.desc}</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* OUTPUT METHOD SELECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                2. Select Output Method (How you receive responses)
              </span>
            </div>
            <div className="space-y-2">
              {outputOptions.map(opt => {
                const Icon = opt.icon;
                const isSelected = normalizedOutput === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOutput(opt.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? isHighContrast
                          ? 'bg-yellow-400 text-black border-yellow-400 font-bold'
                          : 'bg-sky-600/30 border-sky-500 text-white shadow-lg'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-white/10 text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>{opt.label}</span>
                          {isSelected && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/30 text-sky-300">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-white/60 mt-0.5">{opt.desc}</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900 flex items-center justify-between">
          <span className="text-[11px] text-white/60">Changes are saved automatically</span>
          <button
            onClick={() => {
              speechService.playTone('success');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
