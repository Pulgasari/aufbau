// @aufbau/gestures/prototype.js

function onGesture (gesture, handler) {
  const name = 'on' + gesture;
  this.name(handler);
}
