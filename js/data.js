// Simple in-memory CRUD for tests
let entries = [
  { id: '1', amount: 100, category: 'transport', date: '2025-12-29' }
]

export function getAllEntries() {
  return entries.slice()
}

export function addEntry(amount, category, date) {
  // generate next numeric id as string
  const maxId = entries.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0)
  const id = String(maxId + 1)
  const entry = { id, amount, category, date }
  entries.push(entry)
  return entry
}

export function updateEntry(id, updates) {
  const idx = entries.findIndex(e => e.id === id)
  if (idx === -1) return null
  entries[idx] = { ...entries[idx], ...updates }
  return entries[idx]
}

export function deleteEntry(id) {
  entries = entries.filter(e => e.id !== id)
}
