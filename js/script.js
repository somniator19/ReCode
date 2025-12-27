$(document).ready(function () {
  $(".ui.dropdown").dropdown();
  $(".category-menu").dropdown(getCategories());
  $("#addExpenseBtn").click(() => $("#addExpenseModal").modal("show"));
  $("#addCategoryBtn").click(() => $("#addCategoryModal").modal("show"));
  initialize(dummyExpenses);
});

const dateRangePickerConf = {
  autoUpdateInput: false,
  opens: "left",
  locale: { format: "YYYY/MM/DD", cancelLabel: "Clear" },
  ranges: {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, "days"), moment().subtract(1, "days")],
    "Last 7 Days": [moment().subtract(6, "days"), moment()],
    "This Week": [moment().startOf("week"), moment().endOf("week")],
    "Last Week": [
      moment().subtract(1, "week").startOf("week"),
      moment().subtract(1, "week").endOf("week"),
    ],
    "This Month": [moment().startOf("month"), moment().endOf("month")],
    "Last Month": [
      moment().subtract(1, "month").startOf("month"),
      moment().subtract(1, "month").endOf("month"),
    ],
    "This Year": [moment().startOf("year"), moment().endOf("year")],
    "Last Year": [
      moment().subtract(1, "year").startOf("year"),
      moment().subtract(1, "year").endOf("year"),
    ],
    "All Time": [moment("2000-01-01"), moment()],
  },
};

function initialize(data) {
  const table = createTable(data);
  initDataTableStyle();
  var categoricalData = calculateCategoricalData(data);
  var timedData = calculateTimedData(data);
  summarize(categoricalData);
  createCharts(categoricalData, timedData);
  $("#datefilter").daterangepicker(dateRangePickerConf, function (start, end) {
    console.log(data);
    var filteredData = data.filter((item) => {
      const itemDate = moment(item.date, "YYYY-MM-DD");
      return itemDate.isBetween(start, end, null, "[]");
    });
    table.clear().rows.add(filteredData).draw();
    categoricalData = calculateCategoricalData(filteredData);
    timedData = calculateTimedData(filteredData);
    $("#summary").empty();
    summarize(categoricalData);
    createCharts(categoricalData, timedData);
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
  catLabels = Object.keys(categoricalData);
  new Chart(document.getElementById("categoryChart"), {
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
  });
  new Chart(document.getElementById("timed"), {
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
  total = Object.values(categoricalData).reduce((acc, val) => acc + val, 0);
  text += `<div class="ui divider"></div><strong>Total: ${total}</strong>`;
  $("#summary").append(text);
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
  id = crypto.randomUUID().replaceAll("-", "");
  console.log(id, category, amount, date);
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

var categories = [
  { value: "food", name: "Food" },
  { value: "transport", name: "Transport" },
  { value: "entertainment", name: "Entertainment" },
  { value: "other", name: "Other" },
];

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
