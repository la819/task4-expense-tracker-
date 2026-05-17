const API = 'https://task4-expense-tracker-production.up.railway.app';
let editingId = null;

// Check login
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) window.location.href = 'index.html';

document.getElementById('navUser').textContent  = '👤 ' + user.username;
document.getElementById('loggedUser').textContent = user.username;

// Set today's date
document.getElementById('date').valueAsDate = new Date();

async function loadExpenses() {
  const res      = await fetch(`${API}/api/expenses`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const expenses = await res.json();
  const tbody    = document.getElementById('expenseList');
  const total    = expenses.reduce((sum, e) => sum + e.amount, 0);

  document.getElementById('totalAmount').textContent = 'Rs. ' + total.toLocaleString();
  document.getElementById('totalCount').textContent  = expenses.length;

  if (expenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999">No expenses yet!</td></tr>';
    return;
  }

  tbody.innerHTML = expenses.map(e => `
    <tr>
      <td><strong>${e.title}</strong></td>
      <td class="amount-cell">Rs. ${e.amount.toLocaleString()}</td>
      <td><span class="category-badge">${e.category}</span></td>
      <td>${new Date(e.date).toLocaleDateString()}</td>
      <td>
        <button class="edit-btn"   onclick="editExpense('${e._id}','${e.title}',${e.amount},'${e.category}','${e.date}')">✏️ Edit</button>
        <button class="delete-btn" onclick="deleteExpense('${e._id}')">🗑️ Delete</button>
      </td>
    </tr>
  `).join('');
}

async function submitExpense() {
  const title    = document.getElementById('title').value.trim();
  const amount   = document.getElementById('amount').value;
  const category = document.getElementById('category').value;
  const date     = document.getElementById('date').value;
  const msg      = document.getElementById('formMsg');

  if (!title || !amount || !category) {
    msg.style.color = 'red';
    msg.textContent = '⚠️ Fill all fields!';
    return;
  }

  if (editingId) {
    await fetch(`${API}/api/expenses/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ title, amount, category, date })
    });
    msg.style.color = 'green';
    msg.textContent = '✅ Expense updated!';
    cancelEdit();
  } else {
    await fetch(`${API}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ title, amount, category, date })
    });
    msg.style.color = 'green';
    msg.textContent = '✅ Expense added!';
  }

  document.getElementById('title').value    = '';
  document.getElementById('amount').value   = '';
  document.getElementById('category').value = '';
  await loadExpenses();
}

function editExpense(id, title, amount, category, date) {
  editingId = id;
  document.getElementById('title').value    = title;
  document.getElementById('amount').value   = amount;
  document.getElementById('category').value = category;
  document.getElementById('date').value     = date.split('T')[0];
  document.getElementById('submitBtn').textContent    = '💾 Update Expense';
  document.getElementById('cancelBtn').style.display  = 'inline-block';
  document.getElementById('formTitle').textContent    = '✏️ Edit Expense';
}

function cancelEdit() {
  editingId = null;
  document.getElementById('title').value    = '';
  document.getElementById('amount').value   = '';
  document.getElementById('category').value = '';
  document.getElementById('submitBtn').textContent    = '➕ Add Expense';
  document.getElementById('cancelBtn').style.display  = 'none';
  document.getElementById('formTitle').textContent    = '➕ Add New Expense';
}

async function deleteExpense(id) {
  if (confirm('Delete this expense?')) {
    await fetch(`${API}/api/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    document.getElementById('formMsg').style.color   = 'green';
    document.getElementById('formMsg').textContent   = '✅ Expense deleted!';
    await loadExpenses();
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

loadExpenses();