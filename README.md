# CSCE703 HW3 — Juice Shop Login Form

A Juice Shop–inspired login page with **client-side** and **server-side** validation, plus an **intentionally vulnerable** SQL query for security demonstration.

**GitHub Repository:** [https://github.com/nirmalshah123/CSCE703-HW3](https://github.com/nirmalshah123/CSCE703-HW3)

---

## Project Structure

```
HW3/
├── public/
│   ├── index.html          # Login form (Juice Shop style)
│   ├── css/style.css       # Styling
│   └── js/validation.js    # Client-side validation
├── server/
│   ├── server.js           # Express API with server-side validation
│   ├── init-db.js          # SQLite database setup
│   └── users.db            # Generated after init-db
├── package.json
└── README.md
```

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later

### Installation

```bash
git clone https://github.com/nirmalshah123/CSCE703-HW3.git
cd CSCE703-HW3
npm install
npm run init-db
npm start
```

Open **http://localhost:3000** in your browser.

---

## Part 2 — What Was Implemented (100 words)

I built a Juice Shop–style login page with email and password fields styled like the OWASP Juice Shop preview site. The form includes client-side validation that blocks empty submissions, requires "@" in the email, and enforces an eight-character minimum password. Matching server-side validation runs on the Express backend before any database lookup. On successful login, the server returns the user's email and role. The project includes a SQLite database with sample customer and admin accounts, a README with setup instructions, and documentation for this assignment. The repository should be public on GitHub for instructor assessment.

---

## Part 2 — How It Was Implemented (100 words)

The frontend uses HTML for structure, CSS for Juice Shop–inspired styling, and vanilla JavaScript for validation. The `validateEmail` and `validatePassword` functions check required fields, the "@" symbol, and password length. On submit, the form sends a JSON POST to `/api/login`. The Express server mirrors the same validation rules in `validateEmailServer` and `validatePasswordServer` before querying SQLite. User credentials are stored via `init-db.js`. The server responds with JSON containing the authenticated user's role or an error message, which the frontend displays in a styled alert box below the login button.

---

## Part 2 — Validation Features

### Client-Side (`public/js/validation.js`)

| Check | Rule |
|-------|------|
| Empty email | Shows "Email is required." |
| Empty password | Shows "Password is required." |
| Email format | Must contain `@` |
| Password length | Minimum 8 characters |

Validation runs on **blur** and on **form submit**. Invalid fields are highlighted in red.

### Server-Side (`server/server.js`)

The `/api/login` endpoint repeats the same rules before querying the database:

- Rejects missing or blank email/password
- Requires `@` in email
- Requires password length ≥ 8

---

## Sample Credentials

| Email | Password | Role |
|-------|----------|------|
| `customer@juice-sh.op` | `customer123` | customer |
| `admin@juice-sh.op` | `admin12345` | admin |

---

## Part 3 — SQL Injection Attack Documentation

### Vulnerability

The login endpoint in `server/server.js` builds SQL queries using **string concatenation**:

```javascript
const query = `SELECT id, email, password, role FROM users WHERE email = '${email}' AND password = '${password}'`;
```

User input is inserted directly into the query without sanitization or parameterized statements, making the application vulnerable to **SQL Injection**.

### Attack Steps

#### Step 1 — Start the application

```bash
npm install
npm run init-db
npm start
```

Open **http://localhost:3000**.

#### Step 2 — Enter the SQL injection payload

Because both client-side and server-side validation require `@` in the email, use a comment-based bypass that still satisfies that rule.

In the **Email** field, enter:

```
admin@juice-sh.op'--
```

In the **Password** field, enter any valid password (8+ characters):

```
anything1
```

#### Step 3 — Submit the form

Click **Log in**.

#### Step 4 — Observe the result

The injected query becomes:

```sql
SELECT id, email, password, role FROM users
WHERE email = 'admin@juice-sh.op'--' AND password = 'anything1'
```

The `--` comments out the password check, so only the email condition is evaluated. The server returns the admin account without a valid password.

**Expected success message:**

```
Welcome, admin@juice-sh.op! Role: admin
```

You have logged in as the **admin** without knowing the real admin password.

### Alternative Payload (OR-based bypass)

**Email:**

```
x' OR '1'='1' -- @x.com
```

**Password:**

```
password
```

The `@` in `@x.com` satisfies validation. The query becomes:

```sql
SELECT ... WHERE email = 'x' OR '1'='1' -- @x.com' AND password = 'password'
```

Because `'1'='1'` is always true, the query returns the first user in the database.

### Screenshot Description

After submitting the `admin@juice-sh.op'--` payload, the green success banner below the login button displays:

> **Welcome, admin@juice-sh.op! Role: admin**

This confirms unauthorized access to the admin account without valid credentials.

### Recommended Fix

**Use parameterized queries (prepared statements)** instead of string concatenation:

```javascript
// SECURE — parameterized query
const user = db.prepare(
  'SELECT id, email, password, role FROM users WHERE email = ? AND password = ?'
).get(email, password);
```

Parameterized queries treat user input as **data**, not executable SQL, preventing injection attacks. Additional best practices:

- Hash passwords with bcrypt (never store plaintext)
- Use an ORM or query builder with built-in escaping
- Apply the principle of least privilege for database accounts
- Add input validation as defense-in-depth (not a substitute for parameterized queries)

### Why Client-Side Validation Does Not Prevent This

Client-side checks only enforce format rules (non-empty, `@`, length). An attacker can bypass them by sending crafted requests directly to `/api/login` via curl or Burp Suite. Server-side validation must never trust user input when constructing SQL.

### XSS Protection

Although this application is **vulnerable to SQL Injection**, it is **protected against XSS (Cross-Site Scripting)** through safe DOM handling on the frontend.

**How XSS is prevented:**

1. **`textContent` instead of `innerHTML`** — All user-facing messages (validation errors, login success/failure) are written using `textContent`, not `innerHTML`. This treats input as plain text, so script tags are never parsed or executed by the browser.

   ```javascript
   // validation.js — safe output
   errorEl.textContent = message;
   serverMessage.textContent = message;
   ```

2. **JSON API responses** — The server returns structured JSON (`{ user: { email, role } }`), not HTML pages with embedded user input. The frontend extracts only the fields it needs and inserts them via `textContent`.

3. **No dangerous DOM APIs** — The code does not use `innerHTML`, `document.write`, `eval()`, or `insertAdjacentHTML()` anywhere, eliminating common XSS injection points.

4. **Input fields are text-only** — Email and password values stay inside `<input>` elements, which the browser renders as text. They are never injected into the page as raw HTML.

**Example — XSS payload blocked:**

If an attacker enters this in the email field:

```
<script>alert('XSS')</script>@test.com
```

The script does **not** execute. On login failure or success, the email would appear as literal text in the message banner (e.g., `Welcome, <script>alert('XSS')</script>@test.com! Role: admin`) because `textContent` escapes HTML entities automatically.

**Contrast with SQL Injection:** XSS targets the browser/DOM layer; SQL Injection targets the database query layer. Fixing one does not fix the other — parameterized queries prevent SQLi, while output encoding (`textContent` / HTML escaping) prevents XSS.

---

## Technology Stack

- **Frontend:** HTML5, CSS3, vanilla JavaScript
- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3)

---

## License

MIT — for academic use in CSCE703.
