import Database from 'better-sqlite3';
import { resolve } from 'path';
import agentEvents from '@/lib/events';

const dbPath = resolve(process.cwd(), 'juris_state.db');

export function getCharacterState() {
    const db = new Database(dbPath);
    try {
        const vitals = db.prepare('SELECT * FROM state_vitals WHERE id = ?').get('main');
        const steed = db.prepare('SELECT * FROM state_steed WHERE id = ?').get('cinder');
        const resources = db.prepare('SELECT id, current_value, max_value FROM state_resources').all();
        return { vitals, steed, resources };
    } finally {
        db.close();
    }
}

export function updateVitals(current_hp: number, temp_hp: number) {
    const db = new Database(dbPath);
    try {
        db.prepare('UPDATE state_vitals SET current_hp = ?, temp_hp = ? WHERE id = ?')
            .run(current_hp, temp_hp, 'main');

        // Emit event to notify the SSE stream
        agentEvents.emit('stateUpdate');
    } finally {
        db.close();
    }
}

export function updateResource(id: string, current_value: number) {
    const db = new Database(dbPath);
    try {
        db.prepare('UPDATE state_resources SET current_value = ? WHERE id = ?')
            .run(current_value, id);

        agentEvents.emit('stateUpdate');
    } finally {
        db.close();
    }
}

export function updateSteedVitals(current_hp: number) {
    const db = new Database(dbPath);
    try {
        db.prepare('UPDATE state_steed SET current_hp = ? WHERE id = ?')
            .run(current_hp, 'cinder');

        agentEvents.emit('stateUpdate');
    } finally {
        db.close();
    }
}
