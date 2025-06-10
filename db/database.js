const Database = require('better-sqlite3');
const db = new Database('./db/cap_app.db', { verbose: console.log });

// Create table if not exists
db.prepare(`
    CREATE TABLE IF NOT EXISTS referees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        celular TEXT NOT NULL,
        email TEXT NOT NULL,
        alias TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

module.exports = db;
