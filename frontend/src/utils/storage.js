export const storageKeys = {
  story: "harbor.storyDraft",
  journal: "harbor.journalEntries",
  vault: "harbor.vaultCases",
  prefs: "harbor.preferences",
  currentUser: "harbor.currentUser",
  language: "harbor.language",
  campaignFlyer: "harbor.campaignFlyer",
};

export function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeStored(key) {
  localStorage.removeItem(key);
}
