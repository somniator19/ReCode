let table;
let expenses = [];
let categories = []; // simple array of category names, e.g. ["Food", "Transport"]

// LocalStorage keys
const STORAGE_KEY_EXPENSES = 'expenses';
const STORAGE_KEY_CATEGORIES = 'categories';

$(document).ready(function () {
  // load data from localStorage
  loadDataFromStorage();

  // initialize dropdowns
  $(".ui.dropdown").dropdown();

  // buttons
  $("#addExpenseBtn").click(() => openAddExpenseModal());
  $("#addCategoryBtn").click(() => $("#addCategoryModal").modal("show"));

  // save new category
  $("#saveCategoryBtn").click(addNewCategory);

  // initialize DateRangePicker
  $("#datefilter").daterangepicker(dateRangePickerConf, applyDateFilter);

  // initial setup
  updateCategoryDropdowns();
  initialize(expenses);
});

const dateRangePickerConf = {
  autoUpdateInput: false,
  opens: "left",
  locale: { format: "YYYY/MM/DD", cancelLabel: "Clear" },
  ranges: {
    "Today": [moment(), moment()],
    "Yesterday": [moment().subtract(1, "days"), moment().subtract(1, "days")],
    "Last 7 Days": [moment().subtract(6, "days"), moment()],
    "This Week": [moment().startOf("week"), moment().endOf("week")],
    "Last Week": [moment().subtract(1, "week").startOf("week"), moment().subtract(1, "week").endOf("week")],
    "This Month": [moment().startOf("month"), moment().endOf("month")],
    "Last Month": [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")],
    "This Year": [moment().startOf("year"), moment().endOf("year")],
    "Last Year": [moment().subtract(1, "year").startOf("year"), moment().subtract(1, "year").endOf("year")],
    "All Time": [moment("2000-01-01"), moment()],
  },
};

// load data from localStorage
function loadDataFromStorage() {
  const savedExpenses = localStorage.getItem(STORAGE_KEY_EXPENSES);
  const savedCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES);

  expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
  categories = savedCategories ? JSON.parse(savedCategories) : ["Food", "Transport", "Entertainment", "Shopping", "Other"];

  // if empty, add some sample data
  if (expenses.length === 0) {
    expenses = generateSampleExpenses();
    saveToStorage();
  }
}

// save to localStorage
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
  localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
}

// sample initial data
function generateSampleExpenses() {
  return [
    { ID: crypto.randomUUID(), date: "2025-12-20", category: "Food", amount: 150000, anomaly: false },
    { ID: crypto.randomUUID(), date: "2025-12-22", category: "Transport", amount: 80000, anomaly: false },
    { ID: crypto.randomUUID(), date: "2025-12-25", category: "Entertainment", amount: 200000, anomaly: true },
    { ID: crypto.randomUUID(), date: "2025-12-27", category: "Shopping", amount: 500000, anomaly: false },
  ];
}

// update category dropdown menus
function updateCategoryDropdowns() {
  $('.category-menu .menu').empty();
  categories.forEach(cat => {
    $('.category-menu .menu').append(`<div class="item" data-value="${cat}">${cat}</div>`);
  });
  $('.category-menu').dropdown('refresh');
}

// open add expense modal
function openAddExpenseModal() {
  updateCategoryDropdowns();
  $('#newxpenseCategory').val(categories[0] || '');
  $('.category-menu').dropdown('set selected', categories[0] || '');
  $('#newExpenseAmount').val('');
  $('#newExpenseDate').val(moment().format('YYYY-MM-DD'));
  $('#addExpenseModal').modal('show');
}

// add new category
function addNewCategory() {
  const name = $('#newCategoryName').val().trim();
  if (!name) {
    alert("Please enter a category name!");
    return;
  }
  if (categories.includes(name)) {
    alert("This category already exists!");
    return;
  }

  categories.push(name);
  saveToStorage();
  updateCategoryDropdowns();
  $('#newCategoryName').val('');
  $('#addCategoryModal').modal('hide');
}

// add new expense
window.addExpense = function(category, amount, date) {
  if (!category || !amount || !date) {
    alert("Please fill all fields!");
    return;
  }
  amount = parseFloat(amount);
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount!");
    return;
  }

  const newExpense = {
    ID: crypto.randomUUID(),
    category,
    amount,
    date,
    anomaly: false
  };

  expenses.push(newExpense);
  saveToStorage();
  initialize(expenses);
  $('#addExpenseModal').modal('hide');
};

// edit or delete expense
window.editExpense = function() {
  const id = $('#editExpenseModal').data('id');
  const category = $('#editExpenseCategory').val();
  const amount = parseFloat($('#editExpenseAmount').val());
  const date = $('#editExpenseDate').val();

  const buttonText = event.target.textContent.trim();

  if (buttonText === "Delete") {
    if (confirm("Are you sure you want to delete this expense?")) {
      expenses = expenses.filter(e => e.ID !== id);
      saveToStorage();
      initialize(expenses);
      $('#editExpenseModal').modal('hide');
    }
    return;
  }

  // save changes
  if (!category || isNaN(amount) || amount <= 0 || !date) {
    alert("Please enter valid information!");
    return;
  }

  const index = expenses.findIndex(e => e.ID === id);
  if (index !== -1) {
    expenses[index] = { ...expenses[index], category, amount, date };
    saveToStorage();
    initialize(expenses);
    $('#editExpenseModal').modal('hide');
  }
};

// apply date filter
function applyDateFilter(start, end) {
  $('#datefilter').val(start.format('YYYY/MM/DD') + ' - ' + end.format('YYYY/MM/DD'));

  const filtered = expenses.filter(item => {
    const itemDate = moment(item.date, "YYYY-MM-DD");
    return itemDate.isBetween(start, end, null, "[]");
  });

  table.clear().rows.add(filtered).draw();

  const catData = calculateCategoricalData(filtered);
  const timeData = calculateTimedData(filtered);
  $("#summary").empty();
  summarize(catData);
  createCharts(catData, timeData);
}

// initialize table and charts
function initialize(data) {
  if (table) table.destroy();
  table = createTable(data);
  initDataTableStyle();

  const categoricalData = calculateCategoricalData(data);
  const timedData = calculateTimedData(data);
  $("#summary").empty();
  summarize(categoricalData);
  createCharts(categoricalData, timedData);
}

function createTable(data) {
  return $("#dataTable").DataTable({
    rowId: "ID",
    data: data,
    columns: [
      { data: "ID", title: "ID", visible: false },
      { data: "category", title: "Category" },
      { data: "date", title: "Date" },
      { data: "amount", title: "Amount", render: (data) => data.toLocaleString() },
    ],
    order: [[2, 'desc']],
    language: { emptyTable: "No expenses recorded." },
    createdRow: function (row, data) {
      if (data.anomaly) $(row).addClass("negative");
    },
    initComplete: function () {
      const api = this.api();
      api.$("tbody tr").off('click').on("click", function () {
        const rowData = api.row(this).data();
        updateCategoryDropdowns();
        $('#editExpenseCategory').val(rowData.category);
        $('.category-menu').dropdown('set selected', rowData.category);
        $('#editExpenseAmount').val(rowData.amount);
        $('#editExpenseDate').val(rowData.date);
        $('#editExpenseModal').data('id', rowData.ID);
        $('#editExpenseModal').modal('show');
      });
    }
  });
}

let categoryChartInstance = null;
let timedChartInstance = null;

function createCharts(categoricalData, timedData) {
  const labels = Object.keys(categoricalData);

  if (categoryChartInstance) categoryChartInstance.destroy();
  if (timedChartInstance) timedChartInstance.destroy();

  categoryChartInstance = new Chart($("#categoryChart"), {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: Object.values(categoricalData),
        backgroundColor: labels.map(() => `hsl(${Math.random() * 360}, 70%, 60%)`)
      }]
    },
    options: { responsive: true }
  });

  timedChartInstance = new Chart($("#timed"), {
    type: "line",
    data: {
      labels: timedData.map(i => i.label),
      datasets: [{
        label: "Expenses",
        data: timedData.map(i => i.value),
        borderColor: "#36A2EB",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.3,
        fill: true
      }]
    },
    options: { responsive: true }
  });
}

function calculateCategoricalData(data) {
  return data.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});
}

function calculateTimedData(data) {
  const monthly = {};
  data.forEach(item => {
    const month = moment(item.date).format("YYYY-MM");
    monthly[month] = (monthly[month] || 0) + item.amount;
  });

  return Object.keys(monthly).sort().map(key => ({
    label: key,
    value: monthly[key]
  }));
}

function summarize(categoricalData) {
  let html = '<h4 class="ui header">Total Expenses by Category</h4>';
  html += '<table class="ui very basic table"><tbody>';
  let total = 0;
  for (const cat in categoricalData) {
    const amt = categoricalData[cat];
    total += amt;
    html += `<tr><td><strong>${cat}</strong></td><td>${amt.toLocaleString()} \u058F</td></tr>`;
  }
  html += `<tr><td><strong>Total</strong></td><td><strong>${total.toLocaleString()} \u058F</strong></td></tr>`;
  html += '</tbody></table>';
  $("#summary").html(html);
}

function initDataTableStyle() {
  $("#dt-length-0").addClass("ui dropdown");
  $(".dt-layout-cell.dt-layout-end").addClass("ui form");
  $(".dt-search").addClass("field");
  $("#dt-search-0").addClass("ui input");
  $('label[for="dt-search-0"]').remove();
  $("#dt-search-0").prop("placeholder", "Search...");
}
