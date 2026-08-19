import { Dispatch, SetStateAction, useEffect, useState } from "react";

/**
 * React hook for persisting a state variable to `sessionStorage`.
 *
 * Every read and write is guarded. Two things made the unguarded version a
 * real hazard rather than a theoretical one:
 *
 *  - `JSON.parse` on a truncated or stale value throws, and it threw inside
 *    the root component's `useState` initializer — above every route, with
 *    no error boundary anywhere. React unmounted the whole tree, and since
 *    the bad value stayed in storage, every reload reproduced the blank
 *    page. The player had no way back, not even "Start på nytt".
 *  - `sessionStorage` itself throws when a browser is configured to block
 *    site data. That is a setting, not a corruption, and the game works
 *    perfectly well without persistence — it should degrade to in-memory
 *    state rather than refuse to start.
 *
 * @template T Type of the stored value.
 * @param key Storage key used in `sessionStorage`.
 * @param defaultValue Value to use if nothing valid is stored.
 */
export function useSessionState<T>(
  key: string,
  defaultValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => read(key, defaultValue));

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage blocked or full: the session simply is not persisted
    }
  }, [key, value]);

  return [value, setValue];
}

/**
 * Reads and parses one key, falling back to the default on anything
 * unexpected — and clearing the offending value so the next load starts
 * clean instead of hitting the same problem forever.
 */
function read<T>(key: string, defaultValue: T): T {
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(key);
  } catch {
    return defaultValue;
  }
  if (stored === null) return defaultValue;

  try {
    const parsed = JSON.parse(stored) as T;
    // A value of a different shape than the default is left over from an
    // older deploy. `typeof` is coarse, but it catches the cases that
    // actually occur: a bare number where a Year string is expected, and
    // null where an object is.
    if (parsed === null || typeof parsed !== typeof defaultValue) {
      throw new Error("stale shape");
    }
    return parsed;
  } catch {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Nothing more we can do; the default is still returned
    }
    return defaultValue;
  }
}
