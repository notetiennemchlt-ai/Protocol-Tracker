// Everything driven by protocol.json: the "Protocols I've learned about"
// panel plus the Protocol V1 / V2 dropdowns in the far-left column. To
// change what's shown, edit protocol.json — nothing here needs to change.
//
// - Learned about: every item from every category as one flat list, no
//   categories, no status dots, nothing crossed off — it's what's been
//   learned, not what's running. Notes on dropped items are left off since
//   they're only the reason it was dropped.
// - V1 / V2: the full tracker (categories, Running/Dropped dots) via the
//   shared renderCategory in js/protocol-shared.js. V2's Personally
//   Implemented section sits above it, static in index.html.

import { renderCategory, fmtUpdated } from './protocol-shared.js';

function renderLearnedItem(item) {
  const li = document.createElement('li');
  li.className = 'protocol-item learned-item';

  const body = document.createElement('div');
  body.className = 'protocol-item-body';

  const text = document.createElement('span');
  text.className = 'protocol-item-text';
  text.textContent = item.text;
  body.appendChild(text);

  if (item.note && item.status !== 'dropped') {
    const note = document.createElement('div');
    note.className = 'protocol-item-note';
    note.textContent = item.note;
    body.appendChild(note);
  }

  if (item.subitems && item.subitems.length) {
    const subList = document.createElement('ul');
    subList.className = 'protocol-subitem-list';
    item.subitems.forEach((sub) => {
      const subLi = document.createElement('li');
      subLi.textContent = sub;
      subList.appendChild(subLi);
    });
    body.appendChild(subList);
  }

  li.appendChild(body);
  return li;
}

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

    const list = document.createElement('ul');
    list.className = 'protocol-item-list';
    categories.forEach((c) => c.items.forEach((item) => list.appendChild(renderLearnedItem(item))));
    learnedBody.innerHTML = '';
    learnedBody.appendChild(list);

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
