// Everything driven by protocol.json: the "Protocols I've learned about"
// panel plus the Protocol V1 / V2 dropdowns in the far-left column. V3
// reads protocol-v3.json instead. To
// change what's shown, edit protocol.json — nothing here needs to change.
//
// - Learned about: bulleted list per category, color-coded, no status
//   dots (renderLearnedCategories in js/protocol-shared.js).
// - V1 / V2: the full tracker (categories, Running/Dropped dots) via the
//   shared renderCategory. V2's Personally Implemented section sits above
//   it, static in index.html.

import { renderCategory, renderLearnedCategories, fmtUpdated } from './protocol-shared.js';

async function render() {
  const learnedBody = document.getElementById('protocol-body');
  const updatedEl = document.getElementById('protocol-updated');
  const v1Body = document.getElementById('v1-body');
  const v2Body = document.getElementById('v2-body');

  try {
    const res = await fetch('protocol.json');
    if (!res.ok) throw new Error('Failed to load protocol.json');
    const data = await res.json();
    const categories = data.categories || [];

    updatedEl.textContent = data.lastUpdated ? `Last updated: ${fmtUpdated(data.lastUpdated)}` : '';
    renderLearnedCategories(categories, learnedBody);

    [v1Body, v2Body].forEach((target) => {
      target.innerHTML = '';
      categories.forEach((c) => target.appendChild(renderCategory(c)));
    });
  } catch (err) {
    console.error(err);
    updatedEl.textContent = '';
    learnedBody.innerHTML = '<p class="protocol-error">Couldn’t load the protocol.</p>';
  }

  // V3 is its own file (protocol-v3.json) since its statuses and some
  // notes differ from V1/V2. Its Personally Implemented section is just
  // the first category there, with a `caption`.
  const v3Body = document.getElementById('v3-body');
  try {
    const res = await fetch('protocol-v3.json');
    if (!res.ok) throw new Error('Failed to load protocol-v3.json');
    const data = await res.json();
    v3Body.innerHTML = '';
    (data.categories || []).forEach((c) => v3Body.appendChild(renderCategory(c)));
  } catch (err) {
    console.error(err);
    v3Body.innerHTML = '<p class="protocol-error">Couldn’t load Protocol V3.</p>';
  }
}

render();
