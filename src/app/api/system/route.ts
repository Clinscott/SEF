import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import agentEvents from '@/lib/events';

export async function POST(req: NextRequest) {
    const dbPath = resolve(process.cwd(), 'db', 'juris_state.db');
    const db = new Database(dbPath);

    try {
        const { command, args } = await req.json();

        if (command === '/grantxp') {
            const amount = parseInt(args[0]);
            if (isNaN(amount)) {
                return NextResponse.json({ error: "Invalid XP amount." }, { status: 400 });
            }

            const xpResource = db.prepare('SELECT current_value, max_value FROM state_resources WHERE id = ?').get('xp') as any;
            if (!xpResource) {
                return NextResponse.json({ error: "XP resource not found in database." }, { status: 500 });
            }

            const newXp = xpResource.current_value + amount;

            // Check for level up
            let levelUp = false;
            let currentLevel = 4;
            let nextThreshold = xpResource.max_value;

            // Simplified D&D XP thresholds
            const getNextThreshold = (level: number) => {
                const thresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
                return thresholds[level] || 355000;
            };

            const levelResource = db.prepare('SELECT current_value FROM state_resources WHERE id = ?').get('level') as any;
            if (levelResource) {
                currentLevel = levelResource.current_value;
            }

            if (newXp >= nextThreshold && currentLevel < 20) {
                levelUp = true;
                currentLevel++;
                nextThreshold = getNextThreshold(currentLevel);
                db.prepare('UPDATE state_resources SET current_value = ? WHERE id = ?').run(currentLevel, 'level');
            }

            db.prepare('UPDATE state_resources SET current_value = ?, max_value = ? WHERE id = ?').run(newXp, nextThreshold, 'xp');

            agentEvents.emit('state-update', { type: 'xp', amount: amount });

            if (levelUp) {
                agentEvents.emit('state-update', { type: 'level', amount: 1 });
            }

            return NextResponse.json({
                success: true,
                newXp,
                levelUp,
                newLevel: currentLevel
            });
        }

        if (command === '/set_attribute') {
            let { key, value } = args;
            console.log(`[System API] Setting attribute: ${key} = ${value}`);
            if (!key || (value === undefined && key !== 'full_heal')) {
                return NextResponse.json({ error: "Missing key or value." }, { status: 400 });
            }

            // Delta Handling Logic
            let isDelta = false;
            let deltaValue = 0;
            if (typeof value === 'string' && (value.startsWith('+') || value.startsWith('-'))) {
                isDelta = true;
                deltaValue = parseInt(value);
            } else if (typeof value === 'number' && (key === 'current_hp' || key === 'xp') && value < 0) {
                // Heuristic: negative current_hp or xp in a decree usually means "take damage" or "gain xp"
                isDelta = true;
                deltaValue = value;
            }

            // Determine target table
            let newValue = value;
            if (key === 'max_hp' || key === 'current_hp' || key === 'ac') {
                if (isDelta) {
                    db.prepare(`UPDATE state_vitals SET ${key} = ${key} + ? WHERE id = 'main'`).run(deltaValue);
                } else {
                    db.prepare(`UPDATE state_vitals SET ${key} = ? WHERE id = 'main'`).run(value);
                }
                const updated = db.prepare(`SELECT ${key} FROM state_vitals WHERE id = 'main'`).get() as any;
                newValue = updated[key];
            } else if (key === 'steed_hp' || key === 'steed_max_hp') {
                const dbKey = key === 'steed_hp' ? 'current_hp' : 'max_hp';
                if (isDelta) {
                    db.prepare(`UPDATE state_steed SET ${dbKey} = ${dbKey} + ? WHERE id = 'cinder'`).run(deltaValue);
                } else {
                    db.prepare(`UPDATE state_steed SET ${dbKey} = ? WHERE id = 'cinder'`).run(value);
                }
                const updated = db.prepare(`SELECT ${dbKey} FROM state_steed WHERE id = 'cinder'`).get() as any;
                newValue = updated[dbKey];
            } else if (key === 'full_heal') {
                db.prepare("UPDATE state_vitals SET current_hp = max_hp WHERE id = 'main'").run();
                db.prepare("UPDATE state_steed SET current_hp = max_hp WHERE id = 'cinder'").run();
                const updated = db.prepare("SELECT current_hp FROM state_vitals WHERE id = 'main'").get() as any;
                newValue = updated.current_hp;
            } else if (['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(key)) {
                const modifier = Math.floor((value - 10) / 2);
                db.prepare('UPDATE state_attributes SET value = ?, modifier = ? WHERE id = ?').run(value, modifier, key);
                newValue = value;
            } else if (key === 'xp') {
                const amount = isDelta ? Math.abs(deltaValue) : value;
                // Reuse XP logic directly here or call a helper. 
                // For now, let's keep it simple and just do the update + level check
                const xpResource = db.prepare('SELECT current_value, max_value FROM state_resources WHERE id = ?').get('xp') as any;
                if (xpResource) {
                    const newXp = isDelta ? (xpResource.current_value + amount) : value;

                    let levelUp = false;
                    let currentLevel = 4;
                    let nextThreshold = xpResource.max_value;
                    const getNextThreshold = (level: number) => {
                        const thresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
                        return thresholds[level] || 355000;
                    };

                    const levelResource = db.prepare('SELECT current_value FROM state_resources WHERE id = ?').get('level') as any;
                    if (levelResource) currentLevel = levelResource.current_value;

                    if (newXp >= nextThreshold && currentLevel < 20) {
                        levelUp = true;
                        currentLevel++;
                        nextThreshold = getNextThreshold(currentLevel);
                        db.prepare('UPDATE state_resources SET current_value = ? WHERE id = ?').run(currentLevel, 'level');
                        agentEvents.emit('state-update', { type: 'level', amount: 1 });
                    }

                    db.prepare('UPDATE state_resources SET current_value = ?, max_value = ? WHERE id = ?').run(newXp, nextThreshold, 'xp');
                    newValue = newXp;
                }
            } else {
                db.prepare('UPDATE state_resources SET current_value = ? WHERE id = ?').run(value, key);
                newValue = value;
            }

            agentEvents.emit('state-update', { type: 'attribute', key, value: newValue });
            return NextResponse.json({ success: true, key, value: newValue });
        }

        if (command === '/add_proficiency') {
            const { id, name, type } = args;
            db.prepare('INSERT OR REPLACE INTO state_proficiencies (id, name, type) VALUES (?, ?, ?)').run(id, name, type);
            agentEvents.emit('state-update', { type: 'proficiency', id, name });
            return NextResponse.json({ success: true, id, name });
        }

        if (command === '/add_feature') {
            const { id, name, description, source } = args;
            db.prepare('INSERT OR REPLACE INTO state_features (id, name, description, source) VALUES (?, ?, ?, ?)').run(id, name, description, source);
            agentEvents.emit('state-update', { type: 'feature', id, name });
            return NextResponse.json({ success: true, id, name });
        }

        return NextResponse.json({ error: "Unknown command" }, { status: 404 });

    } catch (e: any) {
        console.error('System API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
        db.close();
    }
}
