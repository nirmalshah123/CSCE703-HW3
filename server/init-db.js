const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'users.db');
const db = new Database(dbPath);

db.exec(`
  DROP TABLE IF EXISTS users;
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer'
  );
`);

const insert = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');

insert.run('customer@juice-sh.op', 'customer123', 'customer');
insert.run('admin@juice-sh.op', 'admin12345', 'admin');

console.log('Database initialized with sample users:');
console.log('  customer@juice-sh.op / customer123');
console.log('  admin@juice-sh.op / admin12345');

db.close();
