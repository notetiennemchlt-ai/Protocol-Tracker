// 30-day focus metrics. Reads data/metrics.json (same pattern as
// protocol.json: one file, edit it and push to add a day) and renders the
// three metric cards. To change what's tracked, edit CARDS below — the
// rendering is generic per block.

import { renderMetricChart } from './chart.js';

const DATA_URL = 'data/metrics.json';
const TOTAL_DAYS = 30;

// direction: 'up-is-good' or 'down-is-good' — which way a delta from
// baseline is colored green vs red.
// colorVar: next unused slot in the app's fixed categorical order
// (css/style.css --series-1..4) — never reassign/cycle these. --series-3
// is currently unused (freed when PVT lapses was dropped) — leave it open
// for the next metric rather than reusing it by renumbering the others.
const CARDS = [
  {
    title: 'Digit Span',
    link: 'https://humanbenchmark.now/tests/digit-span',
    subtitle: 'Average over 3 trials',
    blocks: [{ key: 'digitSpan', label: 'Digit Span', unit: '', direction: 'up-is-good', colorVar: '--series-1' }],
  },
  {
    title: 'PVT',
    link: 'https://pvt.gonzaga.edu/',
    subtitle: 'Average over three 3-minute trials',
    blocks: [{ key: 'pvtRt', label: 'Reaction Time', unit: 'ms', direction: 'down-is-good', colorVar: '--series-2' }],
  },
  {
    title: 'Minutes of Focused Learning',
    subtitle: 'Per day',
    blocks: [{ key: 'focusMinutes', label: 'Minutes of Focused Learning', unit: 'min', direction: 'up-is-good', colorVar: '--series-4' }],
  },
];

async function loadMetrics() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Failed to load metrics.json');
  return res.json();
}

function fmtDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Day X of 30, from today vs. the start date (Day 1). Before the start
// date it's Day 0 (baseline period); after day 30 it stays capped at 30.
function computeDayLabel(startDate) {
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - start) / 86400000);
  const day = Math.max(0, Math.min(diffDays + 1, TOTAL_DAYS));
  return `Day ${day} of ${TOTAL_DAYS}`;
}

// Full Day 0..30 series for one metric key, filling in null for any day
// with no entry (not reached yet, or the field was missed that day).
function seriesFor(entries, key) {
  const byDay = new Map(entries.map((e) => [e.day, e]));
  const points = [];
  for (let day = 0; day <= TOTAL_DAYS; day++) {
    const entry = byDay.get(day);
    points.push({ day, date: entry ? entry.date : null, value: entry && entry[key] != null ? entry[key] : null });
  }
  return points;
}

function deltaDirection(direction, delta) {
  if (delta === 0) return 'flat';
  const up = delta > 0;
  const isGood = direction === 'up-is-good' ? up : !up;
  return isGood ? 'good' : 'bad';
}

function renderBlock(block, points, { showLabel }) {
  const wrap = document.createElement('div');
  wrap.className = 'metric-block';

  if (showLabel) {
    const label = document.createElement('h4');
    label.className = 'metric-block-label';
    label.textContent = block.unit ? `${block.label} (${block.unit})` : block.label;
    wrap.appendChild(label);
  }

  const head = document.createElement('div');
  head.className = 'metric-block-head';

  const current = document.createElement('div');
  current.className = 'metric-current';

  const known = points.filter((p) => p.value != null);
  const baseline = points[0].value;
  const latest = known.length ? known[known.length - 1] : null;

  const valueEl = document.createElement('span');
  valueEl.className = 'metric-current-value';
  const deltaEl = document.createElement('span');
  deltaEl.className = 'metric-current-delta';

  if (!latest) {
    valueEl.textContent = '—';
    deltaEl.textContent = 'No entries yet';
    deltaEl.classList.add('flat');
  } else {
    valueEl.textContent = block.unit ? `${latest.value} ${block.unit}` : `${latest.value}`;
    if (baseline == null) {
      deltaEl.textContent = 'No baseline yet';
      deltaEl.classList.add('flat');
    } else {
      const delta = Math.round((latest.value - baseline) * 10) / 10;
      const dir = deltaDirection(block.direction, delta);
      const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '—';
      const unitPart = block.unit ? ` ${block.unit}` : '';
      deltaEl.textContent = latest.day === 0 ? 'Baseline' : `${arrow} ${Math.abs(delta)}${unitPart} vs baseline`;
      deltaEl.classList.add(dir);
    }
  }

  current.appendChild(valueEl);
  current.appendChild(deltaEl);
  head.appendChild(current);

  const tag = document.createElement('span');
  tag.className = 'metric-direction-tag';
  tag.textContent = block.direction === 'up-is-good' ? 'Higher is better' : 'Lower is better';
  head.appendChild(tag);

  wrap.appendChild(head);

  const chartWrap = document.createElement('div');
  chartWrap.className = 'metric-chart-wrap';
  chartWrap.innerHTML = `
    <div class="chart-empty">No entries yet.</div>
    <svg class="chart-svg" viewBox="0 0 560 180" preserveAspectRatio="none"></svg>
    <div class="chart-tooltip"></div>
  `;
  wrap.appendChild(chartWrap);

  const svg = chartWrap.querySelector('.chart-svg');
  const empty = chartWrap.querySelector('.chart-empty');
  const hasChart = renderMetricChart(svg, points, { colorVar: block.colorVar, unit: block.unit });
  svg.style.display = hasChart ? '' : 'none';
  empty.style.display = hasChart ? 'none' : '';

  return wrap;
}

function renderCard(card, entries) {
  const section = document.createElement('section');
  section.className = 'metric-card';

  const title = document.createElement('h3');
  title.className = 'metric-card-title';
  title.textContent = card.title;
  if (card.link) {
    const link = document.createElement('a');
    link.className = 'metric-card-link';
    link.href = card.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Take test ↗';
    title.appendChild(link);
  }
  section.appendChild(title);

  if (card.subtitle) {
    const subtitle = document.createElement('div');
    subtitle.className = 'metric-card-subtitle';
    subtitle.textContent = card.subtitle;
    section.appendChild(subtitle);
  }

  const showLabel = card.blocks.length > 1;
  card.blocks.forEach((block) => {
    section.appendChild(renderBlock(block, seriesFor(entries, block.key), { showLabel }));
  });

  return section;
}

async function renderMetrics() {
  const dayIndicator = document.getElementById('day-indicator');
  const updatedEl = document.getElementById('metrics-updated');
  const cardsRoot = document.getElementById('metric-cards');

  try {
    const data = await loadMetrics();
    dayIndicator.textContent = computeDayLabel(data.startDate);
    updatedEl.textContent = data.lastUpdated ? `Data last updated: ${fmtDate(data.lastUpdated)}` : '';
    cardsRoot.innerHTML = '';
    const entries = data.entries || [];
    CARDS.forEach((card) => cardsRoot.appendChild(renderCard(card, entries)));
  } catch (err) {
    console.error(err);
    dayIndicator.textContent = '';
    updatedEl.textContent = '';
    cardsRoot.innerHTML = '<p class="protocol-error">Couldn’t load the metrics.</p>';
  }
}

renderMetrics();
