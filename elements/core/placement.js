// @aufbau/elements/core/placement.js
// places a top layer popup (a popover) next to its anchor in viewport space.
// fixed coordinates, because a popover in the top layer has no positioned
// ancestor to be absolute to. flips to the other side when the preferred one
// is too small, and keeps the popup inside the viewport on the inline axis.
//
// css anchor positioning would make this obsolete once every engine ships it.

const MARGIN = 8;
const OFFSET = 4;

/**
 * @param {HTMLElement} popup
 * @param {HTMLElement} anchor
 * @param {object}  [options]
 * @param {string}  [options.placement='bottom-start']  bottom|top - start|end
 * @param {number}  [options.maxSize=240]               upper bound for the block size in px
 * @returns {'top'|'bottom'} the side actually used
 */
export function place (popup, anchor, { placement = 'bottom-start', maxSize = 240 } = {}) {
  const rect       = anchor.getBoundingClientRect();
  const viewport   = { height: window.innerHeight, width: window.innerWidth };
  const estimated  = Math.min(popup.scrollHeight || maxSize, maxSize);
  const spaceBelow = viewport.height - rect.bottom;
  const spaceAbove = rect.top;

  const wantsTop = placement.startsWith('top');
  const side     = wantsTop
    ? (spaceAbove < estimated && spaceBelow > spaceAbove ? 'bottom' : 'top')
    : (spaceBelow < estimated && spaceAbove > spaceBelow ? 'top'    : 'bottom');

  const style = popup.style;
  style.position      = 'fixed';
  style.margin        = '0';
  style.minInlineSize = `${rect.width}px`;

  // inline axis: aligned to the chosen edge of the anchor, clamped into the viewport
  const width = popup.offsetWidth;
  const left  = placement.endsWith('end') ? rect.right - width : rect.left;
  style.left  = `${Math.max(MARGIN, Math.min(left, viewport.width - width - MARGIN))}px`;
  style.right = 'auto';

  if (side === 'top') {
    style.top          = 'auto';
    style.bottom       = `${viewport.height - rect.top + OFFSET}px`;
    style.maxBlockSize = `${Math.min(spaceAbove - 3 * OFFSET, maxSize)}px`;
  } else {
    style.bottom       = 'auto';
    style.top          = `${rect.bottom + OFFSET}px`;
    style.maxBlockSize = `${Math.min(spaceBelow - 3 * OFFSET, maxSize)}px`;
  }

  return side;
}
