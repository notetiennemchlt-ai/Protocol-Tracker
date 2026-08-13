import { METRICS } from './metrics.js';
import { loadAll, getEntries } from './storage.js';
import { renderChart } from './chart.js';
import { renderProtocol, initProtocolSidebar } from './protocol.js';

const cardsRoot = document.getElementById('cards');
const template = document.getElementById('card-template');

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function deltaDirection(metric, delta) {
  if (delta === 0) return 'flat';
  if (metric.direction === 'neutral') return 'flat';
  const up = delta > 0;
  const isGood = metric.direction === 'up-is-good' ? up : !up;
  return isGood ? 'good' : 'bad';
}

// ---------- cards ----------

function renderCard(metric, container) {
  const node = template.content.cloneNode(true);
  const card = node.querySelector('.card');
  card.style.setProperty('--card-accent', `var(${metric.colorVar})`);

  node.querySelector('.card-label').textContent = metric.label;
  const unitEl = node.querySelector('.card-unit');
  if (metric.unit) {
    unitEl.textContent = metric.unit;
  } else {
    unitEl.remove();
  }
  const cadenceEl = node.querySelector('.card-cadence');
  if (metric.cadence) {
    cadenceEl.textContent = metric.cadence;
  } else {
    cadenceEl.remove();
  }

  const heroValue = node.querySelector('.hero-value');
  const heroDelta = node.querySelector('.hero-delta');
  const chartEmpty = node.querySelector('.chart-empty');
  const chartSvg = node.querySelector('.chart-svg');
  const entriesList = node.querySelector('.entries-list');
  const entriesDetails = node.querySelector('.entries-details');

  const entries = getEntries(metric.id);

  if (entries.length === 0) {
    heroValue.textContent = '—';
    heroDelta.textContent = '';
    chartEmpty.style.display = '';
    chartSvg.style.display = 'none';
    entriesDetails.style.display = 'none';
  } else {
    chartEmpty.style.display = 'none';
    chartSvg.style.display = '';
    entriesDetails.style.display = '';

    const latest = entries[entries.length - 1];
    heroValue.textContent = `${Math.round(latest.value * 10) / 10}`;

    if (entries.length > 1) {
      const prev = entries[entries.length - 2];
      const delta = Math.round((latest.value - prev.value) * 10) / 10;
      const dir = deltaDirection(metric, delta);
      const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '—';
      const unitPart = metric.unit ? ` ${metric.unit}` : '';
      heroDelta.textContent = `${arrow} ${Math.abs(delta)}${unitPart} vs last entry`;
      heroDelta.className = `hero-delta ${dir}`;
    } else {
      heroDelta.textContent = 'First entry';
      heroDelta.className = 'hero-delta flat';
    }

    renderChart(chartSvg, entries, { colorVar: metric.colorVar, unit: metric.unit });

    entriesList.innerHTML = '';
    entries
      .slice()
      .reverse()
      .forEach((e) => {
        const li = document.createElement('li');
        const dateSpan = document.createElement('span');
        dateSpan.className = 'entry-date-label';
        dateSpan.textContent = fmtDate(e.date);
        const valueSpan = document.createElement('span');
        valueSpan.className = 'entry-value-label';
        valueSpan.textContent = metric.unit ? `${e.value} ${metric.unit}` : `${e.value}`;
        li.appendChild(dateSpan);
        li.appendChild(valueSpan);
        entriesList.appendChild(li);
      });
  }

  container.appendChild(node);
}

// ---------- category grouping ----------

function renderCards() {
  const groups = new Map();
  METRICS.forEach((metric) => {
    const key = metric.category || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(metric);
  });

  groups.forEach((metrics, category) => {
    const section = document.createElement('section');
    section.className = 'category-group';
    if (category) {
      const title = document.createElement('h2');
      title.className = 'category-title';
      title.textContent = category;
      section.appendChild(title);
    }
    const grid = document.createElement('div');
    grid.className = 'category-cards';
    section.appendChild(grid);
    cardsRoot.appendChild(section);
    metrics.forEach((metric) => renderCard(metric, grid));
  });
}

async function init() {
  try {
    await loadAll();
  } catch (err) {
    console.error(err);
  }
  renderCards();

  // Protocol sidebar — entirely separate data/state from the stats above,
  // wired up independently so a failure in one never affects the other.
  initProtocolSidebar();
  renderProtocol();
}

init();
