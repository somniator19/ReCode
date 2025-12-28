const STORAGE_KEY = "spending_entries_v1";

export function loadEntries() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

export function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addEntry(entry) {
  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);
  return entries;
}

export function deleteEntry(id) {
  const shouldDelete = confirm("Are you sure you want to delete this?");
  if (shouldDelete) {
    const entries = loadEntries().filter(e => e.id !== id);
    saveEntries(entries);
    return entries;
  }

}
