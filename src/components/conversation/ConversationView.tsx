import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Camera,
  Volume2,
  VolumeX,
  RotateCw,
  Sparkles,
  Settings,
  Trash2,
  MoreVertical,
  Hand,
  Type,
  AudioWaveform,
  Globe,
  CheckCheck,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  Conversation,
  Message,
  SupportedLanguageCode,
  InputMethod,
  OutputMethod,
  SignVocabularyItem,
} from '../../types';
import { SUPPORTED_LANGUAGES, QUICK_ACCESSIBILITY_PHRASES } from '../../data/signVocabulary';
import { ApiClient } from '../../services/api';
import { speechService } from '../../services/speech';
import { SignDisplayCard } from './SignDisplayCard';
import { GestureCameraModal } from '../camera/GestureCameraModal';
import { SignVocabularyModal } from '../vocabulary/SignVocabularyModal';

interface ConversationViewProps {
  conversationId: string;
  onBack: () => void;
  currentUserPreferences?: {
    inputMethod: InputMethod;
    outputMethod: OutputMethod;
  };
  onUpdatePreferences?: (input: InputMethod, output: OutputMethod) => Promise<void>;
  onOpenCommunicationMode?: () => void;
  isHighContrast?: boolean;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversationId,
  onBack,
  currentUserPreferences,
  onUpdatePreferences,
  onOpenCommunicationMode,
  isHighContrast = false,
}) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Active Person: either person A or person B
  const [activeSender, setActiveSender] = useState<'personA' | 'personB'>('personA');
  const [currentInputMethod, setCurrentInputMethod] = useState<InputMethod>(
    currentUserPreferences?.inputMethod || 'text'
  );
  const [currentOutputMethod, setCurrentOutputMethod] = useState<OutputMethod>(
    currentUserPreferences?.outputMethod || 'text'
  );
  const [sourceLang, setSourceLang] = useState<SupportedLanguageCode>('en');
  const [targetLang, setTargetLang] = useState<SupportedLanguageCode>('ta');

  // Modals
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ttsPlayingId, setTtsPlayingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load conversation & messages
  const fetchConversationData = async () => {
    try {
      setIsLoading(true);
      const data = await ApiClient.getConversation(conversationId);
      setConversation(data.conversation);
      setMessages(data.messages || []);

      // Synchronize input/output methods according to active sender and user preferences
      if (activeSender === 'personA') {
        const inM = (currentUserPreferences?.inputMethod || data.conversation.personA.inputMethod || 'text').replace('gesture', 'sign') as InputMethod;
        const outM = (currentUserPreferences?.outputMethod || data.conversation.personB.outputMethod || 'text').replace('gesture', 'sign') as OutputMethod;
        setCurrentInputMethod(inM);
        setCurrentOutputMethod(outM);
        setSourceLang(data.conversation.personA.language || 'en');
        setTargetLang(data.conversation.personB.language || 'ta');
      } else {
        const inM = (data.conversation.personB.outputMethod === 'voice' ? 'voice' : 'text') as InputMethod;
        const outM = (data.conversation.personA.inputMethod === 'voice' ? 'voice' : 'text') as OutputMethod;
        setCurrentInputMethod(inM);
        setCurrentOutputMethod(outM);
        setSourceLang(data.conversation.personB.language || 'ta');
        setTargetLang(data.conversation.personA.language || 'en');
      }
    } catch (err: any) {
      console.error('Error fetching conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversationData();
  }, [conversationId]);

  // Mode switcher helpers
  const handleSwitchInputMethod = async (method: 'text' | 'voice' | 'sign') => {
    speechService.playTone('click');
    speechService.triggerHaptic(40);
    setCurrentInputMethod(method);
    if (onUpdatePreferences) {
      await onUpdatePreferences(method, currentOutputMethod);
    }
  };

  const handleSwitchOutputMethod = async (method: 'text' | 'voice' | 'sign') => {
    speechService.playTone('click');
    speechService.triggerHaptic(40);
    setCurrentOutputMethod(method);
    if (onUpdatePreferences) {
      await onUpdatePreferences(currentInputMethod, method);
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Switch Active Sender in Two-Way Conversation
  const handleSwitchPerson = () => {
    speechService.playTone('click');
    speechService.triggerHaptic(40);
    const nextSender = activeSender === 'personA' ? 'personB' : 'personA';
    setActiveSender(nextSender);

    if (conversation) {
      if (nextSender === 'personA') {
        setCurrentInputMethod(conversation.personA.inputMethod);
        setCurrentOutputMethod(conversation.personB.outputMethod);
        setSourceLang(conversation.personA.language);
        setTargetLang(conversation.personB.language);
      } else {
        setCurrentInputMethod(conversation.personB.outputMethod === 'voice' ? 'voice' : 'text');
        setCurrentOutputMethod(conversation.personA.inputMethod === 'voice' ? 'voice' : 'text');
        setSourceLang(conversation.personB.language);
        setTargetLang(conversation.personA.language);
      }
    }
  };

  // Toggle Voice Recording
  const handleToggleRecord = () => {
    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
      speechService.playTone('alert');
      speechService.triggerHaptic(50);
    } else {
      speechService.playTone('click');
      speechService.triggerHaptic(50);
      const started = speechService.startListening(
        sourceLang,
        result => {
          setInputText(result.transcript);
          // Visual audio wave fluctuation
          setAudioLevel(Math.floor(Math.random() * 40) + 60);
          if (result.isFinal) {
            setIsRecording(false);
            speechService.playTone('success');
          }
        },
        err => {
          console.warn('Speech error:', err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );
      if (started) {
        setIsRecording(true);
      }
    }
  };

  // Send message
  const handleSendMessage = async (textOverride?: string, inputTypeOverride?: InputMethod) => {
    const textToSend = (textOverride || inputText).trim();
    if (!textToSend || !conversation) return;

    try {
      setIsSending(true);
      speechService.playTone('click');
      speechService.triggerHaptic(40);

      const senderName = activeSender === 'personA' ? conversation.personA.name : conversation.personB.name;
      const inputType = inputTypeOverride || currentInputMethod;

      const res = await ApiClient.sendMessage(conversation.id, {
        originalInput: textToSend,
        inputType,
        senderName,
        originalLanguage: sourceLang,
        targetLanguage: targetLang,
        outputFormat: currentOutputMethod,
        confidence: 0.96,
      });

      setMessages(prev => [...prev, res.message]);
      setInputText('');

      // If output method is voice, automatically play speech for receiver!
      if (currentOutputMethod === 'voice' && res.message.translatedContent) {
        handlePlayTTS(res.message.id, res.message.translatedContent, targetLang);
      }

      // If Smart Mode is on, alternate sender automatically for fluid dialog
      if (conversation.smartMode) {
        handleSwitchPerson();
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Play Text-to-Speech
  const handlePlayTTS = (msgId: string, text: string, lang: SupportedLanguageCode) => {
    if (ttsPlayingId === msgId) {
      speechService.stopSpeaking();
      setTtsPlayingId(null);
      return;
    }

    speechService.stopSpeaking();
    setTtsPlayingId(msgId);
    speechService.speak(text, lang, {
      onEnd: () => setTtsPlayingId(null),
      onError: () => setTtsPlayingId(null),
    });
  };

  // Handle Gesture Recognized from Camera
  const handleGestureRecognized = (sign: SignVocabularyItem, confidence: number) => {
    const text = sign.translations[sourceLang] || sign.translations['en'];
    handleSendMessage(text, 'gesture');
  };

  // Clear Messages
  const handleClearHistory = async () => {
    if (!conversation) return;
    try {
      await ApiClient.clearConversation(conversation.id);
      setMessages([]);
      setMenuOpen(false);
      speechService.playTone('success');
    } catch (err) {
      console.error('Failed to clear conversation:', err);
    }
  };

  if (isLoading || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-white/60">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading accessible communication stream...</span>
        </div>
      </div>
    );
  }

  const activePersonName = activeSender === 'personA' ? conversation.personA.name : conversation.personB.name;
  const receiverPersonName = activeSender === 'personA' ? conversation.personB.name : conversation.personA.name;

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${
        isHighContrast ? 'bg-black text-yellow-300' : 'bg-slate-950 text-white'
      }`}
    >
      {/* Top App Bar */}
      <div className="px-3 py-2.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              speechService.stopListening();
              speechService.stopSpeaking();
              onBack();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold truncate max-w-[190px]">{conversation.title}</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-white/60">
              <span className="text-emerald-400 font-semibold">{activePersonName}</span>
              <span>→</span>
              <span>{receiverPersonName}</span>
              {conversation.smartMode && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px]">
                  Smart
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsVocabModalOpen(true)}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs flex items-center gap-1"
            title="Sign vocabulary"
          >
            <Hand className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium hidden sm:inline">Signs</span>
          </button>

          <button
            onClick={handleSwitchPerson}
            className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition"
            title="Switch sender"
          >
            <RotateCw className="w-3 h-3" />
            <span className="text-[11px]">Swap</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-44 rounded-xl bg-slate-900 border border-white/10 shadow-xl p-1 z-30 text-xs">
                <button
                  onClick={handleClearHistory}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/20 text-rose-300 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Messages</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multimodal Setup & Language Conversion Strip */}
      <div className="bg-black/50 border-b border-white/5 px-3 py-2 shrink-0">
        <div className="flex items-center justify-between text-xs gap-2">
          {/* Sender setup */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[10px] text-white/40 uppercase font-mono">From:</span>
            {/* Input Method */}
            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
              <button
                onClick={() => handleSwitchInputMethod('text')}
                className={`p-1 rounded text-xs transition ${
                  currentInputMethod === 'text' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-white/60'
                }`}
                title="Text input"
              >
                <Type className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleSwitchInputMethod('voice')}
                className={`p-1 rounded text-xs transition ${
                  currentInputMethod === 'voice' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-white/60'
                }`}
                title="Voice input"
              >
                <Mic className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleSwitchInputMethod('sign')}
                className={`p-1 rounded text-xs transition ${
                  currentInputMethod === 'sign' || currentInputMethod === 'gesture' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-white/60'
                }`}
                title="Sign language input"
              >
                <Hand className="w-3 h-3" />
              </button>
            </div>

            {/* Source Lang */}
            <select
              value={sourceLang}
              onChange={e => setSourceLang(e.target.value as SupportedLanguageCode)}
              className="bg-white/10 border border-white/10 text-white rounded-lg px-2 py-1 text-[11px] font-semibold focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-white/30 font-bold">→</div>

          {/* Receiver setup */}
          <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
            <span className="text-[10px] text-white/40 uppercase font-mono">To:</span>
            {/* Target Lang */}
            <select
              value={targetLang}
              onChange={e => setTargetLang(e.target.value as SupportedLanguageCode)}
              className="bg-white/10 border border-white/10 text-white rounded-lg px-2 py-1 text-[11px] font-semibold focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.name}
                </option>
              ))}
            </select>

            {/* Output format */}
            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
              <button
                onClick={() => handleSwitchOutputMethod('text')}
                className={`p-1 rounded text-xs transition ${
                  currentOutputMethod === 'text' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-white/60'
                }`}
                title="Text output"
              >
                <Type className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleSwitchOutputMethod('voice')}
                className={`p-1 rounded text-xs transition ${
                  currentOutputMethod === 'voice' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-white/60'
                }`}
                title="Voice output"
              >
                <Volume2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleSwitchOutputMethod('sign')}
                className={`p-1 rounded text-xs transition ${
                  currentOutputMethod === 'sign' || currentOutputMethod === 'gesture' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-white/60'
                }`}
                title="Sign language output"
              >
                <Hand className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/50">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 mb-3">
              <AudioWaveform className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white/80">No messages yet</h3>
            <p className="text-xs text-white/50 max-w-xs mt-1">
              Start communicating by speaking into the microphone, typing text, or using sign gestures with your camera.
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isFromA = msg.senderName.includes('A') || msg.senderName === conversation.personA.name;
            const isPlayingThisTTS = ttsPlayingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isFromA ? 'items-start' : 'items-end'} max-w-[94%] ${
                  isFromA ? 'mr-auto' : 'ml-auto'
                }`}
              >
                {/* Sender badge & timestamp */}
                <div className="flex items-center gap-1.5 text-[10px] text-white/50 mb-1 px-1">
                  <span className="font-semibold text-white/70">{msg.senderName}</span>
                  <span>•</span>
                  <span className="uppercase font-mono text-[9px] px-1 py-0.2 rounded bg-white/10">
                    {msg.inputType}
                  </span>
                  <span>•</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-3.5 transition-all shadow-md ${
                    isFromA
                      ? isHighContrast
                        ? 'bg-black text-yellow-300 border-2 border-yellow-400'
                        : 'bg-slate-800 text-white border border-slate-700/80'
                      : isHighContrast
                      ? 'bg-yellow-400 text-black border-2 border-black font-semibold'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {/* Original Input vs Translated Target */}
                  <div className="text-xs opacity-70 mb-1 flex items-center justify-between gap-2 border-b border-white/10 pb-1">
                    <span>Original ({msg.originalLanguage}): "{msg.originalInput}"</span>
                    <span className="text-[10px] font-mono opacity-80">→ {msg.targetLanguage}</span>
                  </div>

                  {/* Translated Main Content */}
                  <div className="text-sm font-semibold leading-relaxed">
                    {msg.translatedContent || msg.originalInput}
                  </div>

                  {/* Visual Sign Representation if Output is Gesture */}
                  {(msg.outputFormat === 'gesture' || (msg.signTokens && msg.signTokens.length > 0)) && (
                    <SignDisplayCard
                      signTokens={msg.signTokens}
                      translatedText={msg.translatedContent || msg.originalInput}
                      targetLanguage={msg.targetLanguage}
                      isHighContrast={isHighContrast}
                    />
                  )}

                  {/* Actions footer (Voice replay / TTS) */}
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <button
                      onClick={() =>
                        handlePlayTTS(msg.id, msg.translatedContent || msg.originalInput, msg.targetLanguage)
                      }
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/20 hover:bg-black/40 text-xs transition"
                      aria-label="Play translated audio"
                    >
                      {isPlayingThisTTS ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                          <span className="text-[11px] text-rose-300">Stop Speech</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span className="text-[11px]">Play Voice</span>
                        </>
                      )}
                    </button>

                    <span className="text-[10px] opacity-60 uppercase font-mono">
                      Out: {msg.outputFormat}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Accessibility Phrases */}
      <div className="px-3 py-1.5 bg-black/40 border-t border-white/5 overflow-x-auto flex gap-1.5 scrollbar-thin shrink-0">
        {QUICK_ACCESSIBILITY_PHRASES.slice(0, 6).map((phrase, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(phrase.text, 'text')}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/80 whitespace-nowrap transition"
          >
            {phrase.text}
          </button>
        ))}
      </div>

      {/* Bottom Input Console with Mode Selector */}
      <div className="p-3 bg-slate-900 border-t border-white/10 shrink-0 space-y-2.5">
        {/* Quick Mode Indicator / Switcher Bar */}
        <div className="flex items-center justify-between pb-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Input:</span>
            <div className="flex bg-white/5 rounded-xl p-0.5 border border-white/10">
              {(['text', 'voice', 'sign'] as const).map(mode => {
                const isActive = currentInputMethod === mode || (mode === 'sign' && currentInputMethod === 'gesture');
                return (
                  <button
                    key={mode}
                    onClick={() => handleSwitchInputMethod(mode)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize transition ${
                      isActive
                        ? isHighContrast
                          ? 'bg-yellow-400 text-black font-black'
                          : 'bg-emerald-600 text-white shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Output:</span>
            <div className="flex bg-white/5 rounded-xl p-0.5 border border-white/10">
              {(['text', 'voice', 'sign'] as const).map(mode => {
                const isActive = currentOutputMethod === mode || (mode === 'sign' && currentOutputMethod === 'gesture');
                return (
                  <button
                    key={mode}
                    onClick={() => handleSwitchOutputMethod(mode)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize transition ${
                      isActive
                        ? isHighContrast
                          ? 'bg-yellow-400 text-black font-black'
                          : 'bg-sky-600 text-white shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 1. IF INPUT = TEXT: Show text input box and send button */}
        {currentInputMethod === 'text' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Type text in ${sourceLang.toUpperCase()} (Enter to send)...`}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isSending}
                className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold transition shadow shrink-0"
                aria-label="Send text message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* 2. IF INPUT = VOICE: Show voice recording/microphone interface */}
        {currentInputMethod === 'voice' && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            {/* Listening status & live audio waveform */}
            {isRecording ? (
              <div className="flex items-center justify-between bg-rose-950/80 border border-rose-500/50 rounded-xl px-3 py-2 text-rose-200 text-xs animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-semibold">Listening in {sourceLang.toUpperCase()}... Speak clearly</span>
                </div>
                <div className="flex items-center gap-1 h-4">
                  <div className="w-1 bg-rose-400 rounded-full animate-bounce h-2" />
                  <div className="w-1 bg-rose-400 rounded-full animate-bounce h-4" />
                  <div className="w-1 bg-rose-400 rounded-full animate-bounce h-3" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-white/60 px-1">
                <span>Voice Microphone Mode • Spoken language: {sourceLang.toUpperCase()}</span>
                <span className="text-emerald-400 font-bold">Ready</span>
              </div>
            )}

            {/* Live speech preview if transcribed */}
            {inputText && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase mr-1.5 font-mono">Recognized:</span>
                  <span>"{inputText}"</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isSending}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Voice</span>
                  </button>
                  <button
                    onClick={() => setInputText('')}
                    className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 text-xs"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Big Dedicated Voice Microphone Button */}
            <button
              onClick={handleToggleRecord}
              className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition shadow-lg ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5 animate-spin" />
                  <span>Recording... Tap to Finish & Transcribe</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>Tap to Speak ({sourceLang.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 3. IF INPUT = SIGN: Show sign-language input interface/camera functionality */}
        {(currentInputMethod === 'sign' || currentInputMethod === 'gesture') && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-white/60 px-1">
              <span>Sign Language & Gesture Recognition Camera</span>
              <span className="text-emerald-400 font-bold">16+ Gestures</span>
            </div>

            {/* Recognized sign chip if selected or detected */}
            {inputText && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase mr-1.5 font-mono">Sign Selected:</span>
                  <span>"{inputText}"</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleSendMessage(undefined, 'gesture')}
                    disabled={isSending}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Sign</span>
                  </button>
                  <button
                    onClick={() => setInputText('')}
                    className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 text-xs"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Camera and Glossary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  speechService.playTone('click');
                  setIsCameraModalOpen(true);
                }}
                className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow"
              >
                <Camera className="w-4 h-4" />
                <span>Open Sign Camera</span>
              </button>

              <button
                onClick={() => {
                  speechService.playTone('click');
                  setIsVocabModalOpen(true);
                }}
                className="py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Hand className="w-4 h-4 text-emerald-400" />
                <span>Sign Glossary</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Camera Gesture Recognition Modal */}
      <GestureCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onGestureRecognized={handleGestureRecognized}
        targetLanguage={targetLang}
        isHighContrast={isHighContrast}
      />

      {/* Sign Vocabulary Library Modal */}
      <SignVocabularyModal
        isOpen={isVocabModalOpen}
        onClose={() => setIsVocabModalOpen(false)}
        onSelectSignForConversation={sign => {
          const text = sign.translations[sourceLang] || sign.translations['en'];
          handleSendMessage(text, 'gesture');
        }}
        onOpenPracticeCamera={signId => {
          setIsCameraModalOpen(true);
        }}
        currentLanguage={sourceLang}
        isHighContrast={isHighContrast}
      />
    </div>
  );
};
