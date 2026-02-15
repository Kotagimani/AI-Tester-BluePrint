import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQL.js
const SQL = await initSqlJs();

// Load existing database or create new
let db;
if (fs.existsSync(DB_PATH)) {
  const buffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(buffer);
} else {
  db = new SQL.Database();
}

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    summary TEXT,
    data_json TEXT NOT NULL,
    fetched_at TEXT DEFAULT (datetime('now'))
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS test_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    ticket_summary TEXT,
    template_id INTEGER,
    content TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

saveDb();

// Helper: Save database to disk
function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Wrapper for compatibility with the rest of the codebase
// Provides a prepare/run/get/all interface similar to better-sqlite3
const dbWrapper = {
  prepare(sql) {
    return {
      run(...params) {
        db.run(sql, params);
        // Only save if NOT in a transaction (autocommit mode)
        if (!db._inTransaction) {
          saveDb();
        }

        // Emulate better-sqlite3 info
        return { changes: db.getRowsModified(), lastInsertRowid: 0 };
      },
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        let row = undefined;
        if (stmt.step()) {
          row = stmt.getAsObject();
        }
        stmt.free();
        return row;
      },
      all(...params) {
        const results = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },
    };
  },
  run(sql, params = []) {
    db.run(sql, params);
    if (!db._inTransaction) saveDb();
  },
  exec(sql) {
    db.run(sql);
    if (!db._inTransaction) saveDb();
  },
  transaction(fn) {
    return (...args) => {
      db.run('BEGIN TRANSACTION');
      db._inTransaction = true; // Manual flag
      try {
        const result = fn(...args);
        db.run('COMMIT');
        db._inTransaction = false;
        saveDb(); // Save only after commit
        return result;
      } catch (err) {
        db.run('ROLLBACK');
        db._inTransaction = false;
        throw err;
      }
    };
  },
};

export default dbWrapper;
