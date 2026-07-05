const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const serverMessage = document.getElementById('serverMessage');

function validateEmail(email) {
  if (!email.trim()) {
    return 'Email is required.';
  }
  if (!email.includes('@')) {
    return 'Email must contain "@".';
  }
  return '';
}

function validatePassword(password) {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  return '';
}

function showFieldError(input, errorEl, message) {
  if (message) {
    input.classList.add('invalid');
    errorEl.textContent = message;
  } else {
    input.classList.remove('invalid');
    errorEl.textContent = '';
  }
}

function validateForm() {
  const emailMsg = validateEmail(emailInput.value);
  const passwordMsg = validatePassword(passwordInput.value);

  showFieldError(emailInput, emailError, emailMsg);
  showFieldError(passwordInput, passwordError, passwordMsg);

  return !emailMsg && !passwordMsg;
}

function showServerMessage(message, type) {
  serverMessage.textContent = message;
  serverMessage.className = `server-message ${type}`;
  serverMessage.hidden = false;
}

emailInput.addEventListener('blur', () => {
  showFieldError(emailInput, emailError, validateEmail(emailInput.value));
});

passwordInput.addEventListener('blur', () => {
  showFieldError(passwordInput, passwordError, validatePassword(passwordInput.value));
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  serverMessage.hidden = true;

  if (!validateForm()) {
    return;
  }

  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.value,
        password: passwordInput.value
      })
    });

    const data = await response.json();

    if (response.ok) {
      showServerMessage(
        `Welcome, ${data.user.email}! Role: ${data.user.role}`,
        'success'
      );
    } else {
      showServerMessage(data.error || 'Login failed.', 'error');
    }
  } catch {
    showServerMessage('Unable to reach server. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});
