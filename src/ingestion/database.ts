import Database from 'better-sqlite3';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'juris_state.db');
const db = new Database(dbPath);

export function initializeDatabase() {
  // --- Static Reference Tables ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS ref_attributes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      score INTEGER DEFAULT 10,
      modifier INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ref_masteries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      engine_logic_ref TEXT
    );

    CREATE TABLE IF NOT EXISTS ref_weapons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      damage_die TEXT,
      mastery_id TEXT,
      FOREIGN KEY (mastery_id) REFERENCES ref_masteries(id)
    );

    CREATE TABLE IF NOT EXISTS ref_spells (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level INTEGER,
      casting_time TEXT,
      action_type TEXT,
      range TEXT,
      description TEXT
    );
  `);

  // --- Dynamic State Tables (SSoT) ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS state_vitals (
      id TEXT PRIMARY KEY,
      current_hp INTEGER,
      max_hp INTEGER,
      temp_hp INTEGER,
      ac INTEGER
    );

    CREATE TABLE IF NOT EXISTS state_resources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      current_value INTEGER,
      max_value INTEGER,
      reset_type TEXT
    );

    CREATE TABLE IF NOT EXISTS state_conditions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      active INTEGER DEFAULT 0,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS state_book_benefits (
      id TEXT PRIMARY KEY,
      chapter TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      uses_remaining INTEGER DEFAULT 1,
      max_uses INTEGER DEFAULT 1,
      reset_type TEXT DEFAULT 'long_rest',
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS state_steed (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      current_hp INTEGER,
      max_hp INTEGER,
      ac INTEGER,
      speed INTEGER,
      otherworldly_stride_available INTEGER DEFAULT 1
    );
  `);

  // --- Audit/Narrative Metadata ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS lore_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  console.log(`[Database] Initialized at ${dbPath}`);
}

export default db;
