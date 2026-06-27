import { create } from 'zustand';
import type { CurrentUser } from '@/types';
import {
  createRefreshScheduler,
  DEFAULT_REFRESH_LEAD_MS,
  type RefreshScheduler,
} from './auth-refresh';

interface AuthState {
  user: CurrentUser | null;
  isLoading: boolean;
  /**
   * Access token expiry timestamp (ms epoch). NULL = unknown / not yet
   * hydrated / logged out. Tracked для silent preemptive refresh в cycle 50.
   */
  tokenExpiresAt: number | null;
  setUser: (user: CurrentUser | null, tokenExpiresAt?: number | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

/**
 * Module-level silent refresh scheduler. Один instance для всего app —
 * timer handle shared across all subscribers через useAuthStore.
 */
let scheduler: RefreshScheduler | null = null;
function getScheduler(): RefreshScheduler {
  if (!scheduler) {
    scheduler = createRefreshScheduler(async () => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' });
        if (!res.ok) {
          // Refresh failed (revoked/expired refresh token или 401). Force logout.
          useAuthStore.getState().logout();
          return;
        }
        const data = (await res.json()) as { expiresAt?: number };
        const newExpiry =
          typeof data?.expiresAt === 'number' ? data.expiresAt : null;
        useAuthStore.setState({ tokenExpiresAt: newExpiry });
        if (newExpiry !== null && scheduler) {
          scheduler.schedule(newExpiry, DEFAULT_REFRESH_LEAD_MS);
        }
      } catch (err) {
        // Network failure — keep current session. Next user action will
        // naturally trigger 401 если token реально expired.
        console.warn('[auth-store] silent refresh network error:', err);
      }
    });
  }
  return scheduler;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  tokenExpiresAt: null,
  setUser: (user, tokenExpiresAt = null) => {
    set({ user, isLoading: false, tokenExpiresAt });
    const s = getScheduler();
    if (user && tokenExpiresAt !== null) {
      // Login / hydration: schedule preemptive refresh.
      s.schedule(tokenExpiresAt, DEFAULT_REFRESH_LEAD_MS);
    } else {
      // No user or no expiry known — clear pending timer.
      s.clear();
    }
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    getScheduler().clear();
    set({ user: null, isLoading: false, tokenExpiresAt: null });
    fetch('/api/auth/login', { method: 'DELETE' }).then(() => {
      window.location.href = '/login';
    });
  },
}));
