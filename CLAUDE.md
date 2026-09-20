# Queue Monitor (Interpark Queue Discord Notif)

Chrome extension (MV3). Watches an Interpark queue page's position and posts
updates/alerts to a Discord channel via webhook, optionally @mentioning a
user ID when the position drops below a threshold.

## Structure

- `manifest.json` — MV3 manifest. `action.default_popup` → `popup/popup.html`.
  Permissions: `storage`, `activeTab`, `scripting`.
- `popup/popup.html` + `popup/popup.js` — settings UI (webhook URL, user ID,
  update frequency, alert threshold, time-left-estimation checkbox,
  start/stop).
- `content.js` — injected into the active tab on "Save & start". Reads the
  queue position from `.StatusBox_mainText__9gJXJ strong` on the page,
  posts to the Discord webhook on an interval, and sends the @mention alert
  once position ≤ threshold. When the "add time left estimation" checkbox is
  on, appends an estimated time remaining to the start/update/warning
  messages, computed from the median of the last 10 one-minute position
  samples (see "Time left estimation" below).
- `background.js` — service worker (not modified during the UI polish pass;
  see file for its role).
- `help.html` — standalone info page (opened in a new tab) walking through
  getting a Discord webhook URL and a Discord user ID, plus general tips.
- `images/` — extension icons + the screenshots used in `help.html`.

## Design

Brand palette (kept intentionally across popup + help page):
- Coral `#F7CACA` / deeper coral `#EFA9A9` — primary actions, tooltip icon
- Periwinkle `#93A9D1` — hover state, focus rings, accents
- Tangerine `#F5A34D` — small "active" status accent (from the extension's
  tangerine icon)
- Ink `#2E2A2A` / soft ink `#8A7F7F` (`#766B6B` on help.html) — text
- Off-white `#FFFBF9`, hairline border `#F0DEDE`

Popup (`popup/popup.html`) is a fixed-width (currently 230px) vertical form:
- Discord webhook URL + Discord user ID are grouped inside a `<details>`
  accordion labeled "Discord settings", collapsed by default, no border box
  — just the label and a chevron that rotates open/closed.
- "Update every ___ minutes, while in queue" and "Alert below ___ queue
  position" are each their own row: label + number input inline, small hint
  text underneath spanning both.
- "Add time left estimation to notification" checkbox sits below those two
  rows, above the Save & start / Stop buttons.
- Status line under the buttons shows a colored dot (tangerine when active)
  + short status text instead of plain paragraph text.

Help page (`help.html`) restyled from a flat list into numbered step cards:
one card for "Get your Discord webhook URL", one for "Get your Discord user
ID" (both genuinely sequential, hence numbering), plus a non-numbered
"General tips" section as two callout cards.

## Known quirk: popup height on accordion collapse

Chrome extension action popups auto-grow to fit new content but do **not**
auto-shrink back down when content (like the collapsed accordion) goes
away. `popup.js` works around this with explicit fixed heights:

```js
const COLLAPSED_HEIGHT = 322;
const EXPANDED_HEIGHT = 446;
```

set directly via `document.documentElement.style.height` on the accordion's
`toggle` event (and once on load). If the popup's content changes again
(fields added/removed, font-size changes, etc.), these two constants will
likely need to be re-measured and updated by hand — they are not computed
from `scrollHeight`, because that approach (and a `chrome.windows.update`
based approach) did not reliably force Chrome to shrink the popup window in
testing.

## Time left estimation

`content.js` keeps a rolling window of the last `HISTORY_SIZE` (10)
`{pos, time}` samples (`positionHistory`). To estimate minutes remaining:

- Compute the delta between consecutive samples (`prevPos - currPos`),
  normalized to a per-minute rate (`deltaPos / deltaMinutes`) since samples
  aren't always evenly spaced (see fast-start sampling below).
- Drop backward deltas (position number went up — a bot re-joining ahead of
  the user); this is treated as noise, not a slowdown.
- Keep forward deltas as-is, **including large ones** — a big forward jump
  (e.g. bots leaving the queue) is real signal that time left just dropped,
  so it isn't clamped or discarded.
- Rate = **median** (not mean) of the remaining per-minute rates, so a small
  number of outlier jumps can't swing the estimate too far either way.
- `minutesRemaining = currentPos / rate`.
- Needs at least `MIN_VALID_DELTAS` (3) forward deltas before it'll show a
  number; until then (and always on the start message) it reports "Still
  calculating" / "Starting time left estimation calculation" instead.

**Fast-start sampling**: the main interval only samples once a minute, which
means it'd normally take 3+ minutes to gather enough history. When
estimation is enabled, `startFastSampling()` runs a separate interval
alongside the main one for just the first `FAST_SAMPLE_DURATION` (30s),
sampling every `FAST_SAMPLE_INTERVAL` (10s) purely to feed extra points into
`positionHistory` — it never sends a Discord message itself. This is why
rates are normalized per-minute rather than treated as raw per-sample
deltas: fast-start samples are 10s apart, main-interval samples are 60s
apart, and they all land in the same history array.

## Working with this repo

The user wants to **approve changes before they're implemented** — describe
the planned change (and show a mockup/preview where useful) and wait for a
clear go-ahead before writing or editing files, even for small wording or
layout tweaks that seem like natural follow-ons to an already-approved
change.
