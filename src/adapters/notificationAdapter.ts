import { Platform } from 'react-native';
import { OtpEntry } from '../types';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const notificationAdapter = {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') return true;
        if (Notification.permission !== 'denied') {
          const res = await Notification.requestPermission();
          return res === 'granted';
        }
      }
      return false;
    }
    return true;
  },

  async sendLocalNotification(payload: NotificationPayload): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(payload.title, {
            body: payload.body,
            icon: '/favicon.png',
          });
        }
      } catch (err) {
        console.warn('[NotificationAdapter] Web notification error:', err);
      }
      return;
    }

    // On native, log notification event
    console.log('[NotificationAdapter] Native notification dispatched:', payload.title, payload.body);
  },

  async notifyOtpDetected(otp: OtpEntry): Promise<void> {
    this.playChime();
    await this.sendLocalNotification({
      title: `Live OTP: ${otp.code} (${otp.serviceName})`,
      body: `Received in ${otp.accountLabel} inbox. Ready to 1-click copy.`,
      data: { otpId: otp.id, code: otp.code },
    });
  },

  playChime(): void {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
          }
        }
      } catch {
        // audio context blocked or unsupported
      }
    }
  }
};
