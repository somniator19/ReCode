let chart;

export function renderChart(ctx, dailyTotals) {
  const labels = Object.keys(dailyTotals);
  const data = Object.values(dailyTotals);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Daily Spending",
        data,
        fill: false
      }]
    }
  });
}