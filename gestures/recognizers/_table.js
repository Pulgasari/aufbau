// recognizers/table.js
// SCRATCHFILE | DO NOT CARE

/*
what index.js needs to know before any recognizer is loaded:
who reports which gesture, who goes first, and how to load it.
*/

export const RECOGNIZERS = {
  doubleTapDrag : { gestures: ['doubleTapDragCancel', 'doubleTapDragEnd', 'doubleTapDragMove', 'doubleTapDragStart'], load: () => import('./doubleTapDrag.js'), priority: 1 },
  edgeSwipe     : { gestures: ['edgeSwipeCancel', 'edgeSwipeEnd', 'edgeSwipeMove', 'edgeSwipeStart'],                 load: () => import('./edgeSwipe.js'),     priority: 1 },
  longPress     : { gestures: ['longPress'],                                                                           load: () => import('./longPress.js') },
  pan           : { gestures: ['panCancel', 'panEnd', 'panMove', 'panStart'],                                           load: () => import('./pan.js') },
  pinch         : { gestures: ['pinchCancel', 'pinchEnd', 'pinchMove', 'pinchStart'],                                   load: () => import('./pinch.js') },
  press         : { gestures: ['pressCancel', 'pressEnd', 'pressRepeat', 'pressStart'],                                 load: () => import('./press.js') },
  rotate        : { gestures: ['rotateCancel', 'rotateEnd', 'rotateMove', 'rotateStart'],                               load: () => import('./rotate.js') },
  secondary     : { gestures: ['secondary'],                                                                           load: () => import('./secondary.js') },
  swipe         : { gestures: ['swipe', 'swipeDown', 'swipeLeft', 'swipeRight', 'swipeUp'],                             load: () => import('./swipe.js') },
  tap           : { gestures: ['doubleTap', 'tap', 'twoFingerTap'],                                                    load: () => import('./tap.js') },
  wheel         : { gestures: ['wheelEnd', 'wheelMove', 'wheelStart'],                                                 load: () => import('./wheel.js') },
};

// gesture -> recognizer: doubleTap -> tap, swipeLeft -> swipe
export const 
OWNERS = Object.fromEntries(Object.entries(RECOGNIZERS).flatMap(([name, { gestures }]) => gestures.map(gesture => [gesture, name])));

export const RECOGNIZERS = {
  doubleTapDrag: { 
    gestures: ['doubleTapDragCancel', 'doubleTapDragEnd', 'doubleTapDragMove', 'doubleTapDragStart'], 
    load: () => import('./doubleTapDrag.js'), 
    priority: 1 
  },
  edgeSwipe: {
    gestures: ['edgeSwipeCancel', 'edgeSwipeEnd', 'edgeSwipeMove', 'edgeSwipeStart'], 
    load: () => import('./edgeSwipe.js'),
    priority: 1
  },
  longPress: {
    gestures: ['longPress'], 
    load: () => import('./longPress.js') 
  },
  pan: {
    gestures: ['panCancel', 'panEnd', 'panMove', 'panStart'], 
    load: () => import('./pan.js') 
  },
  pinch: { 
    gestures: ['pinchCancel', 'pinchEnd', 'pinchMove', 'pinchStart'],
    load: () => import('./pinch.js')
  },
  press: { 
    gestures: ['pressCancel', 'pressEnd', 'pressRepeat', 'pressStart'],
    load: () => import('./press.js')
  },
  rotate: { 
    gestures: ['rotateCancel', 'rotateEnd', 'rotateMove', 'rotateStart'], 
    load: () => import('./rotate.js') 
  },
  secondary: { gestures: ['secondary'],                                                                           load: () => import('./secondary.js') },
  swipe: { gestures: ['swipe', 'swipeDown', 'swipeLeft', 'swipeRight', 'swipeUp'],                             load: () => import('./swipe.js') },
  tap: { gestures: ['doubleTap', 'tap', 'twoFingerTap'],                                                    load: () => import('./tap.js') },
  wheel: { gestures: ['wheelEnd', 'wheelMove', 'wheelStart'],                                                 load: () => import('./wheel.js') },
};
