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
}

const JuristBook: React.FC<JuristBookProps> = ({ activeBenefitIds }) => {
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [thumping, setThumping] = useState<string | null>(null);
    const [signed, setSigned] = useState(false);

    const handleChapterClick = (id: string) => {
        setSelectedChapter(id === selectedChapter ? null : id);
        setThumping(id);
        setTimeout(() => setThumping(null), 300);
        // Booming audio cue placeholder logic
        console.log(`[Audio] Booming verdict for ${id}`);
    };

    const handleSign = () => {
        setSigned(true);
        setTimeout(() => setSigned(false), 2000); // Visual feedback only for now
        console.log("[Verdict] Signed with the Seal of Amaunator.");
    };

    return (
        <div className={styles.parchmentContainer}>
            <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 className={styles.chapterTitle} style={{ fontSize: '1.8rem', borderBottom: '1px solid #5c3b1a', display: 'inline-block', paddingBottom: '0.5rem' }}>
                    I AM THE LAW
                </h2>
                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>The Sacred Articles of Faith</div>
            </header>

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
