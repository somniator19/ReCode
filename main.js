import { loadEntries, addEntry, deleteEntry } from "./storage.js";
import { totalsByCategory, totalsDaily, detectOutliers } from "./calculations.js";
import { renderChart } from "./chart.js";

const form = document.getElementById("entry-form");
const tableBody = document.querySelector("#entries-table tbody");
const totalsList = document.getElementById("category-totals");

const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const chartCtx = document
  .getElementById("spendingChart")
  .getContext("2d");

function generateId() {
  return Date.now().toString();
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
        <button data-id="${e.id}">Delete</button>
      </td>`
    ;

    tableBody.appendChild(tr);
  });

  const totals = totalsByCategory(entries);
  totalsList.innerHTML = "";

  Object.entries(totals).forEach(([cat, sum]) => {
    const li = document.createElement("li");
    li.textContent = `${cat}: ${sum}`;
    totalsList.appendChild(li);
  });

  renderChart(chartCtx, totalsDaily(entries));
}

form.addEventListener("submit", e => {
  e.preventDefault();

  addEntry({
    id: generateId(),
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value
  });

  form.reset();
  render();
});

tableBody.addEventListener("click", e => {
  if (e.target.tagName === "BUTTON") {
    deleteEntry(e.target.dataset.id);
    render();
  }
});

render();