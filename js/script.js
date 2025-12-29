import { saveEntries, loadEntries } from './storage.js';
import { totalsByCategory, detectOutliers } from './calculations.js';
import { renderChart } from './chart.js';

let table; 
let expenses = [];
let categories = [];

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
  $('#newExpenseCategory').val(categories[0] || '');
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

  categoryChartInstance = new Chart(document.getElementById("categoryChart"), {
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

  timedChartInstance = new Chart(document.getElementById("timed"), {
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
$(document).ready(function () {
  $(".ui.dropdown").dropdown();
  $(".category-menu").dropdown(getCategories());
  $("#addExpenseBtn").click(() => $("#addExpenseModal").modal("show"));
  $("#addCategoryBtn").click(() => $("#addCategoryModal").modal("show"));
  initialize(dummyExpenses);
});


function initialize(data) {
  table = createTable(data);
  initDataTableStyle();
  var categoricalData = calculateCategoricalData(data);
  var timedData = calculateTimedData(data);
  summarize(categoricalData);
  createCharts(categoricalData, timedData);
  

$("#datefilter").daterangepicker(dateRangePickerConf, function (start, end, label) {
  // بروزرسانی متن داخل input
  $("#datefilter").val(start.format("YYYY/MM/DD") + " - " + end.format("YYYY/MM/DD"));

  // فیلتر کردن داده‌ها
  const filtered = expenses.filter(item => {
    const itemDate = moment(item.date, "YYYY-MM-DD");
    return itemDate.isBetween(start, end, null, "[]");
  });

  // بروزرسانی جدول، خلاصه و چارت‌ها
  updateTableAndCharts(filtered);

  // *** خط مهم: بستن دستی پنجرهٔ picker ***
  $("#datefilter").data("daterangepicker").hide();
});




}

function initDataTableStyle() {
  $("#dt-length-0").addClass("ui dropdown");
  $(".dt-layout-cell.dt-layout-end").addClass("ui form");
  $(".dt-search").addClass("field");
  $("#dt-search-0").addClass("ui input");
  $('label[for="dt-search-0"]').remove();
  $("#dt-search-0").prop("placeholder", "Search");
  $(".dt-paging-button.current").addClass("active item");
}

function createTable(data) {
  const table = $("table").DataTable({
    rowId: "ID",
    data: data,
    columns: [
      { data: "ID", title: "ID", visible: false },
      { data: "category", title: "Category" },
      { data: "date", title: "Date" },
      { data: "amount", title: "Amount" },
    ],
    createdRow: function (row, data) {
      if (data.anomaly === true) {
        row.classList.add("negative");
      }
    },
    initComplete: function () {
      var api = this.api();
      api.$("tr").on("click", function () {
        console.log(this.id);
      });
    },
  });
  return table;
}

function createCharts(categoricalData, timedData) {
  const catLabels = Object.keys(categoricalData);
  const catCanvas = document.getElementById("categoryChart");
  if (catCanvas) {
    new Chart(catCanvas, {
    type: "doughnut",
    data: {
      labels: catLabels,
      datasets: [
        {
          data: Object.values(categoricalData),
          backgroundColor: catLabels.map(
            () => `hsl(${Math.random() * 360},70%,60%)`,
          ),
        },
      ],
    },
  })
  };
  const timedCanvas = document.getElementById("timed");
  if (timedCanvas) {
    new Chart(timedCanvas, {
    type: "line",
    data: {
      labels: timedData.map((item) => item.label),
      datasets: [
        {
          label: "Spending",
          data: timedData.map((item) => item.value),
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    },
  });
  }
}

function calculateCategoricalData(data) {
  return data.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = 0;
    acc[item.category] += item.amount;
    return acc;
  }, {});
}

function getTotalAmounts(filteredData) {
  const totalsByCategory = filteredData.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = 0;
    acc[item.category] += item.amount;
    return acc;
  }, {});
  return totalsByCategory;
}

function calculateTimedData(data) {
  const dates = {};
  data.forEach((item) => {
    const date = item.date.split("-").join("");
    if (!dates[date]) {
      dates[date] = 0;
    }
    dates[date] += item.amount;
  });
  return Object.entries(dates).map(([date, amount]) => ({
    label: date,
    value: amount,
  }));
}

function summarize(categoricalData) {
  let text = "<strong>Total Spending per Category</strong><br /><br />";
  for (const category in categoricalData) {
    text += `You have spent <b>${categoricalData[category]}</b> on ${category}.<br>`;
  }
  const total = Object.values(categoricalData).reduce((acc, val) => acc + val, 0);
  text += `<div class="ui divider"></div><strong>Total: ${total}</strong>`;
  $("#summary").html(text);
}

function render(data, table) {
  console.log(table);
  table.clear().rows.add(data).draw();
  const categoricalData = calculateCategoricalData(data);
  const timedData = calculateTimedData(data);
  createCharts(categoricalData, timedData);
}

function timeFilter(start, end) {
  var data = dummyExpenses;
  render(
    data.filter((item) => {
      const itemDate = moment(item.date, "YYYY-MM-DD");
      return itemDate.isBetween(start, end, null, "[]");
    }, table),
  );
}

function getCategories() {
  return { values: categories };
}

function addExpense(category, amount, date) {
  const id = crypto.randomUUID().replaceAll("-", "");
  const newExp = { ID: id, date, category, amount: Number(amount), anomaly: false };
  dummyExpenses.push(newExp);
  // re-render table and charts
  if (table) {
    table.clear().rows.add(dummyExpenses).draw();
  }
  createCharts(calculateCategoricalData(dummyExpenses), calculateTimedData(dummyExpenses));
}

function editExpense(id, category, amount, date) {
  console.log(id, category, amount, date);
}

function deleteExpense(id) {
  console.log(id);
}

function addCategory(name) {
  categories.push({ value: name.toLowerCase().replace(" ", "-"), name });
}

/*var categories = [
  { value: "food", name: "Food" },
  { value: "transport", name: "Transport" },
  { value: "entertainment", name: "Entertainment" },
  { value: "other", name: "Other" },
];*/

const dummyExpenses = [
  {
    ID: "0e7a158b-d849-490a-a16b-6c618a3669dc",
    date: "2025-01-01",
    category: "Food",
    amount: 100,
    anomaly: false,
  },
  {
    ID: "12345678-9abc-def0-1234-56789abcdef0",
    date: "2025-01-02",
    category: "Transport",
    amount: 50,
    anomaly: false,
  },
  {
    ID: "23456789-0abc-def0-1234-56789abcdef0",
    date: "2025-01-03",
    category: "Entertainment",
    amount: 75,
    anomaly: false,
  },
  {
    ID: "34567890-1abc-def0-1234-56789abcdef0",
    date: "2025-01-04",
    category: "Shopping",
    amount: 150,
    anomaly: true,
  },
  {
    ID: "45678901-2abc-def0-1234-56789abcdef0",
    date: "2025-01-05",
    category: "Food",
    amount: 120,
    anomaly: false,
  },
  {
    ID: "56789012-3abc-def0-1234-56789abcdef0",
    date: "2025-01-06",
    category: "Transport",
    amount: 60,
    anomaly: false,
  },
  {
    ID: "67890123-4abc-def0-1234-56789abcdef0",
    date: "2025-01-07",
    category: "Food",
    amount: 80,
    anomaly: false,
  },
  {
    ID: "78901234-5abc-def0-1234-56789abcdef0",
    date: "2025-01-08",
    category: "Entertainment",
    amount: 90,
    anomaly: false,
  },
  {
    ID: "89012345-6abc-def0-1234-56789abcdef0",
    date: "2025-01-09",
    category: "Food",
    amount: 110,
    anomaly: false,
  },
  {
    ID: "90123456-7abc-def0-1234-56789abcdef0",
    date: "2025-01-10",
    category: "Transport",
    amount: 70,
    anomaly: false,
  },
  {
    ID: "10123456-8abc-def0-1234-56789abcdef0",
    date: "2025-01-11",
    category: "Food",
    amount: 90,
    anomaly: false,
  },
  {
    ID: "11234567-9abc-def0-1234-56789abcdef0",
    date: "2025-01-12",
    category: "Transport",
    amount: 80,
    anomaly: true,
  },
  {
    ID: "12345678-0abc-def0-1234-56789abcdef0",
    date: "2025-01-13",
    category: "Food",
    amount: 100,
    anomaly: false,
  },
  {
    ID: "13456789-1abc-def0-1234-56789abcdef0",
    date: "2025-01-14",
    category: "Transport",
    amount: 50,
    anomaly: false,
  },
  {
    ID: "14567890-2abc-def0-1234-56789abcdef0",
    date: "2025-01-15",
    category: "Entertainment",
    amount: 75,
    anomaly: false,
  },
  {
    ID: "15678901-3abc-def0-1234-56789abcdef0",
    date: "2025-01-16",
    category: "Shopping",
    amount: 150,
    anomaly: false,
  },
  {
    ID: "16789012-4abc-def0-1234-56789abcdef0",
    date: "2025-01-17",
    category: "Food",
    amount: 120,
    anomaly: false,
  },
  {
    ID: "17890123-5abc-def0-1234-56789abcdef0",
    date: "2025-01-18",
    category: "Transport",
    amount: 60,
    anomaly: false,
  },
  {
    ID: "18901234-6abc-def0-1234-56789abcdef0",
    date: "2025-01-19",
    category: "Food",
    amount: 80,
    anomaly: false,
  },
  {
    ID: "19012345-7abc-def0-1234-56789abcdef0",
    date: "2025-01-20",
    category: "Entertainment",
    amount: 90,
    anomaly: false,
  },
  {
    ID: "20123456-8abc-def0-1234-56789abcdef0",
    date: "2025-01-21",
    category: "Food",
    amount: 110,
    anomaly: true,
  },
  {
    ID: "21234567-9abc-def0-1234-56789abcdef0",
    date: "2025-01-22",
    category: "Transport",
    amount: 70,
    anomaly: false,
  },
  {
    ID: "22345678-0abc-def0-1234-56789abcdef0",
    date: "2025-01-23",
    category: "Food",
    amount: 90,
    anomaly: false,
  },
  {
    ID: "23456789-1abc-def0-1234-56789abcdef0",
    date: "2025-01-24",
    category: "Transport",
    amount: 80,
    anomaly: false,
  },
  {
    ID: "24567890-2abc-def0-1234-56789abcdef0",
    date: "2025-01-25",
    category: "Food",
    amount: 100,
    anomaly: false,
  },
];
