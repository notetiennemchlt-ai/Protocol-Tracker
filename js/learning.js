// The Enforce Learning panel: reads learning.json (sitting next to
// index.html) and renders it, same pattern as js/protocol.js and
// js/sleep.js. Split out of protocol.json into its own file/panel since
// it's about learning technique, not focus/motivation — see the
// Current Protocol Tracker's own file for that content. To change what's
// shown, edit learning.json.

import { renderPanel } from './protocol-shared.js';

renderPanel({
  url: 'learning.json',
  bodyId: 'learning-body',
  updatedId: 'learning-updated',
  errorMessage: 'Couldn’t load the learning protocol.',
});
