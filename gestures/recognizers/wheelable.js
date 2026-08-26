// recognizers/wheelable.js

// normalized wheel. deltas are converted to pixels (see normalizeWheel); pass
// modifier: 'ctrl' | 'meta' | 'shift' | 'alt' to only react while it's held
// (e.g. the ctrl-wheel zoom convention). a plain building block reused by zoom.

function wheelable ({ onWheel, modifier = null } = {}) {
  const key = modifier ? MODIFIER[modifier] : null;
  const handler = event => {
    if (key && !event[key]) return;
    event.preventDefault();
    const { deltaX, deltaY } = normalizeWheel(event);
    onWheel?.({ deltaX, deltaY, event });
  };
  return { handlers: { wheel: handler } };
}

export       { wheelable };
export default wheelable;
