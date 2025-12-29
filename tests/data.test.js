import { describe, it, expect } from 'vitest';
import { totalsByCategory, totalsDaily } from '../js/calculations.js';

const sampleEntries = [
  { id: '1', amount: 50, category: 'food', date: '2025-12-28' },
  { id: '2', amount: 30, category: 'transport', date: '2025-12-28' },
  { id: '3', amount: 100, category: 'food', date: '2025-12-29' }
];

describe('Spending Calculations', () => {
  it('calculates totals by category correctly', () => {
    const result = totalsByCategory(sampleEntries);
    expect(result).toEqual({ food: 150, transport: 30 });
  });

  it('calculates daily totals correctly', () => {
    const result = totalsDaily(sampleEntries);
    expect(result).toEqual({
      '2025-12-28': 80,
      '2025-12-29': 100
    });
  });
});