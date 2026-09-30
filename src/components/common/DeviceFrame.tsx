import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, Battery, Eye, Sun, Moon, Volume2 } from 'lucide-react';
import { AccessibilitySettings } from '../../types';

interface DeviceFrameProps {
  children: React.ReactNode;
  accessibilitySettings: AccessibilitySettings;
  onToggleHighContrast: () => void;
  onCycleFontSize: () => void;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  accessibilitySettings,
  onToggleHighContrast,
  onCycleFontSize,
}) => {
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const fontSizeClass =
    accessibilitySettings.fontSize === 'extra-large'
      ? 'text-lg'
      : accessibilitySettings.fontSize === 'large'
      ? 'text-base'
      : 'text-sm';

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-0 sm:p-4 select-none ${
        accessibilitySettings.highContrast
          ? 'bg-black text-yellow-300'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Accessibility & Frame Switcher Bar */}
      <header className="w-full max-w-md px-4 py-2 flex items-center justify-between text-xs border-b border-white/10 sm:border-0 mb-1 z-20">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-400">Voice2Sense Mobile</span>
          <span className="text-[10px] text-white/50 hidden sm:inline">• Android Studio App</span>
        </div>

        <div className="flex items-center gap-2">
          {/* High Contrast Toggle */}
          <button
            onClick={onToggleHighContrast}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
              accessibilitySettings.highContrast
                ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-bold'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
            }`}
            title="Toggle High Contrast"
            aria-label="Toggle High Contrast"
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">Contrast</span>
          </button>

          {/* Font Size Cycle */}
          <button
            onClick={onCycleFontSize}
            className="p-1.5 px-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white text-[11px] font-mono transition"
            title="Cycle Font Size"
            aria-label="Cycle Font Size"
          >
            A{accessibilitySettings.fontSize === 'extra-large' ? '++' : accessibilitySettings.fontSize === 'large' ? '+' : ''}
          </button>

          {/* Device Frame Toggle */}
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white transition"
            title={isMobileFrame ? 'Expand to Fullscreen' : 'Show Mobile Frame'}
            aria-label="Toggle frame"
          >
            {isMobileFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 flex flex-col overflow-hidden ${
          isMobileFrame
            ? 'max-w-[420px] h-[100dvh] sm:h-[840px] sm:rounded-[44px] sm:border-[8px] sm:border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.8)] relative bg-slate-950'
            : 'max-w-2xl h-[100dvh] sm:h-[860px] rounded-3xl border border-white/10 bg-slate-950 shadow-2xl relative'
        } ${accessibilitySettings.highContrast ? 'border-yellow-400' : ''}`}
      >
        {/* Android Native Status Bar */}
        <div className="h-8 bg-slate-950 px-6 flex items-center justify-between text-[11px] font-medium tracking-tight text-white/80 shrink-0 z-30 select-none">
          <span>{currentTime}</span>

          {/* Camera Punch Hole */}
          {isMobileFrame && (
            <div className="w-4 h-4 rounded-full bg-black border border-slate-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-white/70" />
            <span className="text-[10px] font-semibold">5G</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Dynamic App Content Body */}
        <main className={`flex-1 overflow-hidden flex flex-col ${fontSizeClass}`}>
          {children}
        </main>

        {/* Android Gesture Bar */}
        {isMobileFrame && (
          <div className="h-4 bg-slate-950 flex items-center justify-center shrink-0 z-20">
            <div className="w-32 h-1 rounded-full bg-white/30" />
          </div>
        )}
      </div>
    </div>
  );
};
