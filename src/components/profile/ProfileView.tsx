import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Globe, Hand, Volume2, Save, Trash2, Shield, LogOut } from 'lucide-react';
import { UserProfile, SupportedLanguageCode, InputMethod, OutputMethod } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/signVocabulary';
import { ApiClient } from '../../services/api';
import { speechService } from '../../services/speech';

interface ProfileViewProps {
  user: UserProfile;
  onBack: () => void;
  onUpdateUser: (user: UserProfile) => void;
  onUpdatePreferences?: (input: InputMethod, output: OutputMethod) => Promise<void>;
  onLogout: () => void;
  isHighContrast?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onBack,
  onUpdateUser,
  onUpdatePreferences,
  onLogout,
  isHighContrast = false,
}) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [preferredLanguage, setPreferredLanguage] = useState<SupportedLanguageCode>(user.preferredLanguage);
  const [communicationPreference, setCommunicationPreference] = useState<InputMethod>(
    (user.inputMethod || user.communicationPreference || 'text').replace('gesture', 'sign') as InputMethod
  );
  const [outputPreference, setOutputPreference] = useState<OutputMethod>(
    (user.outputMethod || user.outputPreference || 'text').replace('gesture', 'sign') as OutputMethod
  );
  const [voicePitch, setVoicePitch] = useState(user.voicePitch || 1.0);
  const [voiceSpeed, setVoiceSpeed] = useState(user.voiceSpeed || 1.0);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      speechService.playTone('click');
      const res = await ApiClient.updateMe({
        fullName,
        preferredLanguage,
        communicationPreference,
        outputPreference,
        inputMethod: communicationPreference,
        outputMethod: outputPreference,
        voicePitch,
        voiceSpeed,
      });

      if (onUpdatePreferences) {
        await onUpdatePreferences(communicationPreference, outputPreference);
      }

      onUpdateUser(res.user);
      setStatusMsg('Profile and communication preferences updated successfully.');
      speechService.playTone('success');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account and all associated communication history? This action cannot be undone.')) {
      try {
        await ApiClient.deleteAccount();
        onLogout();
      } catch (err: any) {
        alert(err.message || 'Failed to delete account');
      }
    }
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
          <h1 className="text-base font-bold">User Profile & Preferences</h1>
        </div>

        <button
          onClick={onLogout}
          className="text-xs px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold flex items-center gap-1.5 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {statusMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
            {statusMsg}
          </div>
        )}

        {/* User Card */}
        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 overflow-hidden flex items-center justify-center font-bold text-lg text-emerald-400">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              user.fullName.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{user.fullName}</h2>
            <p className="text-xs text-white/60 truncate">{user.email}</p>
            <span className="text-[10px] text-emerald-400 font-mono">Verified Accessibility Account</span>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Preferred Spoken / Native Language */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">
            Default Preferred Language
          </label>
          <select
            value={preferredLanguage}
            onChange={e => setPreferredLanguage(e.target.value as SupportedLanguageCode)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                {l.name} ({l.nativeName})
              </option>
            ))}
          </select>
        </div>

        {/* Default Communication Preference */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">
            Preferred Input Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'text' as const, label: 'Text', icon: Mail },
              { id: 'voice' as const, label: 'Voice', icon: Volume2 },
              { id: 'sign' as const, label: 'Sign', icon: Hand },
            ].map(item => {
              const Icon = item.icon;
              const isSelected = communicationPreference === item.id || (item.id === 'sign' && communicationPreference === 'gesture');
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setCommunicationPreference(item.id)}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Output Preference */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">
            Preferred Output Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'text' as const, label: 'Text', icon: Mail },
              { id: 'voice' as const, label: 'Voice', icon: Volume2 },
              { id: 'sign' as const, label: 'Sign', icon: Hand },
            ].map(item => {
              const Icon = item.icon;
              const isSelected = outputPreference === item.id || (item.id === 'sign' && outputPreference === 'gesture');
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setOutputPreference(item.id)}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-sky-600 border-sky-500 text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice Parameters */}
        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
          <h3 className="text-xs font-bold text-white">Voice & Speech Synthesis Tuning</h3>
          <div>
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>Speech Rate (Speed)</span>
              <span>{voiceSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={voiceSpeed}
              onChange={e => setVoiceSpeed(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>Voice Pitch</span>
              <span>{voicePitch}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={voicePitch}
              onChange={e => setVoicePitch(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Profile Preferences'}</span>
        </button>

        {/* Account Deletion per Section 27 */}
        <div className="pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account & Erase All Data</span>
          </button>
        </div>
      </form>
    </div>
  );
};
