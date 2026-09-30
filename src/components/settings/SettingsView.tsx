import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sliders,
  Type,
  Vibrate,
  Volume2,
  Shield,
  Activity,
  CheckCircle,
  HelpCircle,
  Lock,
  Hand,
  Check,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile, InputMethod, OutputMethod } from '../../types';
import { ApiClient } from '../../services/api';
import { speechService } from '../../services/speech';

interface SettingsViewProps {
  user: UserProfile;
  onBack: () => void;
  onUpdateAccessibility: (settings: AccessibilitySettings) => void;
  onUpdatePreferences?: (input: InputMethod, output: OutputMethod) => Promise<void>;
  isHighContrast?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onBack,
  onUpdateAccessibility,
  onUpdatePreferences,
  isHighContrast = false,
}) => {
  const [currentInput, setCurrentInput] = useState<InputMethod>(
    user.inputMethod || user.communicationPreference || 'text'
  );
  const [currentOutput, setCurrentOutput] = useState<OutputMethod>(
    user.outputMethod || user.outputPreference || 'text'
  );
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  const [settings, setSettings] = useState<AccessibilitySettings>(
    user.accessibilitySettings || {
      highContrast: false,
      fontSize: 'normal',
      hapticFeedback: true,
      screenReaderAnnounce: true,
      darkMode: false,
    }
  );

  const [healthData, setHealthData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'communication' | 'accessibility' | 'privacy' | 'health'>('communication');

  useEffect(() => {
    ApiClient.getHealth()
      .then(setHealthData)
      .catch(console.error);
  }, []);

  const handleSelectInput = async (method: InputMethod) => {
    setCurrentInput(method);
    speechService.playTone('click');
    speechService.triggerHaptic(40);
    if (onUpdatePreferences) {
      await onUpdatePreferences(method, currentOutput);
    } else {
      await ApiClient.updatePreferences({ inputMethod: method, outputMethod: currentOutput });
    }
    setSavedStatus(`Input method updated to ${method.toUpperCase()}`);
    setTimeout(() => setSavedStatus(null), 2500);
  };

  const handleSelectOutput = async (method: OutputMethod) => {
    setCurrentOutput(method);
    speechService.playTone('click');
    speechService.triggerHaptic(40);
    if (onUpdatePreferences) {
      await onUpdatePreferences(currentInput, method);
    } else {
      await ApiClient.updatePreferences({ inputMethod: currentInput, outputMethod: method });
    }
    setSavedStatus(`Output method updated to ${method.toUpperCase()}`);
    setTimeout(() => setSavedStatus(null), 2500);
  };

  const handleToggle = (key: keyof AccessibilitySettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    onUpdateAccessibility(next);
    speechService.playTone('click');
    if (next.hapticFeedback) {
      speechService.triggerHaptic(40);
    }
    // Persist to backend
    ApiClient.updateMe({ accessibilitySettings: next }).catch(console.error);
  };

  const handleFontSizeChange = (size: 'normal' | 'large' | 'extra-large') => {
    const next = { ...settings, fontSize: size };
    setSettings(next);
    onUpdateAccessibility(next);
    speechService.playTone('click');
    ApiClient.updateMe({ accessibilitySettings: next }).catch(console.error);
  };

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${
        isHighContrast ? 'bg-black text-yellow-300' : 'bg-slate-950 text-white'
      }`}
    >
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">Settings & Preferences</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-2 border-b border-white/10 flex gap-1.5 bg-black/40 shrink-0 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('communication')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'communication'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Communication Mode
        </button>
        <button
          onClick={() => setActiveTab('accessibility')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'accessibility'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Accessibility
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'privacy'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'health'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          System Health
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {savedStatus && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{savedStatus}</span>
          </div>
        )}

        {/* COMMUNICATION MODE / INPUT & OUTPUT SETTINGS */}
        {activeTab === 'communication' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-slate-900 border border-white/10 shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Sliders className="w-4 h-4" />
                <span>Multimodal Communication Configuration</span>
              </div>
              <h2 className="text-sm font-bold text-white">Input & Output Settings</h2>
              <p className="text-xs text-white/60 leading-relaxed">
                Choose how you want to produce messages (Input) and how you want incoming responses presented (Output). Changing these immediately adapts your active communication screen.
              </p>
            </div>

            {/* INPUT METHOD SELECTION */}
            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Input Method (How You Send)
                  </h3>
                  <p className="text-[11px] text-white/60">Choose your preferred way to compose messages</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                  Current: {currentInput}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'text' as const, label: 'Text', desc: 'Type with keyboard', icon: Type },
                  { id: 'voice' as const, label: 'Voice', desc: 'Speak via microphone', icon: Volume2 },
                  { id: 'sign' as const, label: 'Sign', desc: 'Sign gesture camera', icon: Hand },
                ].map(opt => {
                  const Icon = opt.icon;
                  const isSelected = currentInput === opt.id || (opt.id === 'sign' && currentInput === 'gesture');
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectInput(opt.id)}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? isHighContrast
                            ? 'bg-yellow-400 text-black border-yellow-400 font-black'
                            : 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-0.5" />
                      <div className="text-xs font-bold flex items-center gap-1">
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                      </div>
                      <span className="text-[10px] opacity-75">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OUTPUT METHOD SELECTION */}
            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Output Method (How You Receive)
                  </h3>
                  <p className="text-[11px] text-white/60">Choose your preferred response format</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold uppercase">
                  Current: {currentOutput}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'text' as const, label: 'Text', desc: 'Visual translated text', icon: Type },
                  { id: 'voice' as const, label: 'Voice', desc: 'Text-to-speech audio', icon: Volume2 },
                  { id: 'sign' as const, label: 'Sign', desc: 'Animated sign cards', icon: Hand },
                ].map(opt => {
                  const Icon = opt.icon;
                  const isSelected = currentOutput === opt.id || (opt.id === 'sign' && currentOutput === 'gesture');
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOutput(opt.id)}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? isHighContrast
                            ? 'bg-yellow-400 text-black border-yellow-400 font-black'
                            : 'bg-sky-600 border-sky-500 text-white shadow-lg'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-0.5" />
                      <div className="text-xs font-bold flex items-center gap-1">
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                      </div>
                      <span className="text-[10px] opacity-75">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Saved indicator note */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-white/60 text-center">
              ✓ Preferences are persisted immediately to your profile and automatically loaded on app startup.
            </div>
          </div>
        )}
        {activeTab === 'accessibility' && (
          <div className="space-y-3">
            {/* High Contrast Mode */}
            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">High Contrast Mode</h3>
                <p className="text-[11px] text-white/60">
                  Black and high-visibility yellow theme for enhanced visual legibility
                </p>
              </div>
              <button
                onClick={() => handleToggle('highContrast')}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  settings.highContrast ? 'bg-yellow-400' : 'bg-white/20'
                }`}
                aria-label="Toggle high contrast"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 absolute top-1 transition-transform ${
                    settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Font Size Scaling */}
            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-2">
              <div>
                <h3 className="text-xs font-bold text-white">Text Size Scaling</h3>
                <p className="text-[11px] text-white/60">Adjust readability across all communication screens</p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(['normal', 'large', 'extra-large'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => handleFontSizeChange(size)}
                    className={`py-2 px-3 rounded-xl border text-xs capitalize font-semibold transition ${
                      settings.fontSize === size
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {size.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Haptic Feedback */}
            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">Haptic Vibration</h3>
                <p className="text-[11px] text-white/60">
                  Vibrates device on recognition lock, message receipt, and actions
                </p>
              </div>
              <button
                onClick={() => handleToggle('hapticFeedback')}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  settings.hapticFeedback ? 'bg-emerald-500' : 'bg-white/20'
                }`}
                aria-label="Toggle haptic feedback"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 absolute top-1 transition-transform ${
                    settings.hapticFeedback ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Screen Reader Speech Cues */}
            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">Audio Tones & Cues</h3>
                <p className="text-[11px] text-white/60">
                  Plays audible chimes on message transmission and state changes
                </p>
              </div>
              <button
                onClick={() => handleToggle('screenReaderAnnounce')}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  settings.screenReaderAnnounce ? 'bg-emerald-500' : 'bg-white/20'
                }`}
                aria-label="Toggle audio cues"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 absolute top-1 transition-transform ${
                    settings.screenReaderAnnounce ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3 text-xs leading-relaxed">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Shield className="w-4 h-4" />
              <span>Voice2Sense Privacy & Data Policy</span>
            </div>

            <p className="text-white/80">
              <strong>1. Microphone & Camera Usage:</strong> The camera and microphone are utilized strictly in real-time during your active communication session for speech transcription and gesture recognition.
            </p>

            <p className="text-white/80">
              <strong>2. Zero Permanent Media Retention:</strong> Raw video frames and raw audio streams are processed in-memory and are <em>never</em> permanently stored on remote storage or disk.
            </p>

            <p className="text-white/80">
              <strong>3. Secure Relational Persistence:</strong> Your conversation text and translations are securely stored in your private database account protected by password hashing (BCrypt) and JWT authorization.
            </p>

            <p className="text-white/80">
              <strong>4. User Data Erasure:</strong> You retain complete control to delete any individual conversation, clear message histories, or permanently delete your account at any time via the User Profile screen.
            </p>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Backend Actuator Status</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                {healthData?.status || 'UP'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-white/70">
                <span>Database Engine:</span>
                <span className="font-mono text-white">PostgreSQL Compatible</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Total Stored Users:</span>
                <span className="font-mono text-white">{healthData?.database?.userCount || 1}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Active Conversations:</span>
                <span className="font-mono text-white">{healthData?.database?.conversationCount || 0}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Translation Provider:</span>
                <span className="font-mono text-emerald-400">
                  {healthData?.translationService?.provider || 'Google Gemini 3.8 Flash + Lexical'}
                </span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Sign Vocabulary Count:</span>
                <span className="font-mono text-white">
                  {healthData?.gestureRecognition?.vocabularyCount || 16} signs
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
