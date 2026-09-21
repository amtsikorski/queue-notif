# Interpark Queue Discord Notifier

A Chrome extension that watches your position in an Interpark queue and posts
live updates to a Discord channel. You no longer have to constantly be by your
computer, worrying about missing your time to ticket.

**[Install from the Chrome Web Store →](https://chromewebstore.google.com/detail/interpark-queue-discord-n/bgmeabicilmepgeknafoladncionaioo)**

## What it does

- Reads your current queue position directly off the Interpark queue page
- Posts position updates to a Discord channel via webhook on a set interval
- @mentions your Discord user when your position drops below a chosen
  threshold, so you get pinged right when it's time to pay attention
- Optionally estimates time remaining in the queue, based on how fast your
  position has been dropping

## Getting started

1. Install the extension from the Chrome Web Store link above
2. Open the extension popup and expand **Discord settings** to enter your
   Discord webhook URL and Discord user ID
3. Set your update frequency and alert threshold
4. Click **Save & start** while on an Interpark queue page

For step-by-step instructions on getting a Discord webhook URL and user ID,
open the in-extension help page (or see `help.html` in this repo).

## Permissions

- `storage` — saves your settings (webhook URL, thresholds, etc.) between sessions
- `activeTab` / `scripting` — reads the queue position from the active Interpark tab
