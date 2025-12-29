import { describe, it, expect } from 'vitest';
import { detectOutliers } from '../js/calculations.js';

const entries = [
  { id: '1', amount: 50, category: 'food', date: '2025-12-29' },
  { id: '2', amount: 55, category: 'food', date: '2025-12-29' },
  { id: '3', amount: 60, category: 'food', date: '2025-12-29' },
  { id: '4', amount: 200, category: 'food', date: '2025-12-29' }  // Should be outlier
];

describe('Anomaly Detection', () => {
  it('detects unusually high expenses', () => {
    const outliers = detectOutliers(entries);  // Assuming it returns Set of IDs or array
    expect(outliers).toContain('4');  // Or expect(outliers.has('4')) if Set
  });

  it('ignores normal expenses', () => {
    const outliers = detectOutliers(entries);
    expect(outliers).not.toContain('1');
  });
});
