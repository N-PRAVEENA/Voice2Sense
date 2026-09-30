import React, { useState, useEffect } from 'react';
import {
  MessageSquarePlus,
  Clock,
  Settings,
  User,
  Sliders,
  HelpCircle,
  Shield,
  Hand,
  Volume2,
  Type,
  Search,
  Trash2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Conversation, SupportedLanguageCode, InputMethod, OutputMethod, UserProfile } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/signVocabulary';
import { ApiClient } from '../../services/api';
import { speechService } from '../../services/speech';
import { CommunicationModeCard } from '../common/CommunicationModeCard';

interface DashboardViewProps {
  user: UserProfile;
  onSelectConversation: (id: string) => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenVocabulary: () => void;
  onOpenCommunicationMode?: () => void;
  onUpdatePreferences?: (input: InputMethod, output: OutputMethod) => Promise<void>;
  isHighContrast?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onSelectConversation,
  onOpenProfile,
  onOpenSettings,
  onOpenHelp,
  onOpenVocabulary,
  onOpenCommunicationMode,
  onUpdatePreferences,
  isHighContrast = false,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingModal, setIsCreatingModal] = useState(false);

  // New conversation form state
  const [newTitle, setNewTitle] = useState('');
  const [personAName, setPersonAName] = useState(user.fullName || 'Sender');
  const [personAInput, setPersonAInput] = useState<InputMethod>(user.inputMethod || user.communicationPreference || 'text');
  const [personALang, setPersonALang] = useState<SupportedLanguageCode>(user.preferredLanguage || 'en');

  const [personBName, setPersonBName] = useState('Receiver');
  const [personBOutput, setPersonBOutput] = useState<OutputMethod>(user.outputMethod || user.outputPreference || 'text');
  const [personBLang, setPersonBLang] = useState<SupportedLanguageCode>('ta');
  const [smartMode, setSmartMode] = useState(true);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const list = await ApiClient.getConversations();
      setConversations(list);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      speechService.playTone('click');
      const conv = await ApiClient.createConversation({
        title: newTitle.trim() || `Conversation with ${personBName}`,
        personA: {
          name: personAName,
          inputMethod: personAInput,
          language: personALang,
        },
        personB: {
          name: personBName,
          outputMethod: personBOutput,
          language: personBLang,
        },
        smartMode,
      });

      setIsCreatingModal(false);
      onSelectConversation(conv.id);
    } catch (err: any) {
      console.error('Error creating conversation:', err);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      speechService.playTone('alert');
      await ApiClient.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${
        isHighContrast ? 'bg-black text-yellow-300' : 'bg-slate-950 text-white'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg">
            V2S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold">Voice2Sense</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                Universal Accessibility
              </span>
            </div>
            <p className="text-xs text-white/60">
              Multimodal Communication (Voice ↔ Text ↔ Sign)
            </p>
          </div>
        </div>

        <button
          onClick={onOpenProfile}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/10 overflow-hidden hover:ring-2 hover:ring-emerald-400 transition"
          aria-label="User Profile"
        >
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold">
              {user.fullName.charAt(0)}
            </div>
          )}
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* Clearly Visible Communication Mode / Input & Output Settings Section */}
        <CommunicationModeCard
          inputMethod={user.inputMethod || user.communicationPreference || 'text'}
          outputMethod={user.outputMethod || user.outputPreference || 'text'}
          onChangePreferences={async (inMethod, outMethod) => {
            if (onUpdatePreferences) {
              await onUpdatePreferences(inMethod, outMethod);
            }
          }}
          onOpenDetailedSettings={onOpenCommunicationMode}
          isHighContrast={isHighContrast}
        />

        {/* Quick Multimodal Action Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Smart Multimodal Mode Active</span>
            </div>
            <h2 className="text-base font-bold text-white">Start Two-Way Accessibility Conversation</h2>
            <p className="text-xs text-white/70 max-w-sm">
              Sender speaks or gestures in one language; Receiver reads or hears in their preferred format and language.
            </p>
          </div>

          <button
            onClick={() => {
              speechService.playTone('click');
              setIsCreatingModal(true);
            }}
            className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Quick Accessibility Features Hub */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={onOpenVocabulary}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-left flex flex-col justify-between"
          >
            <Hand className="w-5 h-5 text-emerald-400 mb-2" />
            <div>
              <div className="text-xs font-bold text-white">Sign Glossary</div>
              <div className="text-[10px] text-white/50">16+ Signs Dictionary</div>
            </div>
          </button>

          <button
            onClick={() => {
              speechService.playTone('click');
              setIsCreatingModal(true);
            }}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-left flex flex-col justify-between"
          >
            <Volume2 className="w-5 h-5 text-sky-400 mb-2" />
            <div>
              <div className="text-xs font-bold text-white">Voice & Speech</div>
              <div className="text-[10px] text-white/50">Speech-To-Text / TTS</div>
            </div>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-left flex flex-col justify-between"
          >
            <Sliders className="w-5 h-5 text-amber-400 mb-2" />
            <div>
              <div className="text-xs font-bold text-white">Accessibility</div>
              <div className="text-[10px] text-white/50">High Contrast & Fonts</div>
            </div>
          </button>

          <button
            onClick={onOpenHelp}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-left flex flex-col justify-between"
          >
            <HelpCircle className="w-5 h-5 text-purple-400 mb-2" />
            <div>
              <div className="text-xs font-bold text-white">User Guide</div>
              <div className="text-[10px] text-white/50">Help & Instructions</div>
            </div>
          </button>
        </div>

        {/* Recent Conversations Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Recent Conversations</h2>
            </div>

            <button
              onClick={fetchConversations}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversation title..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Conversations list */}
          {isLoading ? (
            <div className="p-8 text-center text-xs text-white/50">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/50 bg-white/5 rounded-3xl border border-white/10">
              No conversations found. Tap "New Conversation" above to start.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => {
                    speechService.playTone('click');
                    onSelectConversation(conv.id);
                  }}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white truncate">{conv.title}</h3>
                      {conv.smartMode && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold shrink-0">
                          Smart
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-white/50 mt-1">
                      <span>{conv.personA.name} ({conv.personA.language.toUpperCase()})</span>
                      <span>↔</span>
                      <span>{conv.personB.name} ({conv.personB.language.toUpperCase()})</span>
                    </div>

                    {conv.lastMessage && (
                      <div className="text-xs text-emerald-400/90 truncate mt-1">
                        {conv.lastMessage.senderName}: "{conv.lastMessage.content}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => handleDeleteConversation(conv.id, e)}
                      className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete conversation"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-emerald-400 transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border ${
              isHighContrast
                ? 'bg-black text-yellow-300 border-yellow-400'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-base font-bold">New Multimodal Conversation</h2>
              <button
                onClick={() => setIsCreatingModal(false)}
                className="text-white/60 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateConversation} className="p-4 space-y-4 overflow-y-auto scrollbar-thin">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  Conversation Title / Topic
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Hospital & Healthcare Assistance"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Person A (Sender) Setup */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">Person A (Sender)</span>
                  <span className="text-[10px] text-white/40 font-mono">Initiator</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-white/60 mb-0.5">Input Method</label>
                    <select
                      value={personAInput}
                      onChange={e => setPersonAInput(e.target.value as InputMethod)}
                      className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-1.5 text-xs focus:outline-none"
                    >
                      <option value="voice">Voice (Microphone)</option>
                      <option value="text">Text (Typing)</option>
                      <option value="gesture">Sign / Gesture (Camera)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/60 mb-0.5">Language</label>
                    <select
                      value={personALang}
                      onChange={e => setPersonALang(e.target.value as SupportedLanguageCode)}
                      className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-1.5 text-xs focus:outline-none"
                    >
                      {SUPPORTED_LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>
                          {l.name} ({l.nativeName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Person B (Receiver) Setup */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400">Person B (Receiver)</span>
                  <span className="text-[10px] text-white/40 font-mono">Recipient</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-white/60 mb-0.5">Output Method</label>
                    <select
                      value={personBOutput}
                      onChange={e => setPersonBOutput(e.target.value as OutputMethod)}
                      className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-1.5 text-xs focus:outline-none"
                    >
                      <option value="text">Text (Visual)</option>
                      <option value="voice">Voice (Audio Speech)</option>
                      <option value="gesture">Sign Language (Visual)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/60 mb-0.5">Language</label>
                    <select
                      value={personBLang}
                      onChange={e => setPersonBLang(e.target.value as SupportedLanguageCode)}
                      className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-1.5 text-xs focus:outline-none"
                    >
                      {SUPPORTED_LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>
                          {l.name} ({l.nativeName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Smart Mode Checkbox */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smartMode}
                  onChange={e => setSmartMode(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-400 h-4 w-4 bg-slate-900 border-white/20"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Smart Communication Mode</span>
                  <span className="text-[10px] text-white/60 block">
                    Automatically alternates & adapts reverse translations for bidirectional conversation
                  </span>
                </div>
              </label>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg mt-2"
              >
                <span>Launch Conversation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
