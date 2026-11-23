import { useState, useEffect, useCallback } from 'react';
import { Account } from '../types';
import { db } from '../storage/database';
import { oauthService } from '../services/oauthService';

export function useAccounts() {
  const initialAccounts = db.getAccountsSync();
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(initialAccounts[0]?.id || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshAccounts = useCallback(async () => {
    try {
      const list = await db.getAccounts();
      const allEmails = await db.getEmails();
      const accurateList = list.map(acc => {
        const unread = allEmails.filter(e => e.accountId === acc.id && !e.isRead).length;
        return { ...acc, unreadCount: unread };
      });
      setAccounts(accurateList);
      if (accurateList.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accurateList[0].id);
      }
    } catch (err) {
      console.warn('[useAccounts] refresh warning:', err);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    refreshAccounts();
    const unsubscribe = db.subscribe(() => {
      refreshAccounts();
    });

    let onFocus: (() => void) | null = null;
    if (typeof window !== 'undefined') {
      onFocus = () => refreshAccounts();
      window.addEventListener('focus', onFocus);
    }

    return () => {
      unsubscribe();
      if (onFocus && typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  }, [refreshAccounts]);

  const addAccount = async (email: string, label: string): Promise<Account> => {
    const newAcc = await db.addLiveAccount({ email, label });
    await refreshAccounts();
    return newAcc;
  };

  const updateLabel = async (id: string, newLabel: string): Promise<void> => {
    const acc = await db.getAccountById(id);
    if (acc) {
      acc.label = newLabel.trim() || acc.label;
      await db.upsertAccount(acc);
      await refreshAccounts();
    }
  };

  const removeAccount = async (id: string): Promise<void> => {
    await db.deleteAccount(id);
    if (selectedAccountId === id) {
      setSelectedAccountId(null);
    }
    await refreshAccounts();
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0] || null;

  return {
    accounts,
    selectedAccount,
    selectedAccountId,
    setSelectedAccountId,
    isLoading,
    refreshAccounts,
    addAccount,
    updateLabel,
    removeAccount,
  };
}
