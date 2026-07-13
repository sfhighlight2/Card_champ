import { useState } from "react";

type Updater<T> = T | ((prev: T) => T);

function resolve<T>(next: Updater<T>, prev: T): T {
  return next instanceof Function ? next(prev) : next;
}

function readSeed<T>(initialValue: T | (() => T)): T {
  const value = initialValue instanceof Function ? initialValue() : initialValue;
  return structuredClone(value);
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (next: Updater<T>) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // corrupted JSON — fall through to seeding
    }
    const seed = readSeed(initialValue);
    try {
      window.localStorage.setItem(key, JSON.stringify(seed));
    } catch {
      // localStorage unavailable (e.g. private mode) — keep in-memory only
    }
    return seed;
  });

  const setAndPersist = (next: Updater<T>) => {
    setValue(prev => {
      const resolved = resolve(next, prev);
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch (err) {
        console.warn(`useLocalStorage: failed to persist "${key}"`, err);
      }
      return resolved;
    });
  };

  return [value, setAndPersist];
}
