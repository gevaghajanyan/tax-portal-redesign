// Keep this list in sync with popup.js (same keys, same values).
const PRESETS = {
  blue:   { primary: "#2563eb", rgb: "37, 99, 235",   dark: "#1d4ed8", darker: "#1e40af", tint: "#eff6ff" },
  indigo: { primary: "#4f46e5", rgb: "79, 70, 229",   dark: "#4338ca", darker: "#3730a3", tint: "#eef2ff" },
  purple: { primary: "#9333ea", rgb: "147, 51, 234",  dark: "#7e22ce", darker: "#6b21a8", tint: "#faf5ff" },
  pink:   { primary: "#db2777", rgb: "219, 39, 119",  dark: "#be185d", darker: "#9d174d", tint: "#fdf2f8" },
  red:    { primary: "#dc2626", rgb: "220, 38, 38",   dark: "#b91c1c", darker: "#991b1b", tint: "#fef2f2" },
  orange: { primary: "#ea580c", rgb: "234, 88, 12",   dark: "#c2410c", darker: "#9a3412", tint: "#fff7ed" },
  green:  { primary: "#16a34a", rgb: "22, 163, 74",   dark: "#15803d", darker: "#166534", tint: "#f0fdf4" },
  teal:   { primary: "#0d9488", rgb: "13, 148, 136",  dark: "#0f766e", darker: "#115e59", tint: "#f0fdfa" },
  slate:  { primary: "#334155", rgb: "51, 65, 85",    dark: "#1e293b", darker: "#0f172a", tint: "#f1f5f9" }
};

const DEFAULTS = {
  enabled: true,
  preset: "blue",
  theme: "light",   // "light" | "dark" | "system"
  fontScale: 1      // 0.9 | 1.0 | 1.1 | 1.25
};

// sessionStorage key used to carry settings across navigations within the
// same tax-portal origin. Lets us apply the restyle synchronously at
// document_start without waiting for chrome.storage.local (which is async
// and causes a ~1s flash of the original design on every page change).
const CACHE_KEY = "__tpr_settings_v1";

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return null;
  }
}

function writeCache(settings) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch {
    /* quota/private-mode — ignore, we'll re-read from chrome.storage next time */
  }
}

function tagLayoutCells() {
  const subTabs = document.getElementById("subTabs");
  if (!subTabs) return false;
  const sidebarTd = subTabs.closest("td");
  if (!sidebarTd) return false;
  sidebarTd.classList.add("tax-sidebar");
  const row = sidebarTd.parentElement;
  if (!row) return true;
  for (const cell of row.children) {
    if (cell.tagName === "TD" && cell !== sidebarTd) {
      cell.classList.add("tax-main");
      break;
    }
  }
  return true;
}

function setColors(preset) {
  const root = document.documentElement;
  root.style.setProperty("--tp", preset.primary);
  root.style.setProperty("--tp-rgb", preset.rgb);
  root.style.setProperty("--tp-dark", preset.dark);
  root.style.setProperty("--tp-darker", preset.darker);
  root.style.setProperty("--tp-tint", preset.tint);
}

function resolveTheme(theme) {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyFontScale(scale) {
  const s = typeof scale === "number" && isFinite(scale) ? scale : 1;
  document.documentElement.style.setProperty("--tp-scale", String(s));
}

// Apply settings to whichever element exists at call time. At
// document_start only <html> is in the DOM; body is tagged as soon as
// it's parsed via the DOMContentLoaded listener below.
function applyClasses(settings) {
  const html = document.documentElement;
  const body = document.body;
  const dark = resolveTheme(settings.theme) === "dark";
  const hasSidebar = !!document.querySelector(".tax-sidebar");

  for (const el of [html, body]) {
    if (!el) continue;
    if (settings.enabled) {
      el.classList.add("modern-tax-portal");
      el.classList.toggle("tax-dark", dark);
      el.classList.toggle("tax-has-sidebar", hasSidebar);
      el.classList.toggle("tax-standalone", !hasSidebar);
    } else {
      el.classList.remove(
        "modern-tax-portal",
        "tax-has-sidebar",
        "tax-standalone",
        "tax-dark"
      );
    }
  }
}

function apply(settings) {
  const preset = PRESETS[settings.preset] || PRESETS.blue;
  setColors(preset);
  applyFontScale(settings.fontScale);
  applyClasses(settings);
}

// ---------- Synchronous first pass at document_start ----------
// Read sessionStorage cache (populated on prior navigations) and apply
// immediately so the restyle lands before any original pixel paints.
// If no cache exists (first visit this tab-session), we fall back to the
// DEFAULTS which still beats showing the raw page.
const CACHED_SETTINGS = readCache() || DEFAULTS;
apply(CACHED_SETTINGS);

// Chrome parses HTML progressively — <body> may paint before
// DOMContentLoaded fires. A MutationObserver on <html> tags <body> the
// instant it's inserted, closing the FOUC window.
if (!document.body) {
  const htmlObserver = new MutationObserver(() => {
    if (document.body) {
      applyClasses(CACHED_SETTINGS);
      htmlObserver.disconnect();
    }
  });
  htmlObserver.observe(document.documentElement, { childList: true });
}

function onBodyReady() {
  tagLayoutCells();
  const cached = readCache() || CACHED_SETTINGS;
  apply(cached);

  // Reconcile with the authoritative chrome.storage. If it differs from
  // the cache, re-apply + update the cache for next navigation.
  chrome.storage.local.get(DEFAULTS).then((settings) => {
    writeCache(settings);
    apply(settings);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onBodyReady, { once: true });
} else {
  onBodyReady();
}

// React to popup / keyboard-shortcut changes without page reload.
if (chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const relevant =
      "enabled" in changes ||
      "preset" in changes ||
      "theme" in changes ||
      "fontScale" in changes;
    if (!relevant) return;
    chrome.storage.local.get(DEFAULTS).then((settings) => {
      writeCache(settings);
      apply(settings);
    });
  });
}

// Also react when the OS theme flips (only matters when theme === "system").
if (window.matchMedia) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener?.("change", () => {
    chrome.storage.local.get(DEFAULTS).then((settings) => {
      if (settings.theme === "system" && settings.enabled) {
        applyClasses(settings);
      }
    });
  });
}
