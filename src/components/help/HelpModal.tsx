import React from 'react';
import { X, Mic, Hand, Type, Globe, Check, Sparkles, BookOpen } from 'lucide-react';
import { speechService } from '../../services/speech';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHighContrast?: boolean;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, isHighContrast = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border ${
          isHighContrast
            ? 'bg-black text-yellow-300 border-yellow-400'
            : 'bg-slate-900 text-white border-slate-800'
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Voice2Sense Guide & Onboarding</h2>
          </div>
          <button
            onClick={() => {
              speechService.playTone('click');
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed scrollbar-thin">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-white">
            <h3 className="text-sm font-bold text-emerald-400 mb-1">
              "Communicate through your preferred language and method."
            </h3>
            <p className="text-white/80">
              Voice2Sense bridges barriers between spoken language, text, and sign language gestures for users with hearing, speech, or language differences.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">
              How The 3 Input Methods Work:
            </h4>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block">1. Voice Input (Microphone):</strong>
                <span className="text-white/70">
                  Tap the microphone button and speak in English, Tamil, Telugu, or Hindi. Speech is recognized and converted to text automatically.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block">2. Text Input:</strong>
                <span className="text-white/70">
                  Type your message or tap common accessibility phrases (e.g. "Where is the hospital?", "I need water").
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Hand className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block">3. Sign / Gesture Camera:</strong>
                <span className="text-white/70">
                  Hold your hand inside the camera silhouette guide. Supported signs (Hello, Thank you, Hospital, Doctor, Help, Water, Food, Emergency) are recognized in real time!
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-sky-400">
              The 3 Output Formats:
            </h4>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 space-y-1">
              <div><strong>• Text:</strong> Appears in native script (Tamil, Telugu, Hindi, or English).</div>
              <div><strong>• Voice:</strong> Synthesizes real speech in the target language with play/pause controls.</div>
              <div><strong>• Gesture:</strong> Renders animated sign language cards showing exact hand poses and motion arrows.</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 text-white/80">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Smart Mode:</strong> In two-way conversations, Voice2Sense remembers each participant's preference and automatically adapts translations bidirectionally.
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-slate-900">
          <button
            onClick={() => {
              speechService.playTone('click');
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
          >
            Got It, Let's Communicate
          </button>
        </div>
      </div>
    </div>
  );
};
