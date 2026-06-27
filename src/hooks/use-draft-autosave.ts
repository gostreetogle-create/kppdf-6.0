'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseDraftAutosaveOptions {
  key: string;
  interval?: number;
  enabled?: boolean;
}

export function useDraftAutosave<T>(
  data: T,
  options: UseDraftAutosaveOptions
) {
  const { key, interval = 2000, enabled = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  const saveDraft = useCallback(() => {
    if (!enabled) return;
    try {
      const serialized = JSON.stringify(data);
      if (serialized !== lastSavedRef.current) {
        localStorage.setItem(`draft_${key}`, serialized);
        lastSavedRef.current = serialized;
      }
    } catch {
      console.error('Failed to save draft');
    }
  }, [data, key, enabled]);

  const loadDraft = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(`draft_${key}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      console.error('Failed to load draft');
    }
    return null;
  }, [key]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(`draft_${key}`);
    lastSavedRef.current = '';
  }, [key]);

  useEffect(() => {
    if (!enabled) return;

    timeoutRef.current = setInterval(saveDraft, interval);

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [saveDraft, interval, enabled]);

  // Сохраняем черновик при скрытии страницы (visibilitychange) —
  // не блокирует bfcache в отличие от beforeunload.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveDraft();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [saveDraft]);

  return {
    loadDraft,
    clearDraft,
    saveDraft,
  };
}
