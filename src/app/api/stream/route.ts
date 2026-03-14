import { NextRequest } from 'next/server';
import agentEvents from '@/lib/events';
import Database from 'better-sqlite3';
import { resolve } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const encoder = new TextEncoder();
    const dbPath = resolve(process.cwd(), 'db', 'juris_state.db');

    const stream = new ReadableStream({
        start(controller) {
            const sendUpdate = () => {
                const db = new Database(dbPath);
                try {
                    const vitals = db.prepare('SELECT * FROM state_vitals WHERE id = ?').get('main');
                    const steed = db.prepare('SELECT * FROM state_steed WHERE id = ?').get('cinder');
                    const resources = db.prepare('SELECT id, current_value, max_value FROM state_resources').all();
                    const lore = db.prepare('SELECT id, topic, memory_text FROM state_lore').all();

                    const data = {
                        vitals,
                        steed,
                        resources,
                        bookBenefits: db.prepare('SELECT id, active FROM state_book_benefits').all(),
                        lore
                    };

                    console.log(`[SSE Stream] Pushing update to client. HP: ${(vitals as any).current_hp}/${(vitals as any).max_hp}`);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch (e) {
                    console.error('SSE Update Error:', e);
                } finally {
                    db.close();
                }
            };

            // Send initial state
            sendUpdate();

            // Listen for state changes
            const listener = () => {
                sendUpdate();
            };

            agentEvents.on('state-update', listener);

            // Heartbeat every 30s to keep connection alive
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ heartbeat: true })}\n\n`));
                } catch (e) {
                    clearInterval(heartbeat);
                }
            }, 30000);

            // Cleanup on close
            req.signal.addEventListener('abort', () => {
                console.log('[SSE Stream] Client aborted connection');
                agentEvents.off('state-update', listener);
                clearInterval(heartbeat);
                try {
                    controller.close();
                } catch (e) {
                    // Already closed
                }
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
