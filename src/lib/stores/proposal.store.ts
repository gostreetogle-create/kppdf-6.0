/**
 * Zustand store для autosave редактора КП (МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ §8 «Автосохранение черновика»):
 * - `persist` middleware: мгновенная запись в localStorage при ЛЮБОМ изменении (refresh-proof).
 * - `scheduleAutosave(id, payload)`: debounce 7 сек → POST/PUT на сервер. Каждое новое изменение сбрасывает таймер.
 * - `saveStatus` для AutosaveIndicator: 'idle' → 'saving' → 'saved' | 'error'.
 *
 * Тестирование: vi.useFakeTimers() + явный вызов fakeDebouncedFn → проверка, что PUT вызван ровно 1 раз.
 */
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** 7 секунд debounce — компромисс между UX (быстрое сохранение при печати) и нагрузкой на сервер.
 *  Согласовано с правкой C из МОДУЛЬ-дока: 5–10 сек.
 */

import type { SerializedProposal } from '@/lib/serialize';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface ProposalDraftState {
  /** Текущий draft в watch-edit. Поля соответствуют SerializedProposal но items могут быть dirty. */
  draft: SerializedProposal | null;
  /** Есть ли локальные изменения с момента последнего успешного PUT. UI/editor использует для решения
   *  — вызывать ли scheduleAutosave. Без этого флага useEffect на [draft] триггерит бесконечный цикл PUT
   *  после успешного setDraft(serverResponse.updated): server возвращает новый draft → useEffect re-fires
   *  → scheduleAutosave шлёт ещё один PUT в фоне каждые 7с, даже если user не редактирует.
   */
  pendingDirty: boolean;
  /** Статус последней попытки сохранения. */
  saveStatus: SaveStatus;
  /** Timestamp последнего успешного сохранения (для индикатора «✓ Сохранено 14:32»). */
  lastSavedAt: number | null;
  /** Сообщение об ошибке если saveStatus === 'error'. */
  errorMessage: string | null;
  /** Установить draft (вызывается при mount редактора). */
  setDraft: (draft: SerializedProposal | null) => void;
  /** Patch одной позиции (inline edit в таблице). */
  updateItem: (itemId: string, patch: Partial<SerializedProposal['items'][number]>) => void;
  /** Удалить позицию из draft. */
  removeItem: (itemId: string) => void;
  /** Добавить новую позицию в draft (id назначит сервер при PUT). */
  addItem: (item: SerializedProposal['items'][number]) => void;
  /** Изменить поле метаданных (title, vatRate, notes и т.д.). */
  updateMeta: (patch: Partial<SerializedProposal>) => void;
  /** Запустить debounced autosave. Возвращает timer id (для тестов и cleanup). */
  scheduleAutosave: (
    proposalId: string,
    sendPut: (id: string, body: unknown) => Promise<void>,
  ) => () => void;
  /** Сбросить статус (например после retry). */
  setSaveStatus: (status: SaveStatus, errorMessage?: string | null) => void;
  /** Очистить всё (logout / unmount). */
  reset: () => void;
}

/** Debounce timeout в milliseconds. Вынесено в named export для тестов с vi.useFakeTimers. */
export const AUTOSAVE_DEBOUNCE_MS = 7000;

export const useProposalStore = create<ProposalDraftState>()(
  persist(
    (set, get) => {
      // Локальная переменная в замыкании стора — protects от cross-instance state.
      let pendingTimer: ReturnType<typeof setTimeout> | null = null;

      const cancelPending = (): void => {
        if (pendingTimer != null) {
          clearTimeout(pendingTimer);
          pendingTimer = null;
        }
      };

      return {
        draft: null,
        pendingDirty: false,
        saveStatus: 'idle',
        lastSavedAt: null,
        errorMessage: null,

        setDraft: (draft) =>
          set({ draft, pendingDirty: false, saveStatus: 'idle', errorMessage: null }),
        updateItem: (itemId, patch) =>
          set((state) => {
            if (!state.draft) return state;
            const items = state.draft.items.map((it) =>
              it.id === itemId ? { ...it, ...patch } : it,
            );
            return { draft: { ...state.draft, items }, pendingDirty: true, saveStatus: 'idle' };
          }),
        removeItem: (itemId) =>
          set((state) => {
            if (!state.draft) return state;
            return {
              draft: { ...state.draft, items: state.draft.items.filter((it) => it.id !== itemId) },
              pendingDirty: true,
              saveStatus: 'idle',
            };
          }),
        addItem: (item) =>
          set((state) => {
            if (!state.draft) return state;
            return {
              draft: { ...state.draft, items: [...state.draft.items, item] },
              pendingDirty: true,
              saveStatus: 'idle',
            };
          }),
        updateMeta: (patch) =>
          set((state) => {
            if (!state.draft) return state;
            return { draft: { ...state.draft, ...patch }, pendingDirty: true, saveStatus: 'idle' };
          }),
        setSaveStatus: (status, errorMessage = null) =>
          set({ saveStatus: status, errorMessage, lastSavedAt: status === 'saved' ? Date.now() : get().lastSavedAt }),

        scheduleAutosave: (proposalId, sendPut) => {
          cancelPending();
          set({ saveStatus: 'saving', errorMessage: null });

          // Capture current draft snapshot at the time of schedule.
          const snapshot = get().draft;
          if (!snapshot) {
            set({ saveStatus: 'idle' });
            return () => {};
          }
          // Skip если pendingDirty=false — этот вариант возникает после успешного setDraft(serverResponse),
          // когда React re-render триггерит useEffect, но реальных локальных изменений нет.
          if (!get().pendingDirty) {
            set({ saveStatus: 'idle' });
            return () => {};
          }

          // Persist lastUpdatedAt string from snapshot, server will compare for optimistic lock.
          const body = {
            lastUpdatedAt: snapshot.updatedAt,
            designSnapshot: snapshot,
          };

          const run = async () => {
            try {
              // PUT body включает optimization snapshot (designSnapshot + lastUpdatedAt).
              // Серверный response (sent PUT return) синхронизирует draft.updatedAt через setDraft из caller'а.
              await sendPut(proposalId, body);
              // Очищаем pendingDirty только если в snapshot не появилось новых локальных изменений
              // за время in-flight PUT (race-condition guard от потери keystrokes).
              const stillSameDraft = get().draft === snapshot;
              set({
                saveStatus: 'saved',
                lastSavedAt: Date.now(),
                errorMessage: null,
                pendingDirty: !stillSameDraft,
              });
              // ВАЖНО: НЕ мутируем draft.updatedAt здесь — это вызовет useEffect re-fire → infinite autosave loop.
              // Обновление updatedAt должно прийти из caller через setDraft.
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Save failed';
              set({ saveStatus: 'error', errorMessage: message, pendingDirty: true });
            }
          };

          pendingTimer = setTimeout(() => {
            pendingTimer = null;
            void run();
          }, AUTOSAVE_DEBOUNCE_MS);

          return cancelPending;
        },
        reset: () => {
          cancelPending();
          set({
            draft: null,
            pendingDirty: false,
            saveStatus: 'idle',
            lastSavedAt: null,
            errorMessage: null,
          });
        },
      };
    },
    {
      name: 'kp-draft-storage',
      storage: createJSONStorage(() => localStorage),
      // Не persistить runtime-only поля (status, pendingDirty, errors).
      partialize: (state) => ({
        draft: state.draft,
        lastSavedAt: state.lastSavedAt,
      }),
      version: 1,
    },
  ),
);

/** Selector helper — подписка только на draft (для производительности при больших items). */
export const selectDraft = (s: ProposalDraftState) => s.draft;
/** Selector для AutosaveIndicator. */
export const selectSaveStatus = (s: ProposalDraftState) => ({
  status: s.saveStatus,
  error: s.errorMessage,
  lastSavedAt: s.lastSavedAt,
});
