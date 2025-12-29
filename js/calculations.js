export function totalsByCategory(entries) {
  return entries.reduce((acc, e) => {
    const cat = e.category || e.cat || 'uncategorized'
    const amount = Number(e.amount || 0)
    acc[cat] = (acc[cat] || 0) + amount
    return acc
  }, {})
}

export function totalsDaily(entries) {
  return entries.reduce((acc, e) => {
    const date = e.date
    const amount = Number(e.amount || 0)
    acc[date] = (acc[date] || 0) + amount
    return acc
  }, {})
}

export function detectOutliers(entries, { multiplier = 1.5 } = {}) {
  // Return empty for no data
  if (!entries || entries.length === 0) return []

  // 1) Collect and sort numeric amounts
  const amounts = entries.map(e => Number(e.amount || 0)).sort((a, b) => a - b)

  // 2) Percentile helper (linear interpolation)
  const q = (arr, p) => {
    if (arr.length === 0) return 0
    const idx = (arr.length - 1) * p
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    if (lo === hi) return arr[lo]
    return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo)
  }

  // 3) Compute Q1, Q3 and IQR
  const q1 = q(amounts, 0.25)
  const q3 = q(amounts, 0.75)
  const iqr = q3 - q1

  // 4) Upper fence = Q3 + multiplier * IQR (default multiplier = 1.5)
  const upper = q3 + multiplier * iqr

  // 5) Entries above upper fence are outliers — return their ids
  const outliers = entries
    .filter(e => Number(e.amount || 0) > upper)
    .map(e => String(e.id))

  return outliers
}
