# Privacy Policy

**Extension:** Tax Portal Redesign
**Author:** Gevorg Aghajanyan ([gev.aghajanian@gmail.com](mailto:gev.aghajanian@gmail.com))
**Last updated:** 2026-10-15

## TL;DR

- **No data from the tax portal is collected, read, logged, or transmitted.**
- **No analytics, no telemetry, no tracking.**
- **No network calls.** The extension never contacts any server — not
  mine, not Google's, not anyone's.
- The only data stored is **four UI preferences** (on/off, color, theme,
  text size), kept locally on your device via `chrome.storage.local`.

---

## What this extension does

Tax Portal Redesign is a client-side, cosmetic redesign for
[personal-account.taxservice.am](https://personal-account.taxservice.am)
(the Armenian State Revenue Committee's personal-account portal). It
injects a scoped stylesheet and a small content script that rebuild the
look of the pages as a modern, card-based interface. The original form
logic, AJAX submits, and validation are left completely untouched.

## What data is collected

**None from the tax portal.** The extension does not read, parse, log,
or exfiltrate anything from the portal — not your Social Security
number, tax ID, bank account, employer, income, tax amounts, uploaded
documents, nothing.

The content script's only interaction with the DOM is:

1. Adding a `modern-tax-portal` class to `<body>` (so the stylesheet can
   be scoped).
2. Adding a `tax-sidebar` / `tax-main` class to two `<td>` elements to
   lay out the sidebar and main column.
3. Setting CSS custom properties (`--tp`, `--tp-dark`, `--tp-tint`,
   `--tp-scale`) on `<html>` for the user's chosen color and font size.

That's it. No `innerText` reads, no form-value reads, no cookies, no
local storage of portal content, no `document.querySelectorAll` on data
fields.

## What is stored locally

Four preferences are saved via `chrome.storage.local` so they persist
across browser sessions:

| Key          | Values                                       | Purpose                        |
| ------------ | -------------------------------------------- | ------------------------------ |
| `enabled`    | `true` / `false`                             | Whether the redesign is on    |
| `preset`     | `blue \| indigo \| purple \| … \| slate`     | Primary color choice          |
| `theme`      | `light \| dark \| system`                    | Appearance mode               |
| `fontScale`  | `0.9 \| 1 \| 1.1 \| 1.25`                    | Content text scale            |

These values are plain enum-like strings and numbers. They never leave
your device. `chrome.storage.local` is explicitly **not** synced to your
Google account.

## What is NOT done

- ❌ No network requests of any kind (`fetch`, `XMLHttpRequest`,
  `WebSocket`, image preloading, nothing).
- ❌ No remote code (`eval`, dynamic `<script>` injection, CDN scripts).
- ❌ No analytics (Google Analytics, Mixpanel, Sentry, nothing).
- ❌ No cookies set or read.
- ❌ No portal content (form values, filing data, personal info)
  captured, logged, or transmitted.
- ❌ No data sold or shared with any third party.
- ❌ No access to any site other than `personal-account.taxservice.am`.

## Permissions explained

- **`storage`** — used solely to save the four preferences above so your
  color / theme / text-size persists across tabs and sessions.
- **Host match `https://personal-account.taxservice.am/*`** — required
  because the content script that applies the redesign must run on the
  pages whose look it changes. Nothing is injected on any other site.

## Data retention and deletion

Because nothing is transmitted, there is nothing on any server to delete.

To clear the local preferences, either:

- Click the extension icon → toggle options back to defaults, or
- Open `chrome://extensions` → **Tax Portal Redesign** → **Details** →
  **Site access & permissions** → **Reset**, or
- Uninstall the extension — Chrome deletes all its storage automatically.

## Changes to this policy

Any changes will be published in this same file in the extension's
public source repository and reflected on the Chrome Web Store listing.

## Contact

For questions, bug reports, or privacy concerns:
**[gev.aghajanian@gmail.com](mailto:gev.aghajanian@gmail.com)**
