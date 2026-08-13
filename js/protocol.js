// The "Current Protocol" sidebar — entirely separate from the metrics
// tracking in app.js/storage.js/metrics.js. It reads one static file
// (protocol.json, sitting next to index.html) and just renders it; there's
// no write path, no password, no shared state with the stats cards. To
// change what's shown, edit protocol.json — add an item, flip a status,
// add a whole category — nothing here needs to change.

const STATUS_LABEL = {
  running: 'Running',
  dropped: 'Dropped',
  'not-started': 'Not started',
};

async function loadProtocol() {
  const res = await fetch('protocol.json');
  if (!res.ok) throw new Error('Failed to load protocol.json');
  return res.json();
}

function fmtUpdated(iso) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderItem(item) {
  const status = STATUS_LABEL[item.status] ? item.status : 'not-started';

  const li = document.createElement('li');
  li.className = `protocol-item status-${status}`;
  // Hover tooltip for anything with a note — a quick way to see it without
  // needing the sidebar wide enough for the small text below to wrap nicely.
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

  // Only [daily] ever gets a badge — an item with no tag is understood to
  // be as-needed, so there's nothing to show for it.
  if (item.tag === 'daily') {
    const tag = document.createElement('span');
    tag.className = 'protocol-tag';
    tag.textContent = 'daily';
    line.appendChild(tag);
  }

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

  li.appendChild(body);
  return li;
}

function renderCategory(category) {
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

  const list = document.createElement('ul');
  list.className = 'protocol-item-list';
  category.items.forEach((item) => list.appendChild(renderItem(item)));
  section.appendChild(list);

  return section;
}

export async function renderProtocol() {
  const body = document.getElementById('protocol-body');
  const updatedEl = document.getElementById('protocol-updated');

  try {
    const data = await loadProtocol();
    updatedEl.textContent = data.lastUpdated ? `Last updated: ${fmtUpdated(data.lastUpdated)}` : '';
    body.innerHTML = '';
    (data.categories || []).forEach((category) => body.appendChild(renderCategory(category)));
  } catch (err) {
    console.error(err);
    updatedEl.textContent = '';
    body.innerHTML = '<p class="protocol-error">Couldn’t load the protocol.</p>';
  }
}

// ---------- collapse / open ----------
// Desktop: persistent and open by default, part of the page layout —
// collapsing it just shrinks it to nothing and lets the stats column take
// the space. Mobile: closed by default, opens as an overlay drawer with a
// backdrop. Same toggle button and the same `sidebar-open` class drive
// both; only the CSS differs per breakpoint (see style.css).

const MOBILE_QUERY = '(max-width: 720px)';

export function initProtocolSidebar() {
  const shell = document.getElementById('shell');
  const toggle = document.getElementById('protocol-toggle');
  const backdrop = document.getElementById('protocol-backdrop');

  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

  function setOpen(open) {
    shell.classList.toggle('sidebar-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  setOpen(!isMobile());

  toggle.addEventListener('click', () => setOpen(!shell.classList.contains('sidebar-open')));
  backdrop.addEventListener('click', () => setOpen(false));

  // Crossing the mobile breakpoint (e.g. rotating a tablet) resets to that
  // breakpoint's default rather than leaving a mobile-opened drawer stuck
  // open as a desktop layout, or vice versa.
  let lastMobile = isMobile();
  window.addEventListener('resize', () => {
    const mobile = isMobile();
    if (mobile !== lastMobile) {
      lastMobile = mobile;
      setOpen(!mobile);
    }
  });
}
