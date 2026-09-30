import React, { useState } from 'react';
import { X, Search, Volume2, Camera, ShieldAlert, Heart, Users, Compass, BookOpen } from 'lucide-react';
import { SignVocabularyItem, SupportedLanguageCode } from '../../types';
import { SIGN_VOCABULARY, SUPPORTED_LANGUAGES } from '../../data/signVocabulary';
import { speechService } from '../../services/speech';

interface SignVocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSignForConversation?: (sign: SignVocabularyItem) => void;
  onOpenPracticeCamera?: (signId: string) => void;
  currentLanguage: SupportedLanguageCode;
  isHighContrast?: boolean;
}

export const SignVocabularyModal: React.FC<SignVocabularyModalProps> = ({
  isOpen,
  onClose,
  onSelectSignForConversation,
  onOpenPracticeCamera,
  currentLanguage,
  isHighContrast = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeLang, setActiveLang] = useState<SupportedLanguageCode>(currentLanguage);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Signs', icon: BookOpen },
    { id: 'emergency', label: 'Emergency', icon: ShieldAlert },
    { id: 'healthcare', label: 'Healthcare', icon: Heart },
    { id: 'social', label: 'Social & Greetings', icon: Users },
    { id: 'basic', label: 'Basic Needs', icon: Compass },
  ];

  const filteredSigns = SIGN_VOCABULARY.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.gestureHint.toLowerCase().includes(query) ||
      Object.values(item.translations).some(t => t.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const handleSpeakWord = (word: string, lang: SupportedLanguageCode) => {
    speechService.playTone('click');
    speechService.speak(word, lang);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border ${
          isHighContrast
            ? 'bg-black text-yellow-300 border-yellow-400'
            : 'bg-slate-900 text-white border-slate-800'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Sign Vocabulary Library</h2>
              <p className="text-xs text-white/60">
                Supported Gesture & Sign Language Representations ({SIGN_VOCABULARY.length} Signs)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
            aria-label="Close library"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Language Bar */}
        <div className="p-3 border-b border-white/10 space-y-2.5 bg-black/30">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search sign, phrase, or translation..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Translation View Target Language */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-white/60">Display Language:</span>
            <div className="flex gap-1">
              {SUPPORTED_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setActiveLang(lang.code)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    activeLang === lang.code
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {lang.nativeName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Signs Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {filteredSigns.length === 0 ? (
            <div className="text-center py-12 text-white/50 text-xs">
              No signs found matching "{searchQuery}".
            </div>
          ) : (
            filteredSigns.map(sign => (
              <div
                key={sign.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{sign.name}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        {sign.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-emerald-300">
                        {sign.translations[activeLang] || sign.translations['en']}
                      </span>
                      <button
                        onClick={() => handleSpeakWord(sign.translations[activeLang] || sign.translations['en'], activeLang)}
                        className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                        title="Listen pronunciation"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenPracticeCamera && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenPracticeCamera(sign.id);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-medium flex items-center gap-1 transition"
                        title="Practice with camera"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera</span>
                      </button>
                    )}

                    {onSelectSignForConversation && (
                      <button
                        onClick={() => {
                          onSelectSignForConversation(sign);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                      >
                        Use Sign
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-black/40 p-2.5 rounded-xl">
                  <div>
                    <span className="text-white/50 block text-[10px] uppercase">Hand Shape</span>
                    <span className="text-white/90 font-medium">{sign.handShape}</span>
                  </div>
                  <div>
                    <span className="text-white/50 block text-[10px] uppercase">Movement</span>
                    <span className="text-white/90 font-medium">{sign.movementDescription}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
