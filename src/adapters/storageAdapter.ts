import { Platform } from 'react-native';

export const storageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {
        console.warn('[StorageAdapter] Web read error:', e);
      }
      return null;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // ignore
    }
    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn('[StorageAdapter] Web write error:', e);
      }
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // ignore
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn('[StorageAdapter] Web remove error:', e);
      }
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  },

  /**
   * Synchronously reads a persisted SQLite table JSON array on Web.
   */
  getTableSync<T = any>(tableName: string): T[] {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const item = window.localStorage.getItem(`amg_sqlite_table_${tableName}_v3`);
        if (item) {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn(`[StorageAdapter] Failed to read table ${tableName}:`, e);
      }
    }
    return [];
  },

  /**
   * Persists a SQLite table JSON array on Web.
   */
  setTableSync<T = any>(tableName: string, rows: T[]): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`amg_sqlite_table_${tableName}_v3`, JSON.stringify(rows));
      } catch (e) {
        console.warn(`[StorageAdapter] Failed to persist table ${tableName}:`, e);
      }
    }
  },
};
