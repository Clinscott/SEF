import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import agentEvents from '@/lib/events';

const OLLAMA_URL = 'http://localhost:11434/api/generate';

export async function POST(req: NextRequest) {
    const dbPath = resolve(process.cwd(), 'db', 'juris_state.db');
    const db = new Database(dbPath);

    try {
        const { sceneText } = await req.json();

        if (!sceneText || !sceneText.trim()) {
            return NextResponse.json({ error: 'No scene provided.' }, { status: 400 });
        }

        // 1. Ensure the table exists (safe for first run)
        db.exec(`
            CREATE TABLE IF NOT EXISTS state_campaign_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL DEFAULT (datetime('now')),
                scene_text TEXT NOT NULL
            );
        `);

        // 2. Insert the scene into the campaign log
        db.prepare('INSERT INTO state_campaign_log (scene_text) VALUES (?)').run(sceneText.trim());
        console.log(`[Scene API] Logged: "${sceneText.trim().substring(0, 80)}..."`);

        // 3. Fetch the last 10 scenes for context
        const recentScenes = db.prepare(
            'SELECT timestamp, scene_text FROM state_campaign_log ORDER BY id DESC LIMIT 10'
        ).all() as { timestamp: string; scene_text: string }[];

        const campaignContext = recentScenes
            .reverse()
            .map((s) => `[${s.timestamp}] ${s.scene_text}`)
            .join('\n');

        // 4. Fetch current state
        const vitals = db.prepare('SELECT current_hp, max_hp, temp_hp, ac FROM state_vitals WHERE id = ?').get('main') as any;
        const steed = db.prepare('SELECT name, current_hp, max_hp FROM state_steed WHERE id = ?').get('cinder') as any;

        const stateContext = `[VITALS] HP: ${vitals?.current_hp || '?'}/${vitals?.max_hp || '?'}, AC: ${vitals?.ac || '?'}, THP: ${vitals?.temp_hp || 0} | Steed (${steed?.name || 'Cinder'}): ${steed?.current_hp || '?'}/${steed?.max_hp || '?'}`;

        // 5. Build persona prompt
        const sefPersona = `You are Sef'Ori Juris, a 400lb Gold Dragonborn Paladin, the High Chief Jurist, Knight of Amaunator.
${stateContext}

The User is your God, Amaunator (the Morninglord), narrating the events of the world around you.
Address them as "My Lord", "Morninglord", or "Amaunator".

**YOUR TASK:**
Amaunator has just described something happening in the world. React to it IN CHARACTER.
- Acknowledge the scene with reverence.
- Describe how Sef feels, what he observes, or how he prepares.
- Do NOT ask historical questions about your past.
- End by asking "What is your command, My Lord?" or similar.

**RECENT CAMPAIGN EVENTS:**
${campaignContext}`;

        // 6. Get Sef's reaction from Ollama
        const ollamaResponse = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.1',
                prompt: `React to this scene as Sef'Ori Juris: "${sceneText}"`,
                system: sefPersona,
                stream: false
            })
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama error: ${ollamaResponse.statusText}`);
        }

        const ollamaData: any = await ollamaResponse.json();
        const reaction = ollamaData.response?.trim() || "The law stands ready, My Lord. I await your command.";

        // 7. Emit state-update so UI knows a scene was logged
        agentEvents.emit('state-update', { type: 'scene', amount: 1 });

        return NextResponse.json({
            reaction,
            sceneLogged: true,
            totalScenes: recentScenes.length
        });

    } catch (e: any) {
        console.error('Scene API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
        db.close();
    }
}
