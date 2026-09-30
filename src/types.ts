export type SupportedLanguageCode = 'en' | 'ta' | 'te' | 'hi';

export interface LanguageInfo {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  script: string;
}

export type InputMethod = 'text' | 'voice' | 'sign' | 'gesture';
export type OutputMethod = 'text' | 'voice' | 'sign' | 'gesture';

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  hapticFeedback: boolean;
  screenReaderAnnounce: boolean;
  darkMode: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  preferredLanguage: SupportedLanguageCode;
  communicationPreference: InputMethod;
  outputPreference: OutputMethod;
  inputMethod?: InputMethod;
  outputMethod?: OutputMethod;
  profilePicture?: string;
  voicePitch: number;
  voiceSpeed: number;
  accessibilitySettings: AccessibilitySettings;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface CommunicationPreferences {
  inputMethod: 'text' | 'voice' | 'sign';
  outputMethod: 'text' | 'voice' | 'sign';
}

export interface ConversationParticipant {
  name: string;
  inputMethod?: InputMethod;
  outputMethod?: OutputMethod;
  language: SupportedLanguageCode;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  personA: {
    name: string;
    inputMethod: InputMethod;
    language: SupportedLanguageCode;
  };
  personB: {
    name: string;
    outputMethod: OutputMethod;
    language: SupportedLanguageCode;
  };
  smartMode: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderName: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  originalInput: string;
  inputType: InputMethod;
  originalLanguage: SupportedLanguageCode;
  targetLanguage: SupportedLanguageCode;
  translatedContent: string;
  outputFormat: OutputMethod;
  signTokens?: string[];
  audioUrl?: string;
  confidence?: number;
  createdAt: string;
}

export interface SignVocabularyItem {
  id: string;
  name: string;
  category: 'emergency' | 'healthcare' | 'social' | 'direction' | 'basic';
  gestureHint: string;
  handShape: string;
  movementDescription: string;
  iconName: string;
  translations: Record<string, string>;
}
