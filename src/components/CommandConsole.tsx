'use client';

import React, { useState } from 'react';
import styles from '@/app/Aureate.module.css';
import { TacticalResponse } from '@/agent/tactical-engine';

const CommandConsole: React.FC = () => {
    const [input, setInput] = useState('');
    const [verdict, setVerdict] = useState<TacticalResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [committed, setCommitted] = useState(false);

    const handleConsult = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setVerdict(null);
        setCommitted(false);
        try {
            const res = await fetch('/api/tactical', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario: input })
            });
            const data = await res.json();
            setVerdict(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!verdict) return;
        try {
            await fetch('/api/commit-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mechanics: {
                        resourceCost: verdict.bonusAction.resourceCost,
                        // Could add HP change logic here if scenario implies it
                    }
                })
            });
            setCommitted(true);
            setTimeout(() => {
                setVerdict(null);
                setCommitted(false);
                setInput('');
            }, 3000);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className={styles.aureateBorder} style={{ marginTop: '2rem' }}>
            <h3 className={styles.verdictHeader}>Command Console</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <textarea
                    className={styles.inputAnvil}
                    placeholder="Describe the tactical situation or your intended action..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading || !!verdict}
                />

                {!verdict && (
                    <button
                        className={styles.anvilButton}
                        onClick={handleConsult}
                        disabled={loading || !input.trim()}
                    >
                        {loading ? 'Consulting the Soul...' : 'Consult the Soul'}
                    </button>
                )}
            </div>

            {verdict && (
                <div style={{ marginTop: '2rem' }}>
                    {/* The Soul's Voice (Internal Monologue) */}
                    <div className={`${styles.parchmentContainer} ${styles.cascade1}`} style={{ margin: '1rem 0', maxWidth: '100%' }}>
                        <h4 className={styles.chapterTitle} style={{ color: verdict.soulVoice.dogmaViolation ? '#8b0000' : '#5c3b1a' }}>
                            Sef's Soul {verdict.soulVoice.dogmaViolation ? '— Contradiction' : '— Affirmation'}
                        </h4>
                        <p className={styles.chapterBenefit} style={{ fontSize: '1.1rem', lineHeight: '1.4' }}>
                            "{verdict.soulVoice.reaction}"
                        </p>
                        <div className={styles.chapterQuote} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            — citing {verdict.soulVoice.citation}
                        </div>
                    </div>

                    {/* Mechanical Verdict Cards */}
                    <div className={`${styles.mechanicalCard} ${styles.cascade2}`}>
                        <div style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#d4af37' }}>Movement</div>
                        <div className={styles.blueText} style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {verdict.movement.speed}ft — {verdict.movement.recommendation}
                        </div>
                    </div>

                    <div className={`${styles.mechanicalCard} ${styles.cascade3}`}>
                        <div style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#d4af37' }}>Action</div>
                        <div className={styles.blueText} style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {verdict.action.type}: {verdict.action.details}
                        </div>
                    </div>

                    <div className={`${styles.mechanicalCard} ${styles.cascade4}`}>
                        <div style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#d4af37' }}>Bonus Action</div>
                        <div className={styles.blueText} style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {verdict.bonusAction.type}: {verdict.bonusAction.details}
                        </div>
                        {verdict.bonusAction.resourceCost && (
                            <div style={{ color: '#ff4444', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                                Cost: {verdict.bonusAction.resourceCost.amount} {verdict.bonusAction.resourceCost.type.replace(/_/g, ' ')}
                            </div>
                        )}
                    </div>

                    {/* Execute Judgment Button */}
                    {!committed ? (
                        <button className={`${styles.goldenSealButton} ${styles.cascade5}`} onClick={handleExecute}>
                            Execute Judgment
                        </button>
                    ) : (
                        <div className={`${styles.goldenSealButton} ${styles.cascade1}`} style={{ background: '#004d4d', color: '#00f2ff', textAlign: 'center' }}>
                            VERDICT COMMITTED
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CommandConsole;
