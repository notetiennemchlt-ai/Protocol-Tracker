// Shared rendering for the protocol panels. Two styles: renderCategory()
// is the tracker checklist with Running/Dropped status dots (the Protocol
// V1/V2 dropdowns), renderLearnedCategories() is the plain bulleted
// "learned about" list (focus, sleep and learning panels). Shouldn't need to change when either protocol's
// content changes.

const STATUS_LABEL = {
  running: 'Running',
  dropped: 'Dropped',
  'not-started': 'Not started',
};

// Only Work Sessions uses this — an item's optional "phase" field groups it
// under a Before/During/After sub-header, in this fixed order. A category
// whose items have no "phase" renders as a flat list, no sub-headers.
const PHASE_ORDER = ['before', 'during', 'after'];
const PHASE_LABEL = { before: 'Before', during: 'During', after: 'After' };

export function fmtUpdated(iso) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderItem(item) {
  const status = STATUS_LABEL[item.status] ? item.status : 'not-started';

  const li = document.createElement('li');
  li.className = `protocol-item status-${status}`;
  // Hover tooltip for anything with a note — a quick way to see it without
  // needing extra vertical space for the small text below to wrap nicely.
  if (item.note) li.title = item.note;

  const dot = document.createElement('span');
  dot.className = 'protocol-status-dot';
  dot.setAttribute('aria-hidden', 'true');
  li.appendChild(dot);

  const body = document.createElement('div');
  body.className = 'protocol-item-body';

  const line = document.createElement('div');
  line.className = 'protocol-item-line';

  const text = document.createElement('span');
  text.className = 'protocol-item-text';
  text.textContent = item.text;
  line.appendChild(text);

  body.appendChild(line);

  // The dot alone carries Running/Not started/Dropped — note is just
  // supplementary detail (a dropped reason, a dosage, whatever), shown as
  // small text whenever present, on any item regardless of status.
  if (item.note) {
    const noteLine = document.createElement('div');
    noteLine.className = 'protocol-item-note';
    noteLine.textContent = item.note;
    body.appendChild(noteLine);
  }

  // An item's optional "subitems" list breaks it into its own bullet
  // points, in place of a single note — currently only Circadian
  // Anchoring's phases use this.
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

function renderItemList(items) {
  const list = document.createElement('ul');
  list.className = 'protocol-item-list';
  items.forEach((item) => list.appendChild(renderItem(item)));
  return list;
}

export function renderCategory(category) {
  const section = document.createElement('section');
  section.className = 'protocol-category';

  const heading = document.createElement('h3');
  heading.className = 'protocol-category-title';
  heading.textContent = category.name;
  if (category.subtitle) {
    const sub = document.createElement('span');
    sub.className = 'protocol-category-subtitle';
    sub.textContent = category.subtitle;
    heading.appendChild(sub);
  }
  section.appendChild(heading);
  // Optional one-line caption under the heading (V3's Personally
  // Implemented section uses it).
  if (category.caption) {
    const caption = document.createElement('div');
    caption.className = 'personal-caption';
    caption.textContent = category.caption;
    section.appendChild(caption);
  }

  const hasPhases = category.items.some((item) => item.phase);

  if (hasPhases) {
    PHASE_ORDER.forEach((phase) => {
      const items = category.items.filter((item) => item.phase === phase);
      if (items.length === 0) return;

      const phaseHeading = document.createElement('h4');
      phaseHeading.className = 'protocol-phase-title';
      phaseHeading.textContent = PHASE_LABEL[phase];
      section.appendChild(phaseHeading);
      section.appendChild(renderItemList(items));
    });
  } else {
    section.appendChild(renderItemList(category.items));
  }

  return section;
}

// "Learned about" rendering — a plain bulleted list per category, no
// status dots, nothing crossed off (it's what's been learned, not what's
// running). Each category gets its own color (title + bullets) from the
// --cat-1..8 ramp in style.css, by position. Notes on dropped items are
// left off since they're only the reason it was dropped.
const CATEGORY_COLORS = 8;

function renderLearnedItem(item) {
  const li = document.createElement('li');
  li.className = 'learned-item';

  const text = document.createElement('span');
  text.className = 'learned-item-text';
  text.textContent = item.text;
  li.appendChild(text);

  if (item.note && item.status !== 'dropped') {
    const note = document.createElement('div');
    note.className = 'protocol-item-note';
    note.textContent = item.note;
    li.appendChild(note);
  }

  if (item.subitems && item.subitems.length) {
    const subList = document.createElement('ul');
    subList.className = 'protocol-subitem-list';
    item.subitems.forEach((sub) => {
      const subLi = document.createElement('li');
      subLi.textContent = sub;
      subList.appendChild(subLi);
    });
    li.appendChild(subList);
  }

  return li;
}

export function renderLearnedCategories(categories, target) {
  target.innerHTML = '';
  categories.forEach((category, i) => {
    const section = document.createElement('section');
    section.className = `protocol-category learned-category cat-${(i % CATEGORY_COLORS) + 1}`;

    const heading = document.createElement('h3');
    heading.className = 'protocol-category-title';
    heading.textContent = category.name;
    section.appendChild(heading);

    const list = document.createElement('ul');
    list.className = 'learned-list';
    category.items.forEach((item) => list.appendChild(renderLearnedItem(item)));
    section.appendChild(list);

    target.appendChild(section);
  });
}

// Loads `url` and renders it as a learned-about list into #<bodyId>, with
// the "Last updated" line going into #<updatedId>. `errorMessage` is shown
// in the body if the fetch fails. Used by the Sleep and Learning panels.
export async function renderPanel({ url, bodyId, updatedId, errorMessage }) {
  const body = document.getElementById(bodyId);
  const updatedEl = document.getElementById(updatedId);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    const data = await res.json();
    updatedEl.textContent = data.lastUpdated ? `Last updated: ${fmtUpdated(data.lastUpdated)}` : '';
    renderLearnedCategories(data.categories || [], body);
  } catch (err) {
    console.error(err);
    updatedEl.textContent = '';
    body.innerHTML = `<p class="protocol-error">${errorMessage}</p>`;
  }
}
