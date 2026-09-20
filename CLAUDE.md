# Queue Monitor (Interpark Queue Discord Notif)

Chrome extension (MV3). Watches an Interpark queue page's position and posts
updates/alerts to a Discord channel via webhook, optionally @mentioning a
user ID when the position drops below a threshold.

## Structure

- `manifest.json` — MV3 manifest. `action.default_popup` → `popup/popup.html`.
  Permissions: `storage`, `activeTab`, `scripting`.
- `popup/popup.html` + `popup/popup.js` — settings UI (webhook URL, user ID,
  update frequency, alert threshold, start/stop).
- `content.js` — injected into the active tab on "Save & start". Reads the
  queue position from `.StatusBox_mainText__9gJXJ strong` on the page,
  posts to the Discord webhook on an interval, and sends the @mention alert
  once position ≤ threshold.
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
const COLLAPSED_HEIGHT = 276;
const EXPANDED_HEIGHT = 400;
```

set directly via `document.documentElement.style.height` on the accordion's
`toggle` event (and once on load). If the popup's content changes again
(fields added/removed, font-size changes, etc.), these two constants will
likely need to be re-measured and updated by hand — they are not computed
from `scrollHeight`, because that approach (and a `chrome.windows.update`
based approach) did not reliably force Chrome to shrink the popup window in
testing.

## Working with this repo

The user wants to **approve changes before they're implemented** — describe
the planned change (and show a mockup/preview where useful) and wait for a
clear go-ahead before writing or editing files, even for small wording or
layout tweaks that seem like natural follow-ons to an already-approved
change.
