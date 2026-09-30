import React, { useState, useEffect } from 'react';
import { UserProfile, AccessibilitySettings, InputMethod, OutputMethod } from './types';
import { ApiClient } from './services/api';
import { DeviceFrame } from './components/common/DeviceFrame';
import { AuthViews } from './components/auth/AuthViews';
import { DashboardView } from './components/dashboard/DashboardView';
import { ConversationView } from './components/conversation/ConversationView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { HelpModal } from './components/help/HelpModal';
import { SignVocabularyModal } from './components/vocabulary/SignVocabularyModal';
import { CommunicationModeModal } from './components/common/CommunicationModeModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => ApiClient.getCachedUser());
  const [isInitializing, setIsInitializing] = useState(true);

  // Navigation
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'conversation' | 'profile' | 'settings'>('dashboard');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Global modals
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [isCommModeModalOpen, setIsCommModeModalOpen] = useState(false);

  // Accessibility settings
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    highContrast: false,
    fontSize: 'normal',
    hapticFeedback: true,
    screenReaderAnnounce: true,
    darkMode: false,
  });

  // Verify auth session and load saved communication preferences on startup
  useEffect(() => {
    async function verifyUser() {
      if (ApiClient.getToken()) {
        try {
          const user = await ApiClient.getMe();
          // Fetch user's saved communication preferences
          try {
            const prefs = await ApiClient.getPreferences();
            const inMethod = (prefs.inputMethod || (prefs as any).input_method || user.inputMethod || 'text').replace('gesture', 'sign') as InputMethod;
            const outMethod = (prefs.outputMethod || (prefs as any).output_method || user.outputMethod || 'text').replace('gesture', 'sign') as OutputMethod;
            user.inputMethod = inMethod;
            user.outputMethod = outMethod;
            user.communicationPreference = inMethod;
            user.outputPreference = outMethod;
          } catch {
            // Default to Text -> Text if no preference exists
            if (!user.inputMethod) user.inputMethod = 'text';
            if (!user.outputMethod) user.outputMethod = 'text';
          }

          setCurrentUser(user);
          if (user.accessibilitySettings) {
            setAccessibility(user.accessibilitySettings);
          }
        } catch {
          // Token expired or invalid
          ApiClient.clearAuth();
          setCurrentUser(null);
        }
      }
      setIsInitializing(false);
    }
    verifyUser();
  }, []);

  const handleAuthSuccess = async (user: UserProfile) => {
    try {
      const prefs = await ApiClient.getPreferences();
      const inMethod = (prefs.inputMethod || (prefs as any).input_method || user.inputMethod || 'text').replace('gesture', 'sign') as InputMethod;
      const outMethod = (prefs.outputMethod || (prefs as any).output_method || user.outputMethod || 'text').replace('gesture', 'sign') as OutputMethod;
      user.inputMethod = inMethod;
      user.outputMethod = outMethod;
      user.communicationPreference = inMethod;
      user.outputPreference = outMethod;
    } catch {
      if (!user.inputMethod) user.inputMethod = 'text';
      if (!user.outputMethod) user.outputMethod = 'text';
    }

    setCurrentUser(user);
    if (user.accessibilitySettings) {
      setAccessibility(user.accessibilitySettings);
    }
    setActiveScreen('dashboard');
  };

  const handleUpdatePreferences = async (inputMethod: InputMethod, outputMethod: OutputMethod) => {
    const normIn = inputMethod === 'gesture' ? 'sign' : inputMethod;
    const normOut = outputMethod === 'gesture' ? 'sign' : outputMethod;

    // Apply immediately to local state for instant responsive UI
    setCurrentUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        inputMethod: normIn,
        outputMethod: normOut,
        communicationPreference: normIn,
        outputPreference: normOut,
      };
    });

    // Persist every change to backend API
    try {
      const res = await ApiClient.updatePreferences({
        inputMethod: normIn,
        outputMethod: normOut,
        input_method: normIn,
        output_method: normOut,
      });
      if (res.user) {
        setCurrentUser(res.user);
      }
    } catch (err) {
      console.error('Failed to persist communication preferences to backend:', err);
    }
  };

  const handleLogout = async () => {
    await ApiClient.logout();
    setCurrentUser(null);
    setActiveScreen('dashboard');
    setActiveConversationId(null);
  };

  const handleToggleHighContrast = () => {
    setAccessibility(prev => {
      const next = { ...prev, highContrast: !prev.highContrast };
      if (currentUser) {
        ApiClient.updateMe({ accessibilitySettings: next }).catch(console.error);
      }
      return next;
    });
  };

  const handleCycleFontSize = () => {
    setAccessibility(prev => {
      const sizes: ('normal' | 'large' | 'extra-large')[] = ['normal', 'large', 'extra-large'];
      const nextIdx = (sizes.indexOf(prev.fontSize) + 1) % sizes.length;
      const next = { ...prev, fontSize: sizes[nextIdx] };
      if (currentUser) {
        ApiClient.updateMe({ accessibilitySettings: next }).catch(console.error);
      }
      return next;
    });
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/60">Initializing Voice2Sense Accessibility Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <DeviceFrame
      accessibilitySettings={accessibility}
      onToggleHighContrast={handleToggleHighContrast}
      onCycleFontSize={handleCycleFontSize}
    >
      {!currentUser ? (
        <AuthViews onAuthSuccess={handleAuthSuccess} isHighContrast={accessibility.highContrast} />
      ) : (
        <>
          {activeScreen === 'dashboard' && (
            <DashboardView
              user={currentUser}
              onSelectConversation={id => {
                setActiveConversationId(id);
                setActiveScreen('conversation');
              }}
              onOpenProfile={() => setActiveScreen('profile')}
              onOpenSettings={() => setActiveScreen('settings')}
              onOpenHelp={() => setIsHelpOpen(true)}
              onOpenVocabulary={() => setIsVocabOpen(true)}
              onOpenCommunicationMode={() => setIsCommModeModalOpen(true)}
              onUpdatePreferences={handleUpdatePreferences}
              isHighContrast={accessibility.highContrast}
            />
          )}

          {activeScreen === 'conversation' && activeConversationId && (
            <ConversationView
              conversationId={activeConversationId}
              onBack={() => {
                setActiveScreen('dashboard');
                setActiveConversationId(null);
              }}
              currentUserPreferences={{
                inputMethod: currentUser.inputMethod || 'text',
                outputMethod: currentUser.outputMethod || 'text',
              }}
              onUpdatePreferences={handleUpdatePreferences}
              onOpenCommunicationMode={() => setIsCommModeModalOpen(true)}
              isHighContrast={accessibility.highContrast}
            />
          )}

          {activeScreen === 'profile' && (
            <ProfileView
              user={currentUser}
              onBack={() => setActiveScreen('dashboard')}
              onUpdateUser={updated => setCurrentUser(updated)}
              onUpdatePreferences={handleUpdatePreferences}
              onLogout={handleLogout}
              isHighContrast={accessibility.highContrast}
            />
          )}

          {activeScreen === 'settings' && (
            <SettingsView
              user={currentUser}
              onBack={() => setActiveScreen('dashboard')}
              onUpdateAccessibility={settings => setAccessibility(settings)}
              onUpdatePreferences={handleUpdatePreferences}
              isHighContrast={accessibility.highContrast}
            />
          )}

          {/* Quick Communication Mode Settings Modal */}
          <CommunicationModeModal
            isOpen={isCommModeModalOpen}
            onClose={() => setIsCommModeModalOpen(false)}
            currentInput={currentUser.inputMethod || 'text'}
            currentOutput={currentUser.outputMethod || 'text'}
            onSavePreferences={handleUpdatePreferences}
            isHighContrast={accessibility.highContrast}
          />

          {/* Global Onboarding & User Guide Modal */}
          <HelpModal
            isOpen={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
            isHighContrast={accessibility.highContrast}
          />

          {/* Global Sign Vocabulary Library Modal */}
          <SignVocabularyModal
            isOpen={isVocabOpen}
            onClose={() => setIsVocabOpen(false)}
            currentLanguage={currentUser.preferredLanguage}
            isHighContrast={accessibility.highContrast}
          />
        </>
      )}
    </DeviceFrame>
  );
}
