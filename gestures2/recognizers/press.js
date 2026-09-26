// @aufbau/gestures2/recognizers/press.js
// the contact itself, for immediate feedback: pressStart when the first pointer
// goes down, pressEnd when the last one comes up, pressCancel when the browser
// takes it. what :active is for the mouse, for every input. it decides nothing
// and claims nothing, the other recognizers run as usual.

function press ({ emit }) {
  return {
    start       : session => emit('pressStart',  session),
    end         : session => emit('pressEnd',    session),
    cancel      : session => emit('pressCancel', session),
    touchAction : 'manipulation',
  };
}

press.gestures = ['pressCancel', 'pressEnd', 'pressStart'];

export { press };
export default press;
