import { Pop } from './pop/Pop.js';

// any content over the page, not modal: closes on a click outside or escape.
//   <btn-tap command="toggle-popover" commandfor="info">Info</btn-tap>
//   <pop-over id="info">…</pop-over>
export default class PopOver extends Pop {}

PopOver.init();
