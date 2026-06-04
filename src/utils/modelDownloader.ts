import * as FileSystem from 'expo-file-system/legacy';
import { useAppStore, ModelTier } from '@/stores/useAppStore';

export const MODEL_URLS = {
  lite: 'https://huggingface.co/second-state/SmolLM-135M-Instruct-GGUF/resolve/main/SmolLM-135M-Instruct-Q4_K_M.gguf',
  standard: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
  pro: 'https://huggingface.co/second-state/Phi-3-mini-128k-instruct-GGUF/resolve/main/Phi-3-mini-128k-instruct-Q4_K_M.gguf',
  ultra: 'https://huggingface.co/lmstudio-community/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
};

export const getModelFileName = (tier: ModelTier): string => {
  if (tier === 'pro') return 'phi-4.gguf';
  if (tier === 'standard') return 'qwen-0.5b.gguf';
  if (tier === 'ultra') return 'gemma-4.gguf';
  return 'smollm-135m.gguf';
};

export const getModelReadableSize = (tier: ModelTier): string => {
  if (tier === 'pro') return '~2.2 GB';
  if (tier === 'standard') return '~350 MB';
  if (tier === 'ultra') return '~1 GB';
  return '~70 MB';
};

export const getModelReadableName = (tier: ModelTier): string => {
  if (tier === 'pro') return 'Pro Phi-4';
  if (tier === 'standard') return 'Standard Qwen';
  if (tier === 'ultra') return 'Ultra Gemma 4';
  return 'Lite SmolLM';
};

let activeDownload: FileSystem.DownloadResumable | null = null;

export const modelDownloader = {
  getActiveDownload: () => activeDownload,

  startDownload: async (tier: ModelTier) => {
    if (!tier) return;

    // Check if we are already downloading the exact model
    const store = useAppStore.getState();
    if (activeDownload && store.llmModelTier === tier && store.llmStatus === 'downloading') {
      console.log('Download for this model is already active.');
      return;
    }

    // Cancel existing download if any
    if (activeDownload) {
      try {
        await activeDownload.cancelAsync();
      } catch (e) {
        console.warn('Failed to cancel existing download:', e);
      }
      activeDownload = null;
    }

    const url = MODEL_URLS[tier as keyof typeof MODEL_URLS];
    if (!url) return;

    const fileName = getModelFileName(tier);
    const destinationPath = `${FileSystem.documentDirectory}models/${fileName}`;
    const modelDir = `${FileSystem.documentDirectory}models/`;

    try {
      store.setLlmStatus('downloading');
      store.setLlmDownloadProgress(0);

      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(modelDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
      }

      // Check if file is already there
      const fileInfo = await FileSystem.getInfoAsync(destinationPath);
      if (fileInfo.exists) {
        if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
          console.log('Model already downloaded, skipping.');
          store.setLlmStatus('ready');
          return;
        } else {
          console.log('Model file exists but is too small (corrupted/incomplete), deleting...');
          await FileSystem.deleteAsync(destinationPath, { idempotent: true });
        }
      }

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        destinationPath,
        {},
        (downloadProgress) => {
          if (downloadProgress.totalBytesExpectedToWrite > 0) {
            const progress = Math.round(
              (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
            );
            store.setLlmDownloadProgress(progress);
          }
        }
      );

      activeDownload = downloadResumable;
      const result = await downloadResumable.downloadAsync();

      if (result && result.uri) {
        store.setLlmStatus('ready');
        activeDownload = null;
      } else {
        throw new Error('Download failed');
      }
    } catch (error: any) {
      // Check if cancelled
      if (error?.message?.includes('cancel') || error?.message?.includes('cancelled')) {
        console.log('Model download cancelled');
      } else {
        console.error('Model download error:', error);
        store.setLlmStatus('error', error.message || 'Download failed');
      }
      activeDownload = null;
    }
  },

  cancelDownload: async () => {
    const store = useAppStore.getState();
    if (activeDownload) {
      try {
        await activeDownload.cancelAsync();
      } catch (e) {
        console.error('Error cancelling download:', e);
      }
      activeDownload = null;
    }
    store.setLlmStatus('not_downloaded');
    store.setLlmDownloadProgress(0);
  },
};
