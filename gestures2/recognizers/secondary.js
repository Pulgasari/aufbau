// @aufbau/gestures2/recognizers/secondary.js
// the intent to see options, from the native contextmenu: right click, a long
// press where the platform fires one, the menu key, shift+f10. not tracked by
// the session, the platform already decided. the native menu is prevented,
// `nativeMenu: true` keeps it.

function secondary ({ element, emit, options }) {
  const { nativeMenu = false } = options;

  const inputOf = event => event.pointerType || (event.button === -1 || (event.detail === 0 && event.clientX === 0 && event.clientY === 0) ? 'keyboard' : 'mouse');

  function contextmenu (event) {
    if (!nativeMenu) event.preventDefault();
    const point = { x: event.clientX, y: event.clientY };
    emit('secondary', null, {
      center    : point,
      element,
      input     : inputOf(event),
      modifiers : { alt: event.altKey, control: event.ctrlKey, meta: event.metaKey, shift: event.shiftKey },
      start     : point,
      target    : event.target,
    }, event);
  }

  element.addEventListener('contextmenu', contextmenu);

  return {
    destroy: () => element.removeEventListener('contextmenu', contextmenu),
  };
}

secondary.gestures = ['secondary'];

export { secondary };
export default secondary;
