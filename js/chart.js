// Hand-rolled SVG line chart for the focus metrics. Mark specs (2px line,
// >=8px marker with a 2px surface ring, ~10% opacity area fill, hairline
// solid gridlines, sparing direct labels) follow the dataviz skill.
//
// One axis, x always running Day 0 -> maxDay (passed in by the caller —
// see js/metrics.js's adaptiveTotalDays, which ages it from 30 up to 60
// in 15-day steps as the challenge runs on, then holds there). Points are
// given for every day in that range with value: null where a day hasn't
// been reached or was missed — the line and area skip those days
// entirely, drawing a straight run from the last known point to the next
// rather than a gap or a drop to zero.

const SVG_NS = 'http://www.w3.org/2000/svg';
const VBW = 560;
const VBH = 180;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 16;
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
  if (v == null) return '—';
  const rounded = Math.round(v * 10) / 10;
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// points: [{ day, value, date }] for day 0..maxDay (value/date null where
// there's no entry). Returns true if it drew a chart, false if there's no
// data yet (caller shows the empty state instead).
export function renderMetricChart(svg, points, { colorVar, unit, maxDay = 30 }) {
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${VBW} ${VBH}`);

  const known = points.filter((p) => p.value != null);
  if (known.length === 0) return false;

  const seriesColor = cssVar(colorVar);
  const baselineColor = cssVar('--text-secondary');
  const gridColor = cssVar('--gridline');
  const surface = cssVar('--surface-1');
  const textMuted = cssVar('--text-muted');
  const textSecondary = cssVar('--text-secondary');

  const values = known.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = (rawMax - rawMin) * 0.15 || Math.abs(rawMax) * 0.05 || 1;
  const min = rawMin - pad;
  const max = rawMax + pad;

  const chartW = VBW - PAD_L - PAD_R;
  const chartH = VBH - PAD_T - PAD_B;

  const xFor = (day) => PAD_L + (day / maxDay) * chartW;
  const yFor = (v) => PAD_T + chartH - ((v - min) / (max - min)) * chartH;

  // y gridlines: min / mid / max of the actual data, with muted value labels
  [rawMin, (rawMin + rawMax) / 2, rawMax].forEach((v) => {
    const y = yFor(v);
    svg.appendChild(
      el('line', { x1: PAD_L, x2: VBW - PAD_R, y1: y.toFixed(1), y2: y.toFixed(1), stroke: gridColor, 'stroke-width': 1 })
    );
    const label = el('text', { x: PAD_L - 8, y: (y + 3).toFixed(1), 'text-anchor': 'end', class: 'chart-axis-label' });
    label.setAttribute('fill', textMuted);
    label.textContent = Math.round(v * 10) / 10;
    svg.appendChild(label);
  });

  // x-axis: Day 0, every 15 days, up through maxDay — maxDay itself grows
  // (30 -> 45 -> 60) as the challenge runs on, so this just naturally picks
  // up more ticks rather than needing its own separate stepping logic.
  const xTicks = [];
  for (let d = 0; d < maxDay; d += 15) xTicks.push(d);
  xTicks.push(maxDay);
  xTicks.forEach((d) => {
    const x = xFor(d);
    const label = el('text', {
      x: x.toFixed(1),
      y: VBH - 6,
      'text-anchor': d === 0 ? 'start' : d === maxDay ? 'end' : 'middle',
      class: 'chart-axis-label',
    });
    label.setAttribute('fill', textMuted);
    label.textContent = `Day ${d}`;
    svg.appendChild(label);
  });

  const baselineY = PAD_T + chartH;

  // Day 30 divider — "New protocol", a fixed reference line shown on
  // every chart (not just when Day 30 itself has a value) so all three
  // metrics read against the same before/after split. Drawn behind the
  // line/area/markers (before them in document order) so real data stays
  // visually on top of it. Label sits small, horizontal, and centered
  // right above the line's own top end, in the PAD_T margin above the
  // plot area rather than crossing through it.
  if (maxDay >= 30) {
    const dividerX = xFor(30);
    svg.appendChild(
      el('line', {
        x1: dividerX.toFixed(1),
        x2: dividerX.toFixed(1),
        y1: PAD_T,
        y2: baselineY,
        stroke: textMuted,
        'stroke-width': 1,
        'stroke-dasharray': '3,3',
      })
    );
    const dividerLabel = el('text', {
      x: dividerX.toFixed(1),
      y: (PAD_T - 5).toFixed(1),
      'text-anchor': 'middle',
      class: 'chart-divider-label',
    });
    dividerLabel.setAttribute('fill', textMuted);
    dividerLabel.textContent = 'New protocol';
    svg.appendChild(dividerLabel);
  }

  // line + area — one continuous run across all known points, so a missed
  // day (filtered out of `known`) draws a straight line to the next data
  // point instead of a gap or a drop to zero.
  const pts = known.map((p) => [xFor(p.day), yFor(p.value)]);
  if (pts.length > 1) {
    const areaPts = [[pts[0][0], baselineY], ...pts, [pts[pts.length - 1][0], baselineY]];
    const area = el('polygon', { points: areaPts.map((p) => p.join(',')).join(' ') });
    area.setAttribute('fill', seriesColor);
    area.setAttribute('opacity', '0.1');
    svg.appendChild(area);
  }
  const line = el('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', 'stroke-width': 2 });
  line.setAttribute('stroke', seriesColor);
  line.setAttribute('stroke-linejoin', 'round');
  line.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line);

  // markers — one per known point (data is sparse: at most 31 days), each
  // with a surface-color ring so they stay legible crossing the line.
  // Day 0 (baseline) gets a visually distinct muted marker + direct label.
  const latestDay = known[known.length - 1].day;
  known.forEach((p) => {
    const isBaseline = p.day === 0;
    const isLatest = p.day === latestDay;
    const x = xFor(p.day);
    const y = yFor(p.value);

    const dot = el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: isBaseline ? 5 : 4, 'stroke-width': 2 });
    dot.setAttribute('fill', isBaseline ? baselineColor : seriesColor);
    dot.setAttribute('stroke', surface);
    svg.appendChild(dot);

    if (isBaseline) {
      const label = el('text', { x: x.toFixed(1), y: (y - 12).toFixed(1), 'text-anchor': 'start', class: 'chart-baseline-label' });
      label.setAttribute('fill', textMuted);
      label.textContent = `Baseline · ${fmtValue(p.value, unit)}`;
      svg.appendChild(label);
    } else if (isLatest) {
      const label = el('text', {
        x: Math.min(x + 8, VBW - 4),
        y: (y - 10).toFixed(1),
        'text-anchor': x + 8 > VBW - 40 ? 'end' : 'start',
        class: 'chart-end-label',
      });
      label.setAttribute('fill', textSecondary);
      label.textContent = fmtValue(p.value, unit);
      svg.appendChild(label);
    }
  });

  // crosshair + tooltip (hidden until hover). Hoverable range is every day
  // from the first known point through the last — including a skipped day
  // like Day 6, which sits right on the straight line drawn through it.
  // Its value there is interpolated only to place the dot on that line;
  // the tooltip says "No data" rather than showing a made-up number.
  const crosshair = el('line', { x1: 0, x2: 0, y1: PAD_T, y2: baselineY, stroke: gridColor, 'stroke-width': 1, opacity: 0 });
  svg.appendChild(crosshair);
  const hoverDot = el('circle', { r: 5, 'stroke-width': 2, opacity: 0 });
  hoverDot.setAttribute('stroke', surface);
  svg.appendChild(hoverDot);

  const hit = el('rect', { x: PAD_L, y: PAD_T, width: chartW, height: chartH, fill: 'transparent' });
  svg.appendChild(hit);

  const tooltip = svg.parentElement.querySelector('.chart-tooltip');
  const firstDay = known[0].day;
  const lastDay = known[known.length - 1].day;
  const plotted = points.filter((p) => p.day >= firstDay && p.day <= lastDay);
  const plottedPx = plotted.map((p) => xFor(p.day));

  // Value at a skipped day's x-position, per its spot on the straight line
  // between the known points on either side of it.
  function interpolatedValue(day) {
    let prev = known[0];
    let next = known[known.length - 1];
    for (let i = 0; i < known.length - 1; i++) {
      if (known[i].day <= day && day <= known[i + 1].day) {
        prev = known[i];
        next = known[i + 1];
        break;
      }
    }
    if (next.day === prev.day) return prev.value;
    const t = (day - prev.day) / (next.day - prev.day);
    return prev.value + (next.value - prev.value) * t;
  }

  function nearestIndex(pointerX) {
    let best = 0;
    let bestDist = Infinity;
    plottedPx.forEach((px, i) => {
      const d = Math.abs(px - pointerX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }

  function showAt(i) {
    const p = plotted[i];
    const hasValue = p.value != null;
    const px = xFor(p.day);
    const py = yFor(hasValue ? p.value : interpolatedValue(p.day));
    crosshair.setAttribute('x1', px.toFixed(1));
    crosshair.setAttribute('x2', px.toFixed(1));
    crosshair.setAttribute('opacity', '1');
    hoverDot.setAttribute('cx', px.toFixed(1));
    hoverDot.setAttribute('cy', py.toFixed(1));
    hoverDot.setAttribute('fill', p.day === 0 ? baselineColor : seriesColor);
    hoverDot.setAttribute('opacity', hasValue ? '1' : '0.5');

    tooltip.innerHTML = '';
    const valueEl = document.createElement('div');
    valueEl.className = 'chart-tooltip-value';
    valueEl.textContent = hasValue ? fmtValue(p.value, unit) : 'No data';
    const dateEl = document.createElement('div');
    dateEl.className = 'chart-tooltip-date';
    dateEl.textContent = p.day === 0 ? `Baseline · ${fmtDate(p.date)}` : `Day ${p.day} · ${fmtDate(p.date)}`;
    tooltip.appendChild(valueEl);
    tooltip.appendChild(dateEl);
    if (p.note) {
      const noteEl = document.createElement('div');
      noteEl.className = 'chart-tooltip-note';
      noteEl.textContent = p.note;
      tooltip.appendChild(noteEl);
    }

    tooltip.style.left = `${(px / VBW) * 100}%`;
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
    showAt(nearestIndex((e.clientX - rect.left) * scaleX));
  });
  hit.addEventListener('pointerleave', hide);

  return true;
}
