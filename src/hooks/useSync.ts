import { useState, useCallback, useEffect } from 'react';
import { syncEngine } from '../services/syncEngine';
import { db } from '../storage/database';

export function useSync(onSyncCompleted?: () => void) {
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [syncingAccounts, setSyncingAccounts] = useState<Set<string>>(new Set());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncErrors, setSyncErrors] = useState<Record<string, string>>({});

  const refreshLastSync = useCallback(async () => {
    const accounts = await db.getAccounts();
    const sortedTimes = accounts
      .map(a => a.lastSyncedAt)
      .filter((t): t is string => !!t)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (sortedTimes.length > 0) {
      setLastSyncTime(sortedTimes[0]);
    }
  }, []);

  useEffect(() => {
    refreshLastSync();
  }, [refreshLastSync]);

  const syncAccount = async (accountId: string): Promise<boolean> => {
    setSyncingAccounts(prev => new Set(prev).add(accountId));
    try {
      const result = await syncEngine.syncAccount(accountId);
      if (result.status === 'error') {
        setSyncErrors(prev => ({ ...prev, [accountId]: result.errorMsg || 'Failed' }));
        return false;
      } else {
        setSyncErrors(prev => {
          const next = { ...prev };
          delete next[accountId];
          return next;
        });
        await refreshLastSync();
        onSyncCompleted?.();
        return true;
      }
    } catch (err: any) {
      setSyncErrors(prev => ({ ...prev, [accountId]: err.message || 'Error' }));
      return false;
    } finally {
      setSyncingAccounts(prev => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const syncAll = async (): Promise<void> => {
    setIsSyncingAll(true);
    try {
      const results = await syncEngine.syncAllAccounts();
      const newErrors: Record<string, string> = {};
      for (const res of results) {
        if (res.status === 'error' && res.errorMsg) {
          newErrors[res.accountId] = res.errorMsg;
        }
      }
      setSyncErrors(newErrors);
      await refreshLastSync();
      onSyncCompleted?.();
    } finally {
      setIsSyncingAll(false);
    }
  };

  return {
    isSyncing: isSyncingAll || syncingAccounts.size > 0,
    isSyncingAll,
    syncingAccounts,
    lastSyncTime,
    syncErrors,
    syncAccount,
    syncAll,
  };
}
