// Everything you track lives here. Adding a new stat later is just adding
// one entry — the card, chart, form, and storage are all generic and work
// for any metric automatically.
//
// color: pulled from the app's categorical ramp in a FIXED order (see
// css/style.css --series-1, --series-2, ...) — never reassign or cycle
// colors when metrics are added/removed, always append the next unused slot.
//
// direction: 'up-is-good', 'down-is-good', or 'neutral' — which way the
// delta should be colored green vs red ('neutral' stays flat/grey).
//
// category: metrics sharing a category are grouped under one heading, in
// the order categories first appear here. Omit for an ungrouped metric.

export const METRICS = [
  {
    id: 'mind-wandering',
    label: 'Mind-Wandering Count',
    unit: 'wanders',
    colorVar: '--series-1',
    direction: 'down-is-good',
    step: 1,
    cadence: 'Per 17-min sit',
    category: 'Focus',
  },
  {
    id: 'working-memory',
    label: 'Working Memory',
    unit: '',
    colorVar: '--series-2',
    direction: 'neutral',
    step: 1,
    category: 'Focus',
  },
];
