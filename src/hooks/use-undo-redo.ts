'use client';

import { useState, useCallback, useRef } from 'react';

interface UseUndoRedoOptions {
  maxHistory?: number;
}

export function useUndoRedo<T>(initialState: T, options: UseUndoRedoOptions = {}) {
  const { maxHistory = 50 } = options;
  const [state, setState] = useState<T>(initialState);
  const historyRef = useRef<T[]>([initialState]);
  const indexRef = useRef<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [historyLength, setHistoryLength] = useState(1);

  const push = useCallback(
    (newState: T) => {
      const newHistory = historyRef.current.slice(0, indexRef.current + 1);
      newHistory.push(newState);

      if (newHistory.length > maxHistory) {
        newHistory.shift();
      } else {
        indexRef.current = newHistory.length - 1;
      }

      historyRef.current = newHistory;
      setCurrentIndex(indexRef.current);
      setHistoryLength(newHistory.length);
      setState(newState);
    },
    [maxHistory]
  );

  const undo = useCallback(() => {
    if (indexRef.current <= 0) return;
    indexRef.current--;
    setCurrentIndex(indexRef.current);
    setState(historyRef.current[indexRef.current]);
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current >= historyRef.current.length - 1) return;
    indexRef.current++;
    setCurrentIndex(indexRef.current);
    setState(historyRef.current[indexRef.current]);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < historyLength - 1;

  return {
    state,
    setState: push,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
