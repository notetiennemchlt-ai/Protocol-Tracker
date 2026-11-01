// Everything driven by protocol.json: the "Protocols I've learned about"
// panel plus the Protocol V1 / V2 dropdowns in the far-left column. To
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
}

render();
