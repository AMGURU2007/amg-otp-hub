import React, { useState, createContext, useContext, Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Breakpoints, Typography, Radius, Spacing } from '../src/theme/tokens';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { LanguageProvider, useLanguage } from '../src/i18n/LanguageContext';
import { SidebarNav, ExtendedNavTab } from '../src/components/SidebarNav';
import { Toast } from '../src/components/Toast';
import { bootManager } from '../src/utils/bootState';
import { useAccounts } from '../src/hooks/useAccounts';
import { useSync } from '../src/hooks/useSync';
import { Account } from '../src/types';
import { db } from '../src/storage/database';
import { oauthService } from '../src/services/oauthService';
import { UserSession } from '../src/storage/secureStore';
import {
  Sparkles,
  LayoutDashboard,
  ShieldAlert,
  Mail,
  Users,
  Settings,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react-native';

interface AppContextType {
  accounts: Account[];
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  refreshAccounts: () => Promise<void>;
  isSyncing: boolean;
  syncAll: () => Promise<void>;
  syncAccount: (id: string) => Promise<boolean>;
  lastSyncTime: string | null;
  showToast: (msg: string) => void;
  openMobileMenu: () => void;
  isDesktop: boolean;
  activeSession: UserSession | null;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// --- REACT ERROR BOUNDARY ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppErrorBoundary] Uncaught React Error:', error, errorInfo);
  }

  handleReset = async () => {
    try {
      await db.flushAllData();
      if (typeof window !== 'undefined') {
        window.location.reload();
      } else {
        this.setState({ hasError: false, error: null });
      }
    } catch {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorScreen}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconBox}>
              <AlertTriangle size={32} color="#f4c76a" />
            </View>
            <Text style={styles.errorTitle}>Render Notice</Text>
            <Text style={styles.errorSubtitle}>
              An unexpected runtime error occurred while rendering the interface.
            </Text>

            <ScrollView style={styles.errorStackScroll}>
              <Text style={styles.errorStackText}>
                {this.state.error?.toString()}
                {'\n\n'}
                {this.state.error?.stack}
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.errorResetBtn} onPress={this.handleReset}>
              <RotateCcw size={16} color="#07101d" />
              <Text style={styles.errorResetBtnText}>Reset Workspace State</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

function MainAppShell() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();

  const isDesktop = width >= Breakpoints.tabletMin;
  const { accounts, selectedAccountId, setSelectedAccountId, refreshAccounts } = useAccounts();
  const { isSyncing, syncAll, syncAccount, lastSyncTime } = useSync(refreshAccounts);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<UserSession | null>(null);
  const [isPrivacyVeiled, setIsPrivacyVeiled] = useState(false);

  // Device-Wide Anti-Screenshot & Screen Capture Protection
  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        try {
          const ScreenCapture = await import('expo-screen-capture');
          if (ScreenCapture?.preventScreenCaptureAsync) {
            await ScreenCapture.preventScreenCaptureAsync();
          }
        } catch {}
      })();
    } else if (typeof window !== 'undefined') {
      let veilTimeout: any = null;

      const triggerVeil = (reason = 'Screenshots are disabled for OTP security.') => {
        setIsPrivacyVeiled(true);
        showToast(reason);
        clearTimeout(veilTimeout);
        veilTimeout = setTimeout(() => {
          setIsPrivacyVeiled(false);
        }, 1500);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
          e.preventDefault();
          triggerVeil('Screenshots are disabled for OTP security.');
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
          e.preventDefault();
          triggerVeil('Screen snip is blocked for OTP privacy.');
        }
        if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
          e.preventDefault();
          triggerVeil('Screenshots are disabled for OTP security.');
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
          e.preventDefault();
          triggerVeil('Printing is disabled for OTP security.');
        }
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          setIsPrivacyVeiled(true);
        } else {
          clearTimeout(veilTimeout);
          veilTimeout = setTimeout(() => setIsPrivacyVeiled(false), 300);
        }
      };

      const handleWindowBlur = () => {
        setIsPrivacyVeiled(true);
      };

      const handleWindowFocus = () => {
        clearTimeout(veilTimeout);
        veilTimeout = setTimeout(() => setIsPrivacyVeiled(false), 200);
      };

      window.addEventListener('keydown', handleKeyDown, true);
      window.addEventListener('keyup', (e: KeyboardEvent) => {
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
          triggerVeil('Screenshots are disabled for OTP security.');
        }
      }, true);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);
      window.addEventListener('focus', handleWindowFocus);

      return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
        window.removeEventListener('focus', handleWindowFocus);
        clearTimeout(veilTimeout);
      };
    }
  }, []);

  React.useEffect(() => {
    handleBootAuth();
  }, []);

  const handleBootAuth = async () => {
    try {
      // 1. Process Google OAuth redirect callback on boot immediately
      const callbackResult = await oauthService.handleOAuthCallbackOnBoot();
      if (callbackResult.handled) {
        if (callbackResult.success && callbackResult.account) {
          await refreshAccounts();
          setActiveSession({
            accountId: callbackResult.account.id,
            email: callbackResult.account.email,
            name: callbackResult.account.label,
            signedInAt: new Date().toISOString(),
          });
          showToast(`Connected ${callbackResult.account.email}!`);
          router.replace('/dashboard');
          return;
        } else if (callbackResult.error) {
          showToast(`Google Sign-In notice: ${callbackResult.error}`);
        }
      }

      // 2. Check for existing persistent session
      const sess = await oauthService.checkAndHydrateSession();
      if (sess) {
        setActiveSession(sess);
      }
    } catch (err: any) {
      console.warn('[Layout] Boot auth notice:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await oauthService.logoutUser();
      await refreshAccounts();
      setActiveSession(null);
      showToast('Signed out successfully');
      router.replace('/');
    } catch (e: any) {
      showToast(`Logout error: ${e.message}`);
    }
  };

  const getCurrentTab = (): string => {
    if (pathname === '/' || pathname === '/index') return 'welcome';
    if (pathname.includes('/dashboard')) return 'dashboard';
    if (pathname.includes('/otp')) return 'otp';
    if (pathname.includes('/inbox')) return 'inbox';
    if (pathname.includes('/accounts')) return 'accounts';
    if (pathname.includes('/settings')) return 'settings';
    return 'welcome';
  };

  const handleSelectTab = (tab: ExtendedNavTab) => {
    setMobileDrawerOpen(false);
    switch (tab) {
      case 'welcome':
        if (pathname === '/' || pathname === '/index') {
          bootManager.triggerWelcomeRoll();
        } else {
          router.push('/');
        }
        break;
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'otp':
        router.push('/otp');
        break;
      case 'inbox':
        router.push('/inbox');
        break;
      case 'accounts':
        router.push('/accounts');
        break;
      case 'settings':
        router.push('/settings');
        break;
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const currentTab = getCurrentTab();

  return (
    <AppContext.Provider
      value={{
        accounts,
        selectedAccountId,
        setSelectedAccountId,
        refreshAccounts,
        isSyncing,
        syncAll,
        syncAccount,
        lastSyncTime,
        showToast,
        openMobileMenu: () => setMobileDrawerOpen(true),
        isDesktop,
        activeSession,
        logout: handleLogout,
      }}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
          {/* Desktop Left Sticky Sidebar */}
          {isDesktop && (
            <SidebarNav
              currentTab={currentTab}
              onSelectTab={handleSelectTab}
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelectAccount={id => {
                setSelectedAccountId(id);
                router.push('/inbox');
              }}
            />
          )}

          {/* Main Content Area */}
          <View style={[styles.contentWrapper, { backgroundColor: colors.background }]}>
            <Slot />
          </View>
        </View>

        {/* Mobile Bottom Navigation Bar */}
        {!isDesktop && (
          <View
            style={[
              styles.bottomBar,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.borderLight,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.bottomTab, currentTab === 'welcome' && styles.bottomTabActive]}
              onPress={() => handleSelectTab('welcome')}
            >
              <Sparkles
                size={19}
                color={currentTab === 'welcome' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.bottomTabText,
                  { color: colors.textMuted },
                  currentTab === 'welcome' && { color: colors.primary, fontWeight: '700' },
                ]}
              >
                {t('navHome')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomTab, currentTab === 'dashboard' && styles.bottomTabActive]}
              onPress={() => handleSelectTab('dashboard')}
            >
              <LayoutDashboard
                size={19}
                color={currentTab === 'dashboard' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.bottomTabText,
                  { color: colors.textMuted },
                  currentTab === 'dashboard' && { color: colors.primary, fontWeight: '700' },
                ]}
              >
                {t('navDashboard')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomTab, currentTab === 'otp' && styles.bottomTabActive]}
              onPress={() => handleSelectTab('otp')}
            >
              <ShieldAlert
                size={19}
                color={currentTab === 'otp' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.bottomTabText,
                  { color: colors.textMuted },
                  currentTab === 'otp' && { color: colors.primary, fontWeight: '700' },
                ]}
              >
                {t('navOtps')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomTab, currentTab === 'inbox' && styles.bottomTabActive]}
              onPress={() => handleSelectTab('inbox')}
            >
              <Mail
                size={19}
                color={currentTab === 'inbox' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.bottomTabText,
                  { color: colors.textMuted },
                  currentTab === 'inbox' && { color: colors.primary, fontWeight: '700' },
                ]}
              >
                {t('navInbox')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomTab, currentTab === 'accounts' && styles.bottomTabActive]}
              onPress={() => handleSelectTab('accounts')}
            >
              <Users
                size={19}
                color={currentTab === 'accounts' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.bottomTabText,
                  { color: colors.textMuted },
                  currentTab === 'accounts' && { color: colors.primary, fontWeight: '700' },
                ]}
              >
                {t('navAccounts')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomTab, currentTab === 'settings' && styles.bottomTabActive]}
              onPress={() => handleSelectTab('settings')}
            >
              <Settings
                size={19}
                color={currentTab === 'settings' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.bottomTabText,
                  { color: colors.textMuted },
                  currentTab === 'settings' && { color: colors.primary, fontWeight: '700' },
                ]}
              >
                {t('navSettings')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mobile Slide-out Drawer Modal */}
        {!isDesktop && (
          <Modal
            visible={mobileDrawerOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setMobileDrawerOpen(false)}
          >
            <View style={styles.modalBackdrop}>
              <SidebarNav
                currentTab={currentTab}
                onSelectTab={handleSelectTab}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                onSelectAccount={id => {
                  setSelectedAccountId(id);
                  setMobileDrawerOpen(false);
                  router.push('/inbox');
                }}
                isMobileDrawer
                onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
              />
              <TouchableOpacity
                style={styles.modalBackdropDismiss}
                onPress={() => setMobileDrawerOpen(false)}
              />
            </View>
          </Modal>
        )}

        {/* Anti-Screen Capture Privacy Veil */}
        {isPrivacyVeiled && (
          <View style={styles.privacyVeilOverlay} pointerEvents="none">
            <View style={styles.privacyVeilContent}>
              <ShieldAlert size={36} color="#1a73e8" />
              <Text style={styles.privacyVeilTitle}>Anti-Screen Capture Shield Active</Text>
              <Text style={styles.privacyVeilSub}>Sensitive OTP verification codes are hidden for privacy</Text>
            </View>
          </View>
        )}

        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      </SafeAreaView>
    </AppContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <MainAppShell />
        </ThemeProvider>
      </LanguageProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100vh' as any,
    width: '100%',
  },
  mainWrapper: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    minHeight: '100vh' as any,
  },
  contentWrapper: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  bottomBar: {
    height: Breakpoints.bottomBarHeight,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  bottomTabActive: {
    opacity: 1,
  },
  bottomTabText: {
    fontSize: 10,
    fontWeight: Typography.fontWeights.medium,
  },
  modalBackdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(5, 12, 23, 0.75)',
  },
  modalBackdropDismiss: {
    flex: 1,
  },
  errorScreen: {
    flex: 1,
    minHeight: '100vh' as any,
    backgroundColor: '#07101d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorCard: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#0a1628',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(244, 199, 106, 0.4)',
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorIconBox: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(244, 199, 106, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  errorTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: '#edf5ff',
    marginBottom: Spacing.xs,
  },
  errorSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: '#93adc8',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  errorStackScroll: {
    maxHeight: 180,
    width: '100%',
    backgroundColor: '#030812',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorStackText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#fca5a5',
  },
  errorResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#22e5ff',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  errorResetBtnText: {
    color: '#07101d',
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.sm,
  },
  privacyVeilOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)' } as any)
      : {}),
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  privacyVeilContent: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.card,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 420,
    width: '100%',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  privacyVeilTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: '#202124',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  privacyVeilSub: {
    fontSize: Typography.fontSizes.xs,
    color: '#5f6368',
    marginTop: 4,
    textAlign: 'center',
  },
});
