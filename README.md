# Protocol Tracker

A public, read-only page of my current protocol — what I'm running, what's
dropped, what's not implemented yet, and why. Static site, served by GitHub
Pages.

## How this works

- `protocol.json` — the focus protocol sidebar. Edit this to add, remove,
  or change status/notes on an item.
- `sleep.json` — the sleep protocol panel, below the shell. Same shape as
  `protocol.json` (categories of items with `status`/`note`), but its own
  series — no paired metrics. Edit this the same way.
- `js/protocol-shared.js` — the rendering both panels share (status dots,
  notes, phase sub-headers). Shouldn't need to change when either
  protocol's content changes.
- `js/protocol.js` / `js/sleep.js` — each just points `protocol-shared.js`
  at its own JSON file and DOM ids.
- `data/metrics.json` — the 30-day metrics tracker. `startDate` is Day 1 of
  the 30 days (the "Day X of 30" indicator is computed from it vs. today);
  `entries` is one object per day (`day: 0` is the baseline) with
  `digitSpan` (avg over 3 trials), `pvtRt` (avg reaction time over three
  3-minute PVT trials), and
  `focusMinutes` (minutes of focused learning that day) — any of which can
  be `null` if that measurement was missed. To add a day, append an entry
  and push.
- `js/metrics.js` / `js/chart.js` — read and render `data/metrics.json` as
  the three metric cards. Shouldn't need to change when the data changes.

There's no backend and nothing to unlock — it's just files. Change
`protocol.json`, commit, push, and GitHub Pages redeploys automatically
within a minute or two.

## Local preview

No build step. Just serve the folder, e.g.:

```
npx serve .
```
