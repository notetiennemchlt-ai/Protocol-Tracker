# Protocol Tracker

A public, read-only page of what I'm tracking — daily protocol checklist plus
a couple of focus metrics. Static site, served by GitHub Pages.

## How this works

- `protocol.json` — the "Current Protocol Tracker" list. Edit this to add,
  remove, or change status on an item.
- `data/entries.json` — the logged values for each metric (keyed by metric
  id). Edit this to add a new entry.
- `js/metrics.js` — defines which metrics show up as cards (id, label, unit,
  cadence, etc).

There's no backend and nothing to unlock — it's just files. Change a file,
commit, push, and GitHub Pages redeploys automatically within a minute or
two.

## Local preview

No build step. Just serve the folder, e.g.:

```
npx serve .
```
