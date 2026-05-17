const API = 'http://localhost:3000';

function showTab(tab, el) {
  document.getElementById('loginForm').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

async function register() {
  const username = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const msg      = document.getElementById('registerMsg');

  if (!username || !email || !password) {
    msg.style.color = 'red';
    msg.textContent = '⚠️ Fill all fields!';
    return;
  }

  const res    = await fetch(`${API}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const result = await res.json();

  if (res.ok) {
    msg.style.color = 'green';
    msg.textContent = '✅ Registered! Please login.';
  } else {
    msg.style.color = 'red';
    msg.textContent = '❌ ' + result.error;
  }
}

async function login() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const msg      = document.getElementById('loginMsg');

  if (!email || !password) {
    msg.style.color = 'red';
    msg.textContent = '⚠️ Fill all fields!';
    return;
  }

  const res    = await fetch(`${API}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const result = await res.json();

  if (res.ok) {
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    window.location.href = 'dashboard.html';
  } else {
    msg.style.color = 'red';
    msg.textContent = '❌ ' + result.error;
  }
}

// Redirect if already logged in
window.onload = () => {
  if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
  }
};