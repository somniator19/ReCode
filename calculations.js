export function totalsByCategory(entries) {
  return entries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
}

export function totalsDaily(entries) {
  return entries.reduce((acc, e) => {
    acc[e.date] = (acc[e.date] || 0) + e.amount;
    return acc;
  }, {});
}

export function detectOutliers(entries) {
  const groups = {};

  entries.forEach(e => {
    groups[e.category] = groups[e.category] || [];
    groups[e.category].push(e.amount);
  });

  const outliers = new Set();

  entries.forEach(e => {
    const values = groups[e.category];
    if (values.length < 3) return;

    const mean = values.reduce((a, b) => a + b) / values.length;
    const std = Math.sqrt(
      values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length
    );

    if (Math.abs(e.amount - mean) > 2 * std) {
      outliers.add(e.id);
    }
  });

  return outliers;
}