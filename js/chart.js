// Hand-rolled SVG line chart. Mark specs (2px line, >=8px end-dot with a 2px
// surface ring, ~10% opacity area fill, hairline solid gridlines, sparing
// direct labels) follow the dataviz skill rather than a chart library.

const SVG_NS = 'http://www.w3.org/2000/svg';
const VBW = 560;
const VBH = 180;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 14;
const PAD_B = 24;

function el(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function fmtValue(v, unit) {
  const rounded = Math.round(v * 10) / 10;
  return `${rounded}${unit ? ' ' + unit : ''}`;
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function renderChart(svg, entries, { colorVar, unit }) {
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${VBW} ${VBH}`);
  if (entries.length === 0) return;

  const seriesColor = cssVar(colorVar);
  const gridColor = cssVar('--gridline');
  const surface = cssVar('--surface-1');
  const textMuted = cssVar('--text-muted');
  const textSecondary = cssVar('--text-secondary');

  const values = entries.map((e) => e.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = (rawMax - rawMin) * 0.15 || Math.abs(rawMax) * 0.05 || 1;
  const min = rawMin - pad;
  const max = rawMax + pad;

  const dates = entries.map((e) => new Date(e.date + 'T00:00:00').getTime());
  const minT = Math.min(...dates);
  const maxT = Math.max(...dates);
  const spanT = maxT - minT || 1;

  const chartW = VBW - PAD_L - PAD_R;
  const chartH = VBH - PAD_T - PAD_B;

  function xFor(i) {
    if (entries.length === 1) return PAD_L + chartW / 2;
    return PAD_L + ((dates[i] - minT) / spanT) * chartW;
  }
  function yFor(v) {
    return PAD_T + chartH - ((v - min) / (max - min)) * chartH;
  }

  // gridlines: min / mid / max, with small muted value labels
  [min + pad, (min + max) / 2, max - pad].forEach((v, i) => {
    const y = yFor(i === 0 ? rawMin : i === 2 ? rawMax : v);
    svg.appendChild(
      el('line', { x1: PAD_L, x2: VBW - PAD_R, y1: y.toFixed(1), y2: y.toFixed(1), stroke: gridColor, 'stroke-width': 1 })
    );
    const label = el('text', { x: PAD_L - 8, y: (y + 3).toFixed(1), 'text-anchor': 'end', class: 'chart-axis-label' });
    label.setAttribute('fill', textMuted);
    label.textContent = Math.round((i === 0 ? rawMin : i === 2 ? rawMax : v) * 10) / 10;
    svg.appendChild(label);
  });

  const points = entries.map((e, i) => [xFor(i), yFor(e.value)]);

  // area fill (~10% opacity wash down to the baseline)
  const baseline = PAD_T + chartH;
  const areaPts = [[points[0][0], baseline], ...points, [points[points.length - 1][0], baseline]];
  const area = el('polygon', { points: areaPts.map((p) => p.join(',')).join(' ') });
  area.setAttribute('fill', seriesColor);
  area.setAttribute('opacity', '0.1');
  svg.appendChild(area);

  // line
  const line = el('polyline', { points: points.map((p) => p.join(',')).join(' '), fill: 'none', 'stroke-width': 2 });
  line.setAttribute('stroke', seriesColor);
  line.setAttribute('stroke-linejoin', 'round');
  line.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line);

  // end dot with a surface-color ring
  const [lastX, lastY] = points[points.length - 1];
  const dot = el('circle', { cx: lastX.toFixed(1), cy: lastY.toFixed(1), r: 5, 'stroke-width': 2 });
  dot.setAttribute('fill', seriesColor);
  dot.setAttribute('stroke', surface);
  svg.appendChild(dot);

  // direct label at the end point
  const endLabel = el('text', {
    x: Math.min(lastX + 8, VBW - 4),
    y: (lastY - 10).toFixed(1),
    'text-anchor': lastX + 8 > VBW - 40 ? 'end' : 'start',
    class: 'chart-end-label',
  });
  endLabel.setAttribute('fill', textSecondary);
  endLabel.textContent = fmtValue(entries[entries.length - 1].value, unit);
  svg.appendChild(endLabel);

  // crosshair (hidden until hover)
  const crosshair = el('line', {
    x1: 0, x2: 0, y1: PAD_T, y2: baseline,
    stroke: gridColor, 'stroke-width': 1, opacity: 0,
  });
  svg.appendChild(crosshair);
  const hoverDot = el('circle', { r: 5, 'stroke-width': 2, opacity: 0 });
  hoverDot.setAttribute('fill', seriesColor);
  hoverDot.setAttribute('stroke', surface);
  svg.appendChild(hoverDot);

  // hit layer
  const hit = el('rect', { x: PAD_L, y: PAD_T, width: chartW, height: chartH, fill: 'transparent' });
  svg.appendChild(hit);

  const tooltip = svg.parentElement.querySelector('.chart-tooltip');

  function nearestIndex(pointerX) {
    let best = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p[0] - pointerX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }

  function showAt(i) {
    const [px, py] = points[i];
    crosshair.setAttribute('x1', px.toFixed(1));
    crosshair.setAttribute('x2', px.toFixed(1));
    crosshair.setAttribute('opacity', '1');
    hoverDot.setAttribute('cx', px.toFixed(1));
    hoverDot.setAttribute('cy', py.toFixed(1));
    hoverDot.setAttribute('opacity', '1');

    tooltip.textContent = '';
    const valueEl = document.createElement('div');
    valueEl.className = 'chart-tooltip-value';
    valueEl.textContent = fmtValue(entries[i].value, unit);
    const dateEl = document.createElement('div');
    dateEl.className = 'chart-tooltip-date';
    dateEl.textContent = fmtDate(entries[i].date);
    tooltip.appendChild(valueEl);
    tooltip.appendChild(dateEl);

    const pct = px / VBW;
    tooltip.style.left = `${pct * 100}%`;
    tooltip.style.top = `${(py / VBH) * 100}%`;
    tooltip.classList.add('visible');
  }

  function hide() {
    crosshair.setAttribute('opacity', '0');
    hoverDot.setAttribute('opacity', '0');
    tooltip.classList.remove('visible');
  }

  hit.addEventListener('pointermove', (e) => {
    const rect = svg.getBoundingClientRect();
    const scaleX = VBW / rect.width;
    const pointerX = (e.clientX - rect.left) * scaleX;
    showAt(nearestIndex(pointerX));
  });
  hit.addEventListener('pointerleave', hide);
}
