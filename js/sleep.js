// The Current Sleep Protocol panel: reads sleep.json (sitting next to
// index.html) and renders it, same as js/protocol.js does for the focus
// protocol. Separate data file and separate panel — this series has no
// paired metrics. To change what's shown, edit sleep.json.

import { renderPanel } from './protocol-shared.js';

renderPanel({
  url: 'sleep.json',
  bodyId: 'sleep-body',
  updatedId: 'sleep-updated',
  errorMessage: 'Couldn’t load the sleep protocol.',
});
