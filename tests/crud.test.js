import { describe, it, expect } from 'vitest';
import { addEntry, updateEntry, deleteEntry, getAllEntries } from '../js/data.js';  // Or wherever CRUD is

describe('CRUD Operations', () => {
  it('adds a new entry', () => {
    const newEntry = addEntry(75, 'entertainment', '2025-12-29');
    expect(getAllEntries()).toContainEqual(newEntry);
  });

  it('updates an existing entry', () => {
    // Assume an entry exists first
    const updated = updateEntry('1', { amount: 200 });
    expect(updated.amount).toBe(200);
  });

  it('deletes an entry', () => {
    deleteEntry('1');
    expect(getAllEntries()).not.toContainEqual(expect.objectContaining({ id: '1' }));
  });
});
