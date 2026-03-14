import Database from 'better-sqlite3';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'db', 'juris_state.db');
const db = new Database(dbPath);

console.log('--- DB SANITY CHECK ---');
console.log('Path:', dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((t: any) => t.name);
console.log('Tables:', tables.join(', '));

const checkTable = (name: string) => {
    if (tables.includes(name)) {
        const count = db.prepare(`SELECT count(*) as c FROM ${name}`).get() as any;
        console.log(`[PASS] ${name} exists (${count.c} records)`);
    } else {
        console.log(`[FAIL] ${name} MISSING`);
    }
};

['state_vitals', 'state_resources', 'state_attributes', 'state_proficiencies', 'state_features'].forEach(checkTable);

const vitals = db.prepare("SELECT * FROM state_vitals WHERE id = 'main'").get();
if (vitals) {
    console.log('[PASS] state_vitals has "main" record');
} else {
    console.log('[FAIL] state_vitals "main" record MISSING');
}

db.close();
