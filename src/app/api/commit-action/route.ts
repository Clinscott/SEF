import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import agentEvents from '@/lib/events';

export async function POST(req: NextRequest) {
    const dbPath = resolve(process.cwd(), 'db', 'juris_state.db');
    const db = new Database(dbPath);

    try {
        const { resourceCost } = await req.json();

        if (!resourceCost || !resourceCost.type || typeof resourceCost.amount !== 'number') {
            return NextResponse.json({ error: 'Invalid resourceCost payload' }, { status: 400 });
        }

        const { type, amount } = resourceCost;

        // 0. Handle no-op actions
        const noOpTypes = ['none', 'null', 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        if (noOpTypes.includes(type.toLowerCase()) || amount === 0) {
            console.log(`[Mutation] No-op action received (${type}: ${amount})`);
            return NextResponse.json({ success: true, resource: type, deducted: 0, message: 'No mutation required.' });
        }

        let success = false;

        // 1. Map and execute resource deduction
        if (type === 'hp') {
            // Update Vitals
            const result = db.prepare('UPDATE state_vitals SET current_hp = current_hp - ? WHERE id = ?')
                .run(amount, 'main');
            success = result.changes > 0;
        } else if (type === 'xp' && amount < 0) {
            // Special handling for XP gain (negative deduction implies addition)
            const xpAdded = Math.abs(amount);

            // Reusing logic from /api/system for level ups
            const xpResource = db.prepare('SELECT current_value, max_value FROM state_resources WHERE id = ?').get('xp') as any;
            if (xpResource) {
                const newXp = xpResource.current_value + xpAdded;
                let levelUp = false;
                let currentLevel = 4;
                let nextThreshold = xpResource.max_value;

                const getNextThreshold = (level: number) => {
                    const thresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
                    return thresholds[level] || 355000;
                };

                const levelResource = db.prepare('SELECT current_value FROM state_resources WHERE id = ?').get('level') as any;
                if (levelResource) { currentLevel = levelResource.current_value; }

                if (newXp >= nextThreshold && currentLevel < 20) {
                    levelUp = true;
                    currentLevel++;
                    nextThreshold = getNextThreshold(currentLevel);
                    db.prepare('UPDATE state_resources SET current_value = ? WHERE id = ?').run(currentLevel, 'level');
                    agentEvents.emit('state-update', { type: 'level', amount: 1 });
                }

                db.prepare('UPDATE state_resources SET current_value = ?, max_value = ? WHERE id = ?').run(newXp, nextThreshold, 'xp');
                success = true;
            }
        } else {
            // Try updating state_resources first (handles spell_slots, lay_on_hands, proficiency_bonus, etc.)
            const resResult = db.prepare('UPDATE state_resources SET current_value = current_value - ? WHERE id = ?')
                .run(amount, type);

            if (resResult.changes > 0) {
                success = true;
            } else {
                // Try updating book benefits
                const bookResult = db.prepare('UPDATE state_book_benefits SET uses_remaining = uses_remaining - ? WHERE id = ? AND uses_remaining >= 0')
                    .run(amount, type);
                success = bookResult.changes > 0;
            }
        }

        if (success) {
            // 2. Fire SSE Trigger
            agentEvents.emit('state-update', { type, amount });
            console.log(`[Mutation] Successfully deducted ${amount} from ${type}`);
            return NextResponse.json({ success: true, resource: type, deducted: amount });
        } else {
            return NextResponse.json({
                error: `Resource '${type}' not found or could not be updated.`,
                success: false
            }, { status: 404 });
        }

    } catch (e: any) {
        console.error('Commit Action Route Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
        db.close();
    }
}
