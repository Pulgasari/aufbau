const HORIZONTAL = { ArrowLeft: -1, ArrowRight: 1 };
const VERTICAL   = { ArrowDown: 1, ArrowUp: -1 };

export function nextIndex (key, current, length, { sideways = true } = {}) {
  if (key === 'Home') return 0;
  if (key === 'End')  return length - 1;

  const step = VERTICAL[key] ?? (sideways ? HORIZONTAL[key] : undefined);
  if (!step) return null;
  if (current < 0) return 0;

  return (current + step + length) % length;
}
