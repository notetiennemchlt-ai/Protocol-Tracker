# Protocol Tracker

A public, read-only page of my current protocol — what I'm running, what's
dropped, what's not implemented yet, and why. Static site, served by GitHub
Pages.

## How this works

- `protocol.json` — the whole page. Edit this to add, remove, or change
  status/notes on an item.
- `js/protocol.js` — reads and renders `protocol.json`. Shouldn't need to
  change when the protocol itself changes.

There's no backend and nothing to unlock — it's just files. Change
`protocol.json`, commit, push, and GitHub Pages redeploys automatically
within a minute or two.

## Local preview

No build step. Just serve the folder, e.g.:

```
npx serve .
```
