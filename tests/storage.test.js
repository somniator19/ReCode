import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveEntries, loadEntries } from '../js/storage.js';  // Adjust exports

// Mock LocalStorage
beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn(),
  });
});

describe('LocalStorage Persistence', () => {
  it('saves entries correctly', () => {
    const entries = [{ id: '1', amount: 100, category: 'transport', date: '2025-12-29' }];
    saveEntries(entries);
    expect(localStorage.setItem).toHaveBeenCalledWith('spendingEntries', JSON.stringify(entries));
  });

  it('loads entries correctly', () => {
    const stored = '[{"id":"1","amount":100,"category":"transport","date":"2025-12-29"}]';
    localStorage.getItem.mockReturnValue(stored);
    expect(loadEntries()).toEqual(JSON.parse(stored));
  });

  it('returns empty array if no data', () => {
    localStorage.getItem.mockReturnValue(null);
    expect(loadEntries()).toEqual([]);
  });
});