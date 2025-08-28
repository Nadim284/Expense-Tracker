/*
 * ExpenseTracker
 *
 * This class encapsulates all of the logic required to operate a simple
 * income/expense tracker with category support. Transactions and
 * categories are persisted in the browser’s localStorage so that data
 * remains after refresh. Each transaction is associated with a category,
 * selected from a drop‑down populated from the category manager page.
 */

class ExpenseTracker {
  constructor() {
    // Grab references to DOM elements that we’ll update frequently
    this.balance = document.getElementById('balance');
    this.money_plus = document.getElementById('money-plus');
    this.money_minus = document.getElementById('money-minus');
    this.list = document.getElementById('list');
    this.form = document.getElementById('form');
    this.text = document.getElementById('text');
    this.amount = document.getElementById('amount');
    this.transactionTypeInputs = document.getElementsByName('transactionType');
    this.categorySelect = document.getElementById('category');

    // Load existing transactions and categories from local storage
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    this.categories = JSON.parse(localStorage.getItem('categories')) || [];

    // Populate the category drop‑down and render existing transactions
    this.init();

    // Bind event listeners
    this.form.addEventListener('submit', this.addTransaction.bind(this));
  }

  /**
   * Populate the category select element with available categories. The first
   * option is always “Uncategorized”.
   */
  populateCategoryDropdown() {
    if (!this.categorySelect) return;
    this.categorySelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Uncategorized';
    this.categorySelect.appendChild(defaultOption);
    this.categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      this.categorySelect.appendChild(option);
    });
  }

  /**
   * Initialize the view by clearing the list, rendering transactions, updating
   * totals and populating the category drop‑down.
   */
  init() {
    // Clear the list to avoid duplication
    this.list.innerHTML = '';
    this.populateCategoryDropdown();
    // Render each existing transaction
    this.transactions.forEach(transaction => this.addTransactionDOM(transaction));
    // Update the numerical summaries
    this.updateValues();
  }

  /**
   * Determine which radio button (income/expense) is currently selected.
   * @returns {string} 'income' or 'expense'
   */
  getSelectedTransactionType() {
    for (const input of this.transactionTypeInputs) {
      if (input.checked) return input.value;
    }
    // Default to expense if nothing is selected
    return 'expense';
  }

  /**
   * Handler for the transaction form submission. Validates input values,
   * constructs a transaction object and inserts it into both the UI and
   * internal state.
   * @param {Event} e
   */
  addTransaction(e) {
    e.preventDefault();
    const text = this.text.value.trim();
    const amountValue = this.amount.value.trim();
    if (text === '' || amountValue === '') {
      alert('Please enter text and amount');
      return;
    }
    let amount = Math.abs(parseFloat(amountValue));
    if (isNaN(amount)) {
      alert('Please enter a valid number');
      return;
    }
    const type = this.getSelectedTransactionType();
    if (type === 'expense') amount = -amount;
    const category = this.categorySelect && this.categorySelect.value
      ? this.categorySelect.value
      : '';
    const transaction = {
      id: Date.now(),
      text,
      amount,
      category: category || 'Uncategorized',
    };
    // Append to our transactions array and persist
    this.transactions.push(transaction);
    this.updateLocalStorage();
    // Add to DOM and update totals
    this.addTransactionDOM(transaction);
    this.updateValues();
    // Clear the input fields for convenience
    this.text.value = '';
    this.amount.value = '';
  }

  /**
   * Insert a transaction entry into the history list. Attaches a delete
   * listener to the delete button.
   * @param {Object} transaction
   */
  addTransactionDOM(transaction) {
    const li = document.createElement('li');
    li.classList.add(transaction.amount < 0 ? 'minus' : 'plus');
    li.dataset.id = transaction.id;
    // Format the amount with a leading sign and two decimals
    const sign = transaction.amount < 0 ? '-' : '+';
    const formattedAmount = `$${Math.abs(transaction.amount).toFixed(2)}`;
    // Transaction description
    const textSpan = document.createElement('span');
    textSpan.textContent = transaction.text;
    // Category label
    const categorySpan = document.createElement('span');
    categorySpan.textContent = transaction.category;
    categorySpan.classList.add('category-label');
    // Amount
    const amountSpan = document.createElement('span');
    amountSpan.textContent = `${sign}${formattedAmount}`;
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'x';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', () => {
      this.removeTransaction(transaction.id);
    });
    // Compose the list item
    li.appendChild(textSpan);
    li.appendChild(categorySpan);
    li.appendChild(amountSpan);
    li.appendChild(deleteBtn);
    // Append to the list
    this.list.appendChild(li);
  }

  /**
   * Remove a transaction by id. Updates the underlying array,
   * re‑renders the list and updates the totals.
   * @param {number} id
   */
  removeTransaction(id) {
    this.transactions = this.transactions.filter(t => t.id !== id);
    this.updateLocalStorage();
    // Reinitialize the view to reflect removal
    this.init();
  }

  /**
   * Compute and update the balance, income and expense totals in the DOM.
   */
  updateValues() {
    const amounts = this.transactions.map(t => t.amount);
    const total = amounts.reduce((acc, item) => acc + item, 0);
    const income = amounts
      .filter(item => item > 0)
      .reduce((acc, item) => acc + item, 0);
    const expense = amounts
      .filter(item => item < 0)
      .reduce((acc, item) => acc + item, 0);
    // Update textContent properties with formatted numbers
    this.balance.textContent = `$${total.toFixed(2)}`;
    this.money_plus.textContent = `+$${income.toFixed(2)}`;
    this.money_minus.textContent = `-$${Math.abs(expense).toFixed(2)}`;
  }

  /**
   * Persist the transactions array to localStorage.
   */
  updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
  }
}

// Initialize the tracker once the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  // Expose the tracker on window so that event handlers can access it if needed
  window.tracker = new ExpenseTracker();
});
