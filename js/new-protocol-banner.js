// The "New Protocol" banner (currently Dopamine Detox) starts out grey
// with a "Starts on <date>" note next to the New* badge — same neutral
// dot as an item with no status at all (see .protocol-status-dot's base
// color in style.css). Once START_DATE arrives (checked client-side on
// every load, since this is a static site with no build step), it flips
// to the same green .status-running treatment used everywhere else in
// the Current Protocol Tracker, and the note disappears. To reuse this
// for a future protocol, just change START_DATE and the two element ids
// below to match index.html.

const START_DATE = '2026-10-01';

function applyNewProtocolBannerState() {
  const item = document.getElementById('dopamine-detox-item');
  const note = document.getElementById('dopamine-detox-start-note');
  if (!item) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${START_DATE}T00:00:00`);
  const started = today >= start;

  item.classList.toggle('status-running', started);
  if (note) note.style.display = started ? 'none' : '';
}

applyNewProtocolBannerState();
