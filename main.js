import { loadEntries, addEntry, updateEntry, deleteEntry } from "./storage.js";
import { totalsByCategory, totalsDaily, detectOutliers } from "./calculations.js";
import { renderChart } from "./chart.js";

const form = document.getElementById("entry-form");
const tableBody = document.querySelector("#entries-table tbody");
const totalsList = document.getElementById("category-totals");
const chartCtx = document.getElementById("spendingChart");

function generateId() {
  return crypto.randomUUID();
}

function render() {
  const entries = loadEntries();
  const outliers = detectOutliers(entries);

  tableBody.innerHTML = "";

  entries.forEach(e => {
    const tr = document.createElement("tr");
    if (outliers.has(e.id)) tr.classList.add("outlier");

    tr.innerHTML = `
  <td>${e.date}</td>
  <td>${e.category}</td>
  <td>${e.amount}</td>
  <td>
    <button data-edit="${e.id}">Edit</button>
    <button data-delete="${e.id}">Delete</button>
  </td>
`;
    tableBody.appendChild(tr);
  });

  const totals = totalsByCategory(entries);
  totalsList.innerHTML = "";
  Object.entries(totals).forEach(([cat, val]) => {
    const li = document.createElement("li");
    li.textContent = `${cat}: ${val}`;
    totalsList.appendChild(li);
  });

  renderChart(chartCtx, totalsDaily(entries));
}

form.addEventListener("submit", e => {
  e.preventDefault();
  addEntry({
    id: generateId(),
    amount: Number(amount.value),
    category: category.value,
    date: date.value,
    createdAt: Date.now()
  });
  form.reset();
  render();
});

tableBody.addEventListener("click", e => {
  if (e.target.dataset.delete) {
    deleteEntry(e.target.dataset.delete);
    render();
  }
});

render();