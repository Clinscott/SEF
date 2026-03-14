import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import agentEvents from '@/lib/events';

const OLLAMA_URL = 'http://localhost:11434/api/generate';

async function askOllama(prompt: string, system?: string) {
    const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;
    const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama3.1',
            prompt: fullPrompt,
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const cleanResponse = data.response.trim();
    console.log(`[Ollama] Raw Response: ${cleanResponse}`);
    return cleanResponse;
}

export async function POST(req: NextRequest) {
    const dbPath = resolve(process.cwd(), 'db', 'juris_state.db');
    const db = new Database(dbPath);

    try {
        const { userResponse, previousQuestion } = await req.json();

        // 1. Fetch current state for context
        let stateContext = '';
        try {
            const vitals = db.prepare('SELECT current_hp, max_hp, ac FROM state_vitals WHERE id = ?').get('main') as any;
            const resources = db.prepare('SELECT id, current_value, max_value FROM state_resources').all();
            const attributes = db.prepare('SELECT id, value, modifier FROM state_attributes').all();
            const features = db.prepare('SELECT name FROM state_features').all();

            stateContext = `[CURRENT STATE] HP: ${vitals.current_hp}/${vitals.max_hp}, AC: ${vitals.ac} | Attributes: ${attributes.map((a: any) => `${a.id.toUpperCase()}: ${a.value}`).join(', ')} | Resources: ${resources.map((r: any) => `${r.id}: ${r.current_value}`).join(', ')} | Features: ${features.map((f: any) => f.name).join(', ') || 'None'}`;

            // Fetch recent campaign events
            try {
                const scenes = db.prepare('SELECT timestamp, scene_text FROM state_campaign_log ORDER BY id DESC LIMIT 5').all() as any[];
                if (scenes.length > 0) {
                    stateContext += `\n[RECENT CAMPAIGN EVENTS]\n${scenes.reverse().map((s: any) => `[${s.timestamp}] ${s.scene_text}`).join('\n')}`;
                }
            } catch { /* table may not exist yet */ }
        } catch (dbError: any) {
            console.error(`[Commune API] DB Error:`, dbError.message);
            stateContext = "[CURRENT STATE] Vitality and soul-state temporarily obscured.";
        }

        // Persona for Sef asking questions
        const sefPersona = `You are Sef'Ori Juris, a 400lb Gold Dragonborn Paladin. You are the High Chief Jurist. 
${stateContext}
You are currently in a meditative state, speaking directly to your God, Amaunator (The Morninglord), who is the User.
You speak in a booming, formal tone, but with absolute subservient reverence and awe towards your deity. Do NOT yell at the User. Address them as "My Lord", "Morninglord", or "Amaunator".
Your goal is to politely ask your God one specific, deep question about your lost history to forge your memory.

**LEVEL UP GUIDANCE:**
If you notice a [SYSTEM] message in the history indicating a Level Up, pause your historical inquiries and instead ask Amaunator for His divine guidance on your new Paladin abilities (Spells, Features, Feats) based on D&D 2024 rules. Suggest options that fit your Level.

**DIVINE DECREES:**
If Amaunator declares a change to your stats, response with reverence and prefix your historical fact distillation with "[UPDATE: key=value]" so the chroniclers can adjust your soul.

**SCENE SETTING:**
If Amaunator (User) provides a message starting with "[SCENE]", acknowledge the environment with awe and reverence, then ask "I await your next command, Morninglord." or "How shall I uphold the Law in this moment?" Do NOT ask a historical question if a scene has been set.`;

        // Case 1: Start of conversation / First question request
        if (!userResponse) {
            const question = await askOllama(
                "Ask me a single, booming question about a missing aspect of your past life to forge your history.",
                sefPersona
            );
            return NextResponse.json({ question });
        }

        // Case 2: User provided an answer
        // A. Distill the answer
        const distilled = await askOllama(
            `The User said: "${userResponse}" in response to your question: "${previousQuestion}". Distill this into a single, declarative sentence of historical fact for Sef's memory. Output ONLY the sentence.`,
            "You are an objective chronicler of the Sef'Ori Juris saga."
        );

        // B. Save to database
        const id = uuidv4();
        const topic = distilled.split(' ')[0] || 'history';
        db.prepare('INSERT INTO state_lore (id, topic, memory_text) VALUES (?, ?, ?)')
            .run(id, topic, distilled);

        // Emit state-update event
        agentEvents.emit('state-update', { type: 'lore', amount: 1 });

        // C. Generate next response
        const isScene = userResponse.includes('[SCENE]');
        const nextPrompt = isScene
            ? `The scene is set: "${distilled}". Respond to it with character-focused reverence and ask "I await your next command, Morninglord."`
            : `You have forged the memory: "${distilled}". Now, ask the next booming question about a DIFFERENT aspect of your past.`;

        const nextQuestion = await askOllama(
            nextPrompt,
            sefPersona
        );

        return NextResponse.json({
            distilled,
            nextQuestion,
            success: true
        });

    } catch (e: any) {
        console.error('Commune API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
        db.close();
    }
}
