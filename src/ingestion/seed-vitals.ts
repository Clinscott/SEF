import Database from 'better-sqlite3';
import { resolve } from 'path';

const dbPath = resolve(process.cwd(), 'db', 'juris_state.db');
const db = new Database(dbPath);

try {
  // 0. Ensure tables exist
  db.exec(`
      CREATE TABLE IF NOT EXISTS state_attributes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        value INTEGER DEFAULT 10,
        modifier INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS state_proficiencies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL
      );
    `);

  // 1. Sef's Vitals (22/48, 1 THP, 18 AC) - CORRECTED MAX HP
  db.prepare('INSERT OR REPLACE INTO state_vitals (id, current_hp, max_hp, temp_hp, ac) VALUES (?, ?, ?, ?, ?)')
    .run('main', 22, 48, 1, 18);

  // 2. Resources
  const insertResource = db.prepare('INSERT OR REPLACE INTO state_resources (id, name, current_value, max_value, reset_type) VALUES (?, ?, ?, ?, ?)');

  insertResource.run('lay_on_hands', 'Lay on Hands', 10, 20, 'long_rest');
  insertResource.run('channel_divinity', 'Channel Divinity', 2, 2, 'short_rest');
  insertResource.run('spell_slots_l1', 'Spell Slots Level 1', 3, 3, 'long_rest');
  insertResource.run('spell_slots_l2', 'Spell Slots Level 2', 2, 2, 'long_rest');
  insertResource.run('xp', 'Experience Points', 2700, 6500, 'never');
  insertResource.run('level', 'Paladin Level', 4, 20, 'never');

  // 3. Cinder's Vitals (35/35, 12 AC, 60 Speed)
  db.prepare('INSERT OR REPLACE INTO state_steed (id, name, type, current_hp, max_hp, ac, speed, otherworldly_stride_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run('cinder', 'Cinder', 'Celestial', 35, 35, 12, 60, 1);

  // 4. Attributes (STR: 18(+4), DEX: 10(0), CON: 16(+3), INT: 9(-1), WIS: 12(+1), CHA: 16(+3))
  const insertAttr = db.prepare('INSERT OR REPLACE INTO state_attributes (id, name, value, modifier) VALUES (?, ?, ?, ?)');
  insertAttr.run('str', 'Strength', 18, 4);
  insertAttr.run('dex', 'Dexterity', 10, 0);
  insertAttr.run('con', 'Constitution', 16, 3);
  insertAttr.run('int', 'Intelligence', 9, -1);
  insertAttr.run('wis', 'Wisdom', 12, 1);
  insertAttr.run('cha', 'Charisma', 16, 3);

  // 5. Proficiencies
  const insertProf = db.prepare('INSERT OR REPLACE INTO state_proficiencies (id, name, type) VALUES (?, ?, ?)');
  insertProf.run('athletics', 'Athletics', 'skill');
  insertProf.run('insight', 'Insight', 'skill');
  insertProf.run('intimidation', 'Intimidation', 'skill');
  insertProf.run('religion', 'Religion', 'skill');
  insertProf.run('heavy_armor', 'Heavy Armor', 'armor');
  insertProf.run('martial_weapons', 'Martial Weapons', 'weapon');

  console.log('Success: Vitals, resources, attributes, and proficiencies seeded for Phase 4.3.');
} catch (e: any) {
  console.error('Failure seeding vitals:', e.message);
} finally {
  db.close();
}
