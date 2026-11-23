import { useState, useEffect, useCallback } from 'react';
import { OtpEntry } from '../types';
import { db } from '../storage/database';
import { clipboardAdapter } from '../adapters/clipboardAdapter';

export function useOtpFeed() {
  const [otps, setOtps] = useState<OtpEntry[]>(db.getOtpsSync());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshOtps = useCallback(async () => {
    try {
      const list = await db.getOtps({
        accountId: selectedAccountId || undefined,
        query: searchQuery || undefined,
        unreadOnly,
      });
      setOtps(list);
    } catch (err) {
      console.warn('[useOtpFeed] refresh warning:', err);
    }
  }, [selectedAccountId, searchQuery, unreadOnly]);

  useEffect(() => {
    refreshOtps();
    const unsubscribe = db.subscribe(() => {
      refreshOtps();
    });

    let onFocus: (() => void) | null = null;
    if (typeof window !== 'undefined') {
      onFocus = () => refreshOtps();
      window.addEventListener('focus', onFocus);
    }

    return () => {
      unsubscribe();
      if (onFocus && typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  }, [refreshOtps]);

  const handleCopyOtp = async (otp: OtpEntry): Promise<boolean> => {
    const res = await clipboardAdapter.copy(otp.code);
    if (res.success) {
      setCopiedOtpId(otp.id);
      setToastMessage(`Copied ${otp.code} from ${otp.accountLabel} (${otp.serviceName})`);
      await db.markOtpUsed(otp.id, true);
      setTimeout(() => {
        setCopiedOtpId(curr => (curr === otp.id ? null : curr));
      }, 2500);
      return true;
    }
    return false;
  };

  const markUsed = async (otpId: string, isUsed = true): Promise<void> => {
    await db.markOtpUsed(otpId, isUsed);
    await refreshOtps();
  };

  const clearToast = () => {
    setToastMessage(null);
  };

  return {
    otps,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedAccountId,
    setSelectedAccountId,
    unreadOnly,
    setUnreadOnly,
    copiedOtpId,
    toastMessage,
    clearToast,
    handleCopyOtp,
    markUsed,
    refreshOtps,
  };
}
