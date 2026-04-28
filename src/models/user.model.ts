import { Database } from 'bun:sqlite';

const dbPath = Bun.env.DATABASE_PATH || './mydb.sqlite';
const db = new Database(dbPath, { create: true });

// Initialize Table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`);

export const UserModel = {
  findByUsername: (username: string) => {
    return db.query('SELECT * FROM users WHERE username = ?').get(username) as any;
  },
  create: (username: string, password: string) => {
    return db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
  }
};
