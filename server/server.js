const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

const dbPath = path.join(__dirname, 'users.db');
const db = new Database(dbPath);

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function validateEmailServer(email) {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return 'Email is required.';
  }
  if (!email.includes('@')) {
    return 'Email must contain "@".';
  }
  return null;
}

function validatePasswordServer(password) {
  if (!password || typeof password !== 'string') {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  return null;
}

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const emailError = validateEmailServer(email);
  if (emailError) {
    return res.status(400).json({ error: emailError });
  }

  const passwordError = validatePasswordServer(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  // INTENTIONALLY VULNERABLE: string concatenation in SQL query (SQL Injection)
  const query = `SELECT id, email, password, role FROM users WHERE email = '${email}' AND password = '${password}'`;

  try {
    const user = db.prepare(query).get();

    if (user) {
      return res.json({
        success: true,
        user: { id: user.id, email: user.email, role: user.role }
      });
    }

    return res.status(401).json({ error: 'Invalid email or password.' });
  } catch (err) {
    return res.status(500).json({ error: 'Database error occurred.' });
  }
});

app.listen(PORT, () => {
  console.log(`Juice Shop login demo running at http://localhost:${PORT}`);
});
