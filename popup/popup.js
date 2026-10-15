// Keep in sync with content.js (same keys, same values).
const PRESETS = {
  blue:   { labelKey: "colorBlue",   primary: "#2563eb", rgb: "37, 99, 235",   dark: "#1d4ed8", darker: "#1e40af", tint: "#eff6ff" },
  indigo: { labelKey: "colorIndigo", primary: "#4f46e5", rgb: "79, 70, 229",   dark: "#4338ca", darker: "#3730a3", tint: "#eef2ff" },
  purple: { labelKey: "colorPurple", primary: "#9333ea", rgb: "147, 51, 234",  dark: "#7e22ce", darker: "#6b21a8", tint: "#faf5ff" },
  pink:   { labelKey: "colorPink",   primary: "#db2777", rgb: "219, 39, 119",  dark: "#be185d", darker: "#9d174d", tint: "#fdf2f8" },
  red:    { labelKey: "colorRed",    primary: "#dc2626", rgb: "220, 38, 38",   dark: "#b91c1c", darker: "#991b1b", tint: "#fef2f2" },
  orange: { labelKey: "colorOrange", primary: "#ea580c", rgb: "234, 88, 12",   dark: "#c2410c", darker: "#9a3412", tint: "#fff7ed" },
  green:  { labelKey: "colorGreen",  primary: "#16a34a", rgb: "22, 163, 74",   dark: "#15803d", darker: "#166534", tint: "#f0fdf4" },
  teal:   { labelKey: "colorTeal",   primary: "#0d9488", rgb: "13, 148, 136",  dark: "#0f766e", darker: "#115e59", tint: "#f0fdfa" },
  slate:  { labelKey: "colorSlate",  primary: "#334155", rgb: "51, 65, 85",    dark: "#1e293b", darker: "#0f172a", tint: "#f1f5f9" }
};

const FONT_SCALES = [0.9, 1, 1.1, 1.25];
const DEFAULTS = { enabled: true, preset: "blue", theme: "light", fontScale: 1 };

const t = (key) => chrome?.i18n?.getMessage?.(key) || key;

// Elements
const toggle = document.getElementById("enabledToggle");
const swatches = document.getElementById("swatches");
const colorSection = document.getElementById("colorSection");
const settingsSection = document.getElementById("settingsSection");
const modeDesc = document.getElementById("modeDesc");
const currentColorName = document.getElementById("currentColorName");
const brandDot = document.getElementById("brandDot");
const themeSegment = document.getElementById("themeSegment");
const themeIndicator = themeSegment.querySelector(".pop-segment-indicator");
const fontScaleLabel = document.getElementById("fontScaleLabel");
const fontScaleDown = document.getElementById("fontScaleDown");
const fontScaleUp = document.getElementById("fontScaleUp");
const fontScaleReset = document.getElementById("fontScaleReset");

function applyI18n() {
  for (const el of document.querySelectorAll("[data-i18n]")) {
    const key = el.getAttribute("data-i18n");
    const msg = t(key);
    if (msg) el.textContent = msg;
  }
  for (const el of document.querySelectorAll("[data-i18n-title]")) {
    const key = el.getAttribute("data-i18n-title");
    const msg = t(key);
    if (msg) el.setAttribute("title", msg);
  }
  document.documentElement.lang = chrome?.i18n?.getUILanguage?.() || "en";
}

async function load() {
  const settings = await chrome.storage.local.get(DEFAULTS);
  toggle.checked = !!settings.enabled;
  renderSwatches(settings.preset);
  reflectEnabled(settings.enabled);
  reflectPreset(settings.preset);
  reflectTheme(settings.theme);
  reflectFontScale(settings.fontScale);
}

function reflectEnabled(enabled) {
  colorSection.classList.toggle("disabled", !enabled);
  settingsSection.classList.toggle("disabled", !enabled);
  modeDesc.textContent = enabled ? t("modernUIOn") : t("modernUIOff");
}

function reflectPreset(key) {
  const p = PRESETS[key] || PRESETS.blue;
  currentColorName.textContent = t(p.labelKey);
  document.documentElement.style.setProperty("--pop-primary", p.primary);
  document.documentElement.style.setProperty("--pop-primary-tint", p.tint);
  brandDot.style.background = `linear-gradient(135deg, ${p.primary}, ${p.darker})`;
}

function reflectTheme(theme) {
  const buttons = themeSegment.querySelectorAll("button");
  let activeIdx = 0;
  buttons.forEach((btn, i) => {
    const isActive = btn.dataset.value === theme;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
    if (isActive) activeIdx = i;
  });
  themeIndicator.style.transform = `translateX(${activeIdx * 100}%)`;
}

function reflectFontScale(scale) {
  const s = typeof scale === "number" ? scale : 1;
  fontScaleLabel.textContent = `${Math.round(s * 100)}%`;
  const idx = FONT_SCALES.indexOf(s);
  fontScaleDown.disabled = idx <= 0;
  fontScaleUp.disabled = idx === FONT_SCALES.length - 1 || idx === -1;
}

function renderSwatches(current) {
  swatches.innerHTML = "";
  for (const key of Object.keys(PRESETS)) {
    const p = PRESETS[key];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pop-swatch" + (key === current ? " active" : "");
    btn.style.backgroundColor = p.primary;
    btn.title = t(p.labelKey);
    btn.dataset.key = key;
    btn.setAttribute("aria-label", t(p.labelKey));
    btn.setAttribute("aria-pressed", String(key === current));
    btn.addEventListener("click", () => selectPreset(key));
    swatches.appendChild(btn);
  }
}

function selectPreset(key) {
  if (!PRESETS[key]) return;
  chrome.storage.local.set({ preset: key });
  renderSwatches(key);
  reflectPreset(key);
}

// Event wiring
toggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: toggle.checked });
  reflectEnabled(toggle.checked);
});

themeSegment.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-value]");
  if (!btn) return;
  const theme = btn.dataset.value;
  chrome.storage.local.set({ theme });
  reflectTheme(theme);
});

function changeFontScale(delta) {
  chrome.storage.local.get(DEFAULTS).then((s) => {
    const cur = typeof s.fontScale === "number" ? s.fontScale : 1;
    const idx = FONT_SCALES.indexOf(cur);
    const safeIdx = idx === -1 ? FONT_SCALES.indexOf(1) : idx;
    const next = Math.max(0, Math.min(FONT_SCALES.length - 1, safeIdx + delta));
    const nextScale = FONT_SCALES[next];
    chrome.storage.local.set({ fontScale: nextScale });
    reflectFontScale(nextScale);
  });
}

fontScaleDown.addEventListener("click", () => changeFontScale(-1));
fontScaleUp.addEventListener("click", () => changeFontScale(+1));
fontScaleReset.addEventListener("click", () => {
  chrome.storage.local.set({ fontScale: 1 });
  reflectFontScale(1);
});

applyI18n();
load();
