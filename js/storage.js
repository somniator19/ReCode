export function saveEntries(entries, key = 'spendingEntries') {
  // store entries as JSON under provided key (default 'spendingEntries')
  try {
    localStorage.setItem(key, JSON.stringify(entries || []))
  } catch (e) {
    // fail silently in environments without storage
  }
}

export function loadEntries(key = 'spendingEntries') {
  // return parsed entries or empty array if missing/invalid
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}
