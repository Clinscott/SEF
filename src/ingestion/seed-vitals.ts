import Database from 'better-sqlite3';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'juris_state.db');
const db = new Database(dbPath);

console.log('--- Seeding Sef\'Ori Juris Vitals (Phase 4.2) ---');

try {
    // 1. Sef's Vitals (22/48, 1 THP, 18 AC) - CORRECTED MAX HP
    db.prepare('INSERT OR REPLACE INTO state_vitals (id, current_hp, max_hp, temp_hp, ac) VALUES (?, ?, ?, ?, ?)')
        .run('main', 22, 48, 1, 18);

    // 2. Resources
    const insertResource = db.prepare('INSERT OR REPLACE INTO state_resources (id, name, current_value, max_value, reset_type) VALUES (?, ?, ?, ?, ?)');

    insertResource.run('lay_on_hands', 'Lay on Hands', 10, 20, 'long_rest');
    insertResource.run('channel_divinity', 'Channel Divinity', 2, 2, 'short_rest');
    insertResource.run('spell_slots_l1', 'Spell Slots Level 1', 3, 3, 'long_rest');
    insertResource.run('spell_slots_l2', 'Spell Slots Level 2', 2, 2, 'long_rest');

    // 3. Cinder's Vitals (35/35, 12 AC, 60 Speed)
    db.prepare('INSERT OR REPLACE INTO state_steed (id, name, type, current_hp, max_hp, ac, speed, otherworldly_stride_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run('cinder', 'Cinder', 'Celestial', 35, 35, 12, 60, 1);

    console.log('Success: Vitals and resources seeded for Phase 4.2.');
} catch (e: any) {
    console.error('Failure seeding vitals:', e.message);
} finally {
    db.close();
}
