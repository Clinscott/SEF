import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import { TACTICAL_SYSTEM_PROMPT } from '@/agent/prompts/tactical-verdict';

export async function POST(req: NextRequest) {
    const dbPath = resolve(process.cwd(), 'db', 'juris_state.db');
    const db = new Database(dbPath);

    try {
        const { scenario } = await req.json();

        // 1. Fetch Sef's current state for context injection
        let context = '';
        try {
            const vitals = db.prepare('SELECT * FROM state_vitals WHERE id = ?').get('main');
            const steed = db.prepare('SELECT * FROM state_steed WHERE id = ?').get('cinder');
            const resources = db.prepare('SELECT id, current_value, max_value FROM state_resources').all();
            const bookBenefits = db.prepare('SELECT id, active FROM state_book_benefits').all();
            const memories = db.prepare('SELECT memory_text FROM state_lore').all();
            const attributes = db.prepare('SELECT id, value, modifier FROM state_attributes').all();
            const proficiencies = db.prepare('SELECT name FROM state_proficiencies').all();
            const features = db.prepare('SELECT name FROM state_features').all();

            context = `
# LORE & MEMORY
${memories.length > 0 ? memories.map((m: any) => `- ${m.memory_text}`).join('\n') : '- My origins are shrouded in golden mist. I must forge my history through trial.'}

# CURRENT CHARACTER STATE:
- HP: ${(vitals as any).current_hp}/${(vitals as any).max_hp} (Temp HP: ${(vitals as any).temp_hp})
- AC: ${(vitals as any).ac}
- Cinder (Steed) HP: ${(steed as any).current_hp}/${(steed as any).max_hp}
- Attributes: ${attributes.map((a: any) => `${a.id.toUpperCase()}: ${a.value}(${a.modifier >= 0 ? '+' : ''}${a.modifier})`).join(', ')}
- Proficiencies: ${proficiencies.map((p: any) => p.name).join(', ')}
- Features: ${features.map((f: any) => f.name).join(', ') || 'None'}
- Resources: ${resources.map((r: any) => `${r.id}: ${r.current_value}${r.max_value ? '/' + r.max_value : ''}`).join(', ')}
- Active Book Chapters: ${bookBenefits.filter((b: any) => b.active === 1).map((b: any) => b.id).join(', ')}

# RECENT CAMPAIGN EVENTS:
${(() => {
                    try {
                        const scenes = db.prepare('SELECT timestamp, scene_text FROM state_campaign_log ORDER BY id DESC LIMIT 5').all() as any[];
                        return scenes.length > 0
                            ? scenes.reverse().map((s: any) => `[${s.timestamp}] ${s.scene_text}`).join('\n')
                            : '- No campaign events recorded yet.';
                    } catch { return '- Campaign log unavailable.'; }
                })()}

USER SCENARIO:
"${scenario}"
`;
        } catch (dbError: any) {
            console.error(`[Tactical API] DB Error:`, dbError.message);
            context = `Character state temporarily obscured. Focus on the immediate scenario: ${scenario}`;
        }

        const fullPrompt = `${TACTICAL_SYSTEM_PROMPT}\n\n${context}`;

        // 2. Fetch from local Ollama
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.1',
                prompt: fullPrompt,
                format: 'json',
                stream: false
            })
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama Error: ${ollamaResponse.statusText}`);
        }

        const rawData = await ollamaResponse.json();
        // 3. More robust JSON extraction
        const jsonMatch = rawData.response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in Ollama response");
        }
        const jsonString = jsonMatch[0];

        try {
            const parsedVerdict = JSON.parse(jsonString);
            return NextResponse.json(parsedVerdict);
        } catch (parseError) {
            console.error('Failed to parse extracted JSON:', jsonString);
            // 4. Fallback object to prevent UI crash
            return NextResponse.json({
                observation: "The Morninglord's light is obscured by the fog of war.",
                soulVoice: {
                    reaction: "The signal is garbled, but my instincts remain sharp. Stand ready.",
                    dogmaViolation: false,
                    citation: "Chapter I: Authority Is Inherent"
                },
                movement: { speed: 30, recommendation: "Hold your ground and await clarity." },
                action: { type: "dodge", details: "Adopt a defensive stance." },
                bonusAction: { type: "none", details: "No bonus action taken." },
                reaction: { type: "protection", trigger: "Any incoming strike", details: "Deflect with divine certainty." },
                dialogue: "Faith is the only anchor in the storm."
            });
        }

    } catch (e: any) {
        console.error('Tactical Route Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
        db.close();
    }
}
