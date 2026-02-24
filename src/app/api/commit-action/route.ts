import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import agentEvents from '@/lib/events';

export async function POST(req: NextRequest) {
    const dbPath = resolve(process.cwd(), 'juris_state.db');
    const db = new Database(dbPath);

    try {
        const { resourceCost } = await req.json();

        if (!resourceCost || !resourceCost.type || typeof resourceCost.amount !== 'number') {
            return NextResponse.json({ error: 'Invalid resourceCost payload' }, { status: 400 });
        }

        const { type, amount } = resourceCost;
        let success = false;

        // 1. Map and execute resource deduction
        if (type === 'hp') {
            // Update Vitals
            const result = db.prepare('UPDATE state_vitals SET current_hp = current_hp - ? WHERE id = ?')
                .run(amount, 'main');
            success = result.changes > 0;
        } else if (type.startsWith('spell_slots_') || type === 'lay_on_hands') {
            // Update Resources
            const result = db.prepare('UPDATE state_resources SET current_value = current_value - ? WHERE id = ?')
                .run(amount, type);
            success = result.changes > 0;
        } else {
            // Check for book benefits or other resources
            const result = db.prepare('UPDATE state_book_benefits SET uses_remaining = uses_remaining - ? WHERE id = ? AND uses_remaining >= 0')
                .run(amount, type);
            success = result.changes > 0;
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
