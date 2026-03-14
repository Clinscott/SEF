'use client';

import React, { useState } from 'react';
import styles from '@/app/Aureate.module.css';

export interface Chapter {
    id: string;
    roman: string;
    title: string;
    quote: string;
    benefit: string;
}

const chapters: Chapter[] = [
    {
        id: 'chapter_i_intimidation',
        roman: 'I',
        title: 'Authority Is Inherent',
        quote: 'Power does not require permission. It requires recognition.',
        benefit: 'Advantage on Charisma (Intimidation) checks.'
    },
    {
        id: 'chapter_ii_temp_hp',
        roman: 'II',
        title: 'Order Prevents Greater Harm',
        quote: 'Disorder is violence deferred.',
        benefit: 'On kill: Gain Temp HP equal to Proficiency Bonus (+2).'
    },
    {
        id: 'chapter_iii_no_mercy',
        roman: 'III',
        title: 'Mercy Is a Liability',
        quote: 'Inconsistency is injustice wearing a smile.',
        benefit: 'Refusing mercy: +2 to hit on next attack.'
    },
    {
        id: 'chapter_iv_insight',
        roman: 'IV',
        title: 'Law Is Above Intent',
        quote: 'Intent cannot be proven. Action can.',
        benefit: 'Failed Insight: Replace with 10 on the die.'
    },
    {
        id: 'chapter_v_proficiency',
        roman: 'V',
        title: 'Enforcement Confers Responsibility',
        quote: 'To act is to accept consequence.',
        benefit: 'Proficiency in Religion (Aureate Mastery).'
    }
];

interface JuristBookProps {
    activeBenefitIds: string[];
    lore?: { id: string; topic: string; memory_text: string; }[];
}

const JuristBook: React.FC<JuristBookProps> = ({ activeBenefitIds, lore = [] }) => {
    const [view, setView] = useState<'dogma' | 'lore'>('dogma');
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [thumping, setThumping] = useState<string | null>(null);
    const [signed, setSigned] = useState(false);

    const handleChapterClick = (id: string) => {
        setSelectedChapter(id === selectedChapter ? null : id);
        setThumping(id);
        setTimeout(() => setThumping(null), 300);
        console.log(`[Audio] Booming verdict for ${id}`);
    };

    const handleSign = () => {
        setSigned(true);
        setTimeout(() => setSigned(false), 2000);
        console.log("[Verdict] Signed with the Seal of Amaunator.");
    };

    return (
        <div className={styles.parchmentContainer} style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
            <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 className={styles.chapterTitle} style={{ fontSize: '1.8rem', borderBottom: '1px solid #5c3b1a', display: 'inline-block', paddingBottom: '0.5rem' }}>
                    {view === 'dogma' ? 'I AM THE LAW' : 'THE FORGED CHRONICLE'}
                </h2>
                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>
                    {view === 'dogma' ? 'The Sacred Articles of Faith' : 'Memories Struck Upon the Anvil'}
                </div>
            </header>

            {/* Toggle View */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => setView('dogma')}
                    style={{
                        background: view === 'dogma' ? '#5c3b1a' : 'transparent',
                        color: view === 'dogma' ? '#f4e4bc' : '#5c3b1a',
                        border: '1px solid #5c3b1a',
                        padding: '0.5rem 1rem',
                        fontFamily: 'Cinzel, serif',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        transition: 'all 0.3s ease'
                    }}
                >
                    DOGMA
                </button>
                <button
                    onClick={() => setView('lore')}
                    style={{
                        background: view === 'lore' ? '#5c3b1a' : 'transparent',
                        color: view === 'lore' ? '#f4e4bc' : '#5c3b1a',
                        border: '1px solid #5c3b1a',
                        padding: '0.5rem 1rem',
                        fontFamily: 'Cinzel, serif',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        transition: 'all 0.3s ease'
                    }}
                >
                    LORE ({lore.length})
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }} className="scrollbar-thin scrollbar-thumb-[#5c3b1a]/30">
                {view === 'dogma' ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {chapters.map((ch) => {
                            const isActive = activeBenefitIds.includes(ch.id);
                            const isSelected = selectedChapter === ch.id;

                            return (
                                <div
                                    key={ch.id}
                                    className={`${styles.parchmentChapter} ${isActive ? styles.activeChapter : ''} ${thumping === ch.id ? styles.thump : ''}`}
                                    onClick={() => handleChapterClick(ch.id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <h4 className={styles.chapterTitle}>
                                            Chapter {ch.roman}: {ch.title}
                                        </h4>
                                        {isActive && (
                                            <span className={styles.radiantText} style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                RADIANT ACTIVE
                                            </span>
                                        )}
                                    </div>

                                    <div className={styles.chapterBenefit}>
                                        {ch.benefit}
                                    </div>

                                    {isSelected && (
                                        <div className={styles.chapterQuote} style={{ marginTop: '1rem', borderLeft: '2px solid #5c3b1a', paddingLeft: '1rem', animation: 'fadeIn 0.5s' }}>
                                            "{ch.quote}"
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {lore.length === 0 ? (
                            <div style={{ textAlign: 'center', fontStyle: 'italic', opacity: 0.6, marginTop: '2rem' }}>
                                The anvil is silent. No memories have been forged.
                            </div>
                        ) : (
                            lore.map((item) => (
                                <div key={item.id} style={{ borderBottom: '1px dashed rgba(92, 59, 26, 0.3)', paddingBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: '0.3rem' }}>
                                        Topic: {item.topic}
                                    </div>
                                    <div style={{ fontFamily: 'Georgia, serif', lineHeight: 1.6, color: '#2c1810' }}>
                                        {item.memory_text}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Seal of Amaunator */}
            <div
                className={styles.sealOfAmaunator}
                onClick={handleSign}
                title="Sign Verdict with the Seal of Amaunator"
            >
                <div className={styles.sealInner}>
                    {signed && (
                        <div style={{ position: 'absolute', top: '-40px', color: '#d4af37', fontWeight: 'bold', textShadow: '0 0 5px black' }}>
                            VERDICT SIGNED
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default JuristBook;
