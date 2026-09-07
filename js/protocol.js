// The Current Protocol Tracker panel: reads protocol.json (sitting next to
// index.html) and renders it. No write path, no password. To change what's
// shown, edit protocol.json — add an item, flip a status, add a whole
// category — nothing here needs to change. Rendering itself lives in
// js/protocol-shared.js, shared with js/sleep.js.

import { renderPanel } from './protocol-shared.js';

renderPanel({
  url: 'protocol.json',
  bodyId: 'protocol-body',
  updatedId: 'protocol-updated',
  errorMessage: 'Couldn’t load the protocol.',
});
