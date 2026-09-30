import {
  UserProfile,
  Conversation,
  Message,
  SupportedLanguageCode,
  InputMethod,
  OutputMethod,
  SignVocabularyItem,
  CommunicationPreferences,
} from '../types';

const TOKEN_KEY = 'voice2sense_auth_token';
const REFRESH_TOKEN_KEY = 'voice2sense_refresh_token';
const USER_KEY = 'voice2sense_current_user';

export const ApiClient = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setAuth(token: string, refreshToken: string, user: UserProfile) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCachedUser(): UserProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try refresh token
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken && endpoint !== '/api/auth/refresh') {
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem(TOKEN_KEY, data.token);
            // Retry original
            headers['Authorization'] = `Bearer ${data.token}`;
            const retryRes = await fetch(endpoint, { ...options, headers });
            if (!retryRes.ok) {
              const errData = await retryRes.json().catch(() => ({}));
              throw new Error(errData.message || 'Request failed');
            }
            return retryRes.json();
          }
        } catch {
          this.clearAuth();
        }
      }
      this.clearAuth();
      throw new Error('Authentication expired. Please log in again.');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Network request error' }));
      throw new Error(err.message || `Server responded with status ${response.status}`);
    }

    return response.json();
  },

  // Auth endpoints
  async register(data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    preferredLanguage?: SupportedLanguageCode;
    communicationPreference?: InputMethod;
    outputPreference?: OutputMethod;
  }) {
    const res = await this.request<{
      message: string;
      token: string;
      refreshToken: string;
      user: UserProfile;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setAuth(res.token, res.refreshToken, res.user);
    return res;
  },

  async login(email: string, password: string) {
    const res = await this.request<{
      message: string;
      token: string;
      refreshToken: string;
      user: UserProfile;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setAuth(res.token, res.refreshToken, res.user);
    return res;
  },

  async logout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Continue clearing
    }
    this.clearAuth();
  },

  async forgotPassword(email: string) {
    return this.request<{ message: string; tempResetCode?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(email: string, resetCode: string, newPassword: string) {
    return this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, resetCode, newPassword }),
    });
  },

  // User endpoints
  async getMe(): Promise<UserProfile> {
    const user = await this.request<UserProfile>('/api/users/me');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async updateMe(updates: Partial<UserProfile>): Promise<{ message: string; user: UserProfile }> {
    const res = await this.request<{ message: string; user: UserProfile }>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    return res;
  },

  async deleteAccount(): Promise<{ message: string }> {
    const res = await this.request<{ message: string }>('/api/users/me', {
      method: 'DELETE',
    });
    this.clearAuth();
    return res;
  },

  // Communication Mode (Input & Output Preferences)
  async getPreferences(): Promise<CommunicationPreferences> {
    return this.request<CommunicationPreferences>('/api/users/preferences');
  },

  async updatePreferences(prefs: {
    inputMethod?: InputMethod;
    outputMethod?: OutputMethod;
    input_method?: InputMethod;
    output_method?: OutputMethod;
  }): Promise<{
    message: string;
    inputMethod: InputMethod;
    outputMethod: OutputMethod;
    input_method?: InputMethod;
    output_method?: OutputMethod;
    user: UserProfile;
  }> {
    const payload = {
      input_method: prefs.input_method || prefs.inputMethod,
      output_method: prefs.output_method || prefs.outputMethod,
      inputMethod: prefs.inputMethod || prefs.input_method,
      outputMethod: prefs.outputMethod || prefs.output_method,
    };
    const res = await this.request<{
      message: string;
      inputMethod: InputMethod;
      outputMethod: OutputMethod;
      input_method?: InputMethod;
      output_method?: OutputMethod;
      user: UserProfile;
    }>('/api/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    return res;
  },

  // Conversation endpoints
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/api/conversations');
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    return this.request<{ conversation: Conversation; messages: Message[] }>(`/api/conversations/${id}`);
  },

  async createConversation(data: {
    title?: string;
    personA?: { name: string; inputMethod: InputMethod; language: SupportedLanguageCode };
    personB?: { name: string; outputMethod: OutputMethod; language: SupportedLanguageCode };
    smartMode?: boolean;
  }): Promise<Conversation> {
    return this.request<Conversation>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    return this.request<Conversation>(`/api/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteConversation(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  async clearConversation(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/conversations/${id}/clear`, {
      method: 'DELETE',
    });
  },

  // Message Sending & Translation
  async sendMessage(
    conversationId: string,
    data: {
      originalInput: string;
      inputType: InputMethod;
      senderName?: string;
      originalLanguage?: SupportedLanguageCode;
      targetLanguage?: SupportedLanguageCode;
      outputFormat?: OutputMethod;
      confidence?: number;
    }
  ): Promise<{ message: Message; signDetails?: SignVocabularyItem[] }> {
    return this.request<{ message: Message; signDetails?: SignVocabularyItem[] }>(
      `/api/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async translate(text: string, sourceLang: SupportedLanguageCode, targetLang: SupportedLanguageCode) {
    return this.request<{
      originalText: string;
      sourceLanguage: string;
      targetLanguage: string;
      translatedText: string;
      signTokens: string[];
      signDetails: SignVocabularyItem[];
      provider: string;
    }>('/api/translate', {
      method: 'POST',
      body: JSON.stringify({
        text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      }),
    });
  },

  async recognizeGesture(gestureId: string, targetLanguage?: SupportedLanguageCode) {
    return this.request<{
      recognized: boolean;
      signId?: string;
      name?: string;
      confidence?: number;
      text?: string;
      signItem?: SignVocabularyItem;
      message?: string;
    }>('/api/gesture/recognize', {
      method: 'POST',
      body: JSON.stringify({
        gestureId,
        targetLanguage,
      }),
    });
  },

  async getSignVocabulary(): Promise<SignVocabularyItem[]> {
    return this.request<SignVocabularyItem[]>('/api/sign-vocabulary');
  },

  async getHealth() {
    return this.request<any>('/api/health');
  },
};
