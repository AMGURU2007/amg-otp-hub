import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export interface CopyResult {
  success: boolean;
  text: string;
}

export const clipboardAdapter = {
  async copy(text: string): Promise<CopyResult> {
    if (!text) return { success: false, text: '' };

    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          return { success: true, text };
        }
      }
      // Use expo-clipboard on Native & Web fallback
      await Clipboard.setStringAsync(text);
      return { success: true, text };
    } catch (err) {
      console.warn('[ClipboardAdapter] Copy error:', err);
      // Last-ditch DOM fallback on web
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textarea);
          return { success: successful, text };
        } catch {
          // ignore
        }
      }
      return { success: false, text };
    }
  }
};
