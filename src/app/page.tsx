'use client';

import React, { useState, useEffect } from 'react';
import styles from './Aureate.module.css';
import Vitals, { VitalsData } from '@/components/Vitals';
import Resources from '@/components/Resources';
import JuristBook from '@/components/JuristBook';
import UnifiedChat from '@/components/UnifiedChat';
import { motion } from 'framer-motion';

export default function Home() {
    const [data, setData] = useState<VitalsData>({
        sef: { current: 22, max: 48, temp: 1 },
        cinder: { current: 35, max: 35 },
        loh: { current: 10, max: 20 },
        ac: 18
    });

    const [resources, setResources] = useState({
        loh: { current: 10, max: 20 },
        channelDivinity: { current: 2, max: 2 },
        spellSlots: {
            l1: { current: 3, max: 3 },
            l2: { current: 2, max: 2 }
        }
    });

    const [activeBookBenefits, setActiveBookBenefits] = useState<string[]>([]);
    const [lore, setLore] = useState<{ id: string; topic: string; memory_text: string; }[]>([]);

    const isLowHealth = data.sef.current < 10;

    useEffect(() => {
        const eventSource = new EventSource('/api/stream');

        eventSource.onopen = () => {
            console.log('--- [SSE] CONNECTION ESTABLISHED ---');
        };

        eventSource.onerror = (err) => {
            console.error('--- [SSE] CONNECTION ERROR ---', err);
        };

        eventSource.onmessage = (event) => {
            try {
                const update = JSON.parse(event.data);

                if (update.heartbeat) {
                    console.log('[SSE] Heartbeat received');
                    return;
                }

                console.log('[SSE] Update received:', update);

                if (!update.vitals) {
                    console.warn('[SSE] Received update with no vitals data');
                    return;
                }

                const loh = update.resources?.find((r: any) => r.id === 'lay_on_hands');
                const cd = update.resources?.find((r: any) => r.id === 'channel_divinity');
                const l1 = update.resources?.find((r: any) => r.id === 'spell_slots_l1');
                const l2 = update.resources?.find((r: any) => r.id === 'spell_slots_l2');

                setData({
                    sef: {
                        current: update.vitals.current_hp,
                        max: update.vitals.max_hp,
                        temp: update.vitals.temp_hp
                    },
                    cinder: {
                        current: update.steed?.current_hp || 0,
                        max: update.steed?.max_hp || 0
                    },
                    loh: {
                        current: loh?.current_value || 0,
                        max: loh?.max_value || 0
                    },
                    ac: update.vitals.ac
                });

                setResources({
                    loh: { current: loh?.current_value || 0, max: loh?.max_value || 20 },
                    channelDivinity: { current: cd?.current_value || 0, max: cd?.max_value || 2 },
                    spellSlots: {
                        l1: { current: l1?.current_value || 0, max: l1?.max_value || 3 },
                        l2: { current: l2?.current_value || 0, max: l2?.max_value || 2 }
                    }
                });

                const activeIds = (update.bookBenefits || [])
                    .filter((b: any) => b.active === 1)
                    .map((b: any) => b.id);
                setActiveBookBenefits(activeIds);

                if (update.lore) {
                    setLore(update.lore);
                }
            } catch (err) {
                console.error('[SSE] Failed to parse event data:', err);
            }
        };

        return () => {
            console.log('[SSE] Closing connection');
            eventSource.close();
        };
    }, []);

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 md:p-8 relative overflow-hidden">
            {/* Background Vitals/Resource glow */}
            <div className="absolute top-0 left-0 w-full h-[30vh] bg-amber-500/5 blur-[120px] pointer-events-none" />

            {isLowHealth && <div className={styles.lowHealthVignette} />}

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1800px] mx-auto w-full flex-1">
                {/* Left Sidebar: Vitals & Resources */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-3 space-y-8 flex flex-col"
                >
                    <section className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                        <h2 className="text-[10px] uppercase tracking-[0.3em] text-amber-500/60 font-black mb-4">Vitals Engine</h2>
                        <Vitals data={data} />
                    </section>

                    <section className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md flex-1">
                        <h2 className="text-[10px] uppercase tracking-[0.3em] text-amber-500/60 font-black mb-4">Mastery Resources</h2>
                        <Resources
                            loh={resources.loh}
                            channelDivinity={resources.channelDivinity}
                            spellSlots={resources.spellSlots}
                            sefHp={data.sef.current}
                        />
                    </section>
                </motion.div>

                {/* Center: Unified Chat Interface */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-6 flex flex-col h-[75vh]"
                >
                    <UnifiedChat />
                </motion.div>

                {/* Right Sidebar: Dogma */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-3 flex flex-col gap-8"
                >
                    <section className="flex-1">
                        <h2 className="text-[10px] uppercase tracking-[0.3em] text-amber-500/60 font-black mb-4 px-2">Juris Dogma & Lore</h2>
                        <JuristBook activeBenefitIds={activeBookBenefits} lore={lore} />
                    </section>
                </motion.div>
            </div>

            {/* Subtle Footer Citation */}
            <footer className="mt-8 text-center opacity-20 hover:opacity-100 transition-opacity">
                <p className="text-[10px] uppercase tracking-widest text-amber-500">The Law is the anvil. The Morninglord is the light.</p>
            </footer>
        </main>
    );
}
