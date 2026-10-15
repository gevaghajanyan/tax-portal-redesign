# Tax Portal Redesign

A Chrome extension that gives [personal-account.taxservice.am](https://personal-account.taxservice.am)
(the Armenian State Revenue Committee's personal-account portal) a modern,
readable UI without touching the server.

The portal is built on an old RichFaces/JSF template using deeply nested
layout tables and 2009-era styling. This extension injects a scoped
stylesheet + a small content script that rebuilds the look as a clean,
card-based web app — while leaving the original JSF form logic, AJAX
submits and validation untouched.

---

## Features

- **Modern UI** across every page the portal ships (login, personal info,
  income-tax-return list, the application form, debts, notifications,
  payments, feedback, change-password).
- **One-click on/off switch** — flip the redesign off any time to see the
  original site. Setting persists across tabs and reloads.
- **9 primary color presets** (Blue, Indigo, Purple, Pink, Red, Orange,
  Green, Teal, Slate) applied live to the header, sidebar, buttons,
  focus rings, modals and calendar.
- **Light / Dark / System appearance.** Dark mode re-skins page
  backgrounds, cards, tables, inputs and modal panels. "System" tracks
  your OS theme and flips without a page reload.
- **Adjustable text size** (90% / 100% / 110% / 125%) via A- / A / A+
  buttons in the popup. Applied as a `zoom` scale on the content area.
- **Keyboard shortcut** `Alt+Shift+T` toggles the redesign on/off without
  opening the popup.
- **Localized popup** — English and Armenian (`hy`). The portal is
  Armenian-first, so the popup matches your browser locale automatically.

---

## Install

### From source (development)

1. Clone or download this folder.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and pick the `tax-portal-redesign/` folder.
5. Open [personal-account.taxservice.am](https://personal-account.taxservice.am)
   — the redesign is on by default.

### From the Chrome Web Store

_Coming soon._

---

## Using it

Click the extension icon to open the popup.

| Control            | What it does                                                     |
| ------------------ | ---------------------------------------------------------------- |
| **Modern UI** switch | Enable / disable the entire redesign                             |
| **Appearance**     | Light / Dark / System — restyles the page in dark mode            |
| **Text size**      | A- / A / A+ — scales the content area between 90% and 125%        |
| **Primary color**  | 9 swatches — recolors header, buttons, links, modals, calendar    |
| `Alt+Shift+T`      | Keyboard shortcut to flip the redesign on/off without the popup   |

Every setting is saved live to `chrome.storage.local` and applied to any
open portal tab immediately via `storage.onChanged` — no reload needed.

---

## Folder structure

```
tax-portal-redesign/
├── manifest.json             # MV3 manifest — version, perms, i18n, commands
├── background.js             # Service worker: handles Alt+Shift+T command
├── README.md
├── _locales/                 # Chrome i18n (must live at root)
│   ├── en/messages.json
│   └── hy/messages.json
├── content/
│   ├── content.js            # Injects body classes, tags layout cells,
│   │                         #  reads settings, sets CSS variables
│   └── style.css             # The actual redesign — ~1100 lines, scoped
│                             #  to `body.modern-tax-portal`
├── popup/
│   ├── popup.html            # Switch + segment control + stepper + swatches
│   ├── popup.css
│   └── popup.js
└── icons/
    ├── icon.svg              # Source mark
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## How it works

### CSS scoping strategy

All redesign rules are scoped to `body.modern-tax-portal`, so disabling
the extension (toggling off) is as simple as removing that class — the
stylesheet becomes inert without needing to be unloaded.

The portal uses deeply nested `<table>` elements for page layout. Styling
`table` as a card produced cards-inside-cards. The fix is two-step:

1. **Reset every table** inside the modern class: transparent background,
   no border, no padding, so layout tables disappear visually.
2. **Re-style only real content containers:** `.dr-pnl.rich-panel`
   (section cards), `fieldset`, data tables identified by `[border="1"]`
   or `fieldset table`, inputs, selects, buttons, modals and the
   RichFaces calendar.

### Color theming

The primary color is driven by CSS custom properties:

- `--tp` — primary
- `--tp-rgb` — same color as an "r, g, b" triplet (used in `rgba()` for
  focus rings and shadows)
- `--tp-dark` — hover/pressed
- `--tp-darker` — gradient end-stop
- `--tp-tint` — light tint used for selected tabs and hover rows

`content.js` sets these on `:root` from the user-selected preset. The
stylesheet includes "Blue" as the fallback so it still renders before
any JS runs.

### Dark mode

Dark mode is scoped to an additional `body.tax-dark` class. The
light-mode rules are the default; dark-mode overrides sit at the bottom
of `style.css` and only touch surfaces that actually need to change
(page bg, cards, borders, text, inputs, modals, data tables).

### Keyboard shortcut

Defined in `manifest.json` under `commands`. `background.js` is a tiny
service worker that listens for the command and flips the `enabled` flag
in storage. The content script's `storage.onChanged` listener picks it
up and re-applies.

### Font-size scale

`content.js` writes `--tp-scale` on `:root`. The stylesheet uses
`body.modern-tax-portal { zoom: var(--tp-scale, 1) }`. We use `zoom`
instead of rem-based scaling because the existing portal CSS already
hard-codes px font sizes everywhere.

### i18n

The popup uses `data-i18n="messageKey"` attributes. `popup.js` resolves
them via `chrome.i18n.getMessage(...)` on load. The `manifest.json`
`name` and `description` reference `__MSG_extName__` /
`__MSG_extShortDesc__` so the Chrome Web Store listing itself is
localized.

Supported locales: `en` (default), `hy` (Armenian).

---

## Permissions

The extension requests exactly one permission:

- `storage` — to persist the four user settings
  (`enabled`, `preset`, `theme`, `fontScale`) between sessions.

Content scripts only run on `https://personal-account.taxservice.am/*`.
No remote code, no analytics, no network calls.

Full privacy policy: see [`PRIVACY.md`](./PRIVACY.md).

---

## Development

### Prerequisites

- Chrome 100+
- No build step — this is plain HTML/CSS/JS.

### Dev loop

1. Make a change in `content/`, `popup/`, `background.js`, or `_locales/`.
2. Go to `chrome://extensions`, click the circular reload arrow on the
   Tax Portal Redesign card.
3. Hard-reload the portal tab (`Cmd/Ctrl + Shift + R`).

### Regenerating icons

The PNG icons are generated from `icons/icon.svg` using Chrome headless
plus `sips` (macOS). Rough procedure:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# Render a large master from the SVG
"$CHROME" --headless --disable-gpu --force-device-scale-factor=1 \
  --default-background-color=00000000 --window-size=1024,1024 \
  --screenshot=/tmp/icon-master.png "file://$PWD/icons/icon.svg"
# Downsample to each required size
for S in 16 32 48 128; do
  sips -z $S $S /tmp/icon-master.png --out "icons/icon$S.png"
done
```

> **Note:** `--window-size=128,128` renders blank on some Chrome builds —
> that's why we render at 1024px and downsample.

### Updating the color palette or presets

The preset list lives in **three** places that must stay in sync:

- `content/content.js` → `PRESETS` object
- `popup/popup.js` → `PRESETS` object (adds `labelKey` for i18n)
- `_locales/{en,hy}/messages.json` → `colorXxxx` entries

---

## Chrome Web Store checklist

- [x] Manifest V3
- [x] Version bumped (`1.2.0`)
- [x] Icons at 16 / 32 / 48 / 128
- [x] `default_locale` set
- [x] Localized `name` + `description`
- [x] `author` field
- [x] `minimum_chrome_version`
- [x] Only required permissions (`storage`)
- [x] Host matches scoped to the target domain
- [x] No remote code, no `eval`, no inline scripts in popup
- [ ] Screenshots (1280×800 × up to 5) — take from the live portal
- [ ] Promo tile (440×280) — can crop `icons/icon128.png` on brand bg
- [ ] Privacy policy URL — optional unless you add tracking

---

## License

MIT — see `LICENSE` if present, or treat as such.

## Author

Gevorg Aghajanyan — [gev.aghajanian@gmail.com](mailto:gev.aghajanian@gmail.com)
