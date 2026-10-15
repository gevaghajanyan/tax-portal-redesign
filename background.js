// Service worker — MV3.
// Handles the Alt+Shift+T command and flips the enabled flag in storage.
// The content script listens for storage changes and re-applies live.

const DEFAULTS = { enabled: true };

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-redesign") return;
  const { enabled } = await chrome.storage.local.get(DEFAULTS);
  await chrome.storage.local.set({ enabled: !enabled });
});

// First-install defaults — pre-seed storage so content.js has a value
// to read before the user ever opens the popup.
chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(null);
  const toSet = {};
  if (!("enabled" in current)) toSet.enabled = true;
  if (!("preset" in current)) toSet.preset = "blue";
  if (!("theme" in current)) toSet.theme = "light";
  if (!("fontScale" in current)) toSet.fontScale = 1;
  if (Object.keys(toSet).length) await chrome.storage.local.set(toSet);
});
