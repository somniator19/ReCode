// js/storage.js
// Handles persistence using localStorage

const STORAGE_KEYS = {
  EXPENSES: 'expenses',
  CATEGORIES: 'categories'
};

let expenses = [];
let categories = [
  { value: "food", name: "Food" },
  { value: "transport", name: "Transport" },
  { value: "entertainment", name: "Entertainment" },
  { value: "other", name: "Other" }
];

// Dummy data – used only if no saved data exists
const dummyExpenses = [ /* Paste your full dummyExpenses array here */ ];

// Load data from localStorage
export function loadData() {
  const savedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);

  if (savedExpenses && JSON.parse(savedExpenses).length > 0) {
    expenses = JSON.parse(savedExpenses);
  } else {
    expenses = [...dummyExpenses];
  }

  if (savedCategories && JSON.parse(savedCategories).length > 0) {
    categories = JSON.parse(savedCategories);
  }

  return { expenses, categories };
}

// Save current data to localStorage
export function saveData() {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

// Getters (used by script.js)
export function getExpenses() {
  return expenses;
}

export function setExpenses(newExpenses) {
  expenses = newExpenses;
  saveData();
}

export function getCategories() {
  return categories;
}

export function setCategories(newCategories) {
  categories = newCategories;
  saveData();
}

// Optional: clear everything (for debugging)
export function clearAllData() {
  localStorage.removeItem(STORAGE_KEYS.EXPENSES);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  expenses = [...dummyExpenses];
  categories = [
    { value: "food", name: "Food" },
    { value: "transport", name: "Transport" },
    { value: "entertainment", name: "Entertainment" },
    { value: "other", name: "Other" }
  ];
}