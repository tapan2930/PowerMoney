export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'] as const;

export interface AccountTypeOption {
  type: 'bank' | 'credit_card' | 'cash' | 'savings';
  label: string;
}

export const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  { type: 'bank', label: 'Bank' },
  { type: 'credit_card', label: 'Credit Card' },
  { type: 'cash', label: 'Cash' },
  { type: 'savings', label: 'Savings' },
];

export interface ThemeOption {
  type: 'light' | 'dark' | 'system';
  label: string;
  icon: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { type: 'light', label: 'Light Mode', icon: 'sunny-outline' },
  { type: 'dark', label: 'Dark Mode', icon: 'moon-outline' },
  { type: 'system', label: 'System Default', icon: 'phone-portrait-outline' },
];

export interface ModelTierOption {
  tier: 'lite' | 'standard' | 'pro' | null;
  name: string;
  desc: string;
}

export const MODEL_TIER_OPTIONS: ModelTierOption[] = [
  {
    tier: 'lite',
    name: 'Lite Tier (SmolLM-135M)',
    desc: 'Fastest, tiny size (~70MB). Basic text understanding & category checks.',
  },
  {
    tier: 'standard',
    name: 'Standard Tier (Qwen2.5-0.5B)',
    desc: 'Perfect balance (~350MB). Great logic, standard transaction categorizer.',
  },
  {
    tier: 'pro',
    name: 'Pro Tier (Phi-4 Mini 3.8B)',
    desc: 'Smartest (~2.2GB). In-depth reasoning and financial planning capabilities.',
  },
  {
    tier: null,
    name: 'Skip / Download Later',
    desc: 'You can configure offline AI later in settings. Text categorization defaults to rules.',
  },
];
