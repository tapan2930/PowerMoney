import { create } from 'zustand';

export type AppTheme = 'light' | 'dark' | 'system';
export type ModelTier = 'lite' | 'standard' | 'pro' | 'ultra' | null;
export type LLMStatus = 'idle' | 'downloading' | 'ready' | 'error' | 'not_downloaded';

export interface AppState {
  // Onboarding & Profile State
  isOnboarded: boolean;
  userName: string;
  currency: string;
  theme: AppTheme;
  
  // LLM Model State
  llmModelTier: ModelTier;
  llmDownloadProgress: number;
  llmStatus: LLMStatus;
  llmErrorMessage: string | null;

  // Actions
  setIsOnboarded: (isOnboarded: boolean) => void;
  setProfile: (name: string, currency: string) => void;
  setTheme: (theme: AppTheme) => void;
  
  // LLM actions
  setLlmModelTier: (tier: ModelTier) => void;
  setLlmDownloadProgress: (progress: number) => void;
  setLlmStatus: (status: LLMStatus, errorMsg?: string | null) => void;
  
  // Global Reset
  resetStore: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Onboarding & Profile defaults
  isOnboarded: false,
  userName: '',
  currency: 'USD',
  theme: 'system',

  // LLM defaults
  llmModelTier: null,
  llmDownloadProgress: 0,
  llmStatus: 'not_downloaded',
  llmErrorMessage: null,

  // Actions
  setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
  setProfile: (userName, currency) => set({ userName, currency }),
  setTheme: (theme) => set({ theme }),

  setLlmModelTier: (llmModelTier) => set({ llmModelTier }),
  setLlmDownloadProgress: (llmDownloadProgress) => set({ llmDownloadProgress }),
  setLlmStatus: (llmStatus, errorMsg = null) => 
    set({ llmStatus, llmErrorMessage: errorMsg }),

  resetStore: () => set({
    isOnboarded: false,
    userName: '',
    currency: 'USD',
    theme: 'system',
    llmModelTier: null,
    llmDownloadProgress: 0,
    llmStatus: 'not_downloaded',
    llmErrorMessage: null,
  }),
}));
