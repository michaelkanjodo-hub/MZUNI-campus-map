import { useEffect, useState } from 'react';

// Local storage keeps personal data on the student's device; nothing private is
// sent to the server. Invalid/old data safely falls back to the supplied value.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be full or disabled. The current session still works.
    }
  }, [key, value]);

  return [value, setValue];
}
