import Database from 'better-sqlite3';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'db', 'juris_state.db');
const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('--- Tables ---');
tables.forEach(t => console.log((t as any).name));
db.close();
