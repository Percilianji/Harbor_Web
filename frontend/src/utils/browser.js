export function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function stopAllMedia() {
  document.querySelectorAll("audio, video").forEach((media) => media.pause());
}
