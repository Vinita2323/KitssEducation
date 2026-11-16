import { useEffect, useState } from 'react';

// Returns `value` once it has stopped changing for `delayMs`, so typing sends one search, not one per key.
// An empty value is applied immediately, so clearing a search box resets results without a delay.
export function useDebouncedValue(value, delayMs = 300) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (value === '' || value === settled) { setSettled(value); return undefined; }
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}
