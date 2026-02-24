'use client';

import React, { useState, useEffect } from 'react';
import styles from './Aureate.module.css';
import Vitals, { VitalsData } from '@/components/Vitals';
import Resources from '@/components/Resources';
import JuristBook from '@/components/JuristBook';
import CommandConsole from '@/components/CommandConsole';

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

    const isLowHealth = data.sef.current < 10;

    useEffect(() => {
        const eventSource = new EventSource('/api/stream');

        eventSource.onmessage = (event) => {
            const update = JSON.parse(event.data);

            const loh = update.resources.find((r: any) => r.id === 'lay_on_hands');
            const cd = update.resources.find((r: any) => r.id === 'channel_divinity');
            const l1 = update.resources.find((r: any) => r.id === 'spell_slots_l1');
            const l2 = update.resources.find((r: any) => r.id === 'spell_slots_l2');

            setData({
                sef: {
                    current: update.vitals.current_hp,
                    max: update.vitals.max_hp,
                    temp: update.vitals.temp_hp
                },
                cinder: {
                    current: update.steed.current_hp,
                    max: update.steed.max_hp
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
        };

        return () => eventSource.close();
    }, []);

    return (
        <main className={`${styles.forgeContainer} ${isLowHealth ? styles.screenShake : ''}`}>
            {isLowHealth && <div className={styles.lowHealthVignette} />}

            <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 className={styles.verdictHeader} style={{ fontSize: '2.5rem' }}>The Forge of Amaunator</h1>
                <p style={{ fontStyle: 'italic', color: '#999' }}>"The Law is the anvil. The Morninglord is the light."</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 400px', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section>
                        <Vitals data={data} />
                    </section>

                    <section>
                        <Resources
                            loh={resources.loh}
                            channelDivinity={resources.channelDivinity}
                            spellSlots={resources.spellSlots}
                            sefHp={data.sef.current}
                        />
                    </section>

                    <section>
                        <CommandConsole />
                    </section>
                </div>

                <aside>
                    <JuristBook activeBenefitIds={activeBookBenefits} />
                </aside>
            </div>
        </main>
    );
}
