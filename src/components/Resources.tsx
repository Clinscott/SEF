'use client';

import React from 'react';
import styles from '@/app/Aureate.module.css';

interface ResourceProps {
    loh: { current: number; max: number };
    channelDivinity: { current: number; max: number };
    spellSlots: {
        l1: { current: number; max: number };
        l2: { current: number; max: number };
    };
    sefHp: number;
}

const Resources: React.FC<ResourceProps> = ({ loh, channelDivinity, spellSlots, sefHp }) => {
    const isLowHealth = sefHp < 10;
    const animationClass = isLowHealth ? styles.dyingFire : styles.glowingIcon;

    return (
        <div className={styles.aureateBorder} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 className={styles.verdictHeader}>Divine Resources</h3>

            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>

                {/* Lay on Hands Tracker */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className={`${styles.resourceIcon} ${loh.current > 0 ? animationClass : styles.dimmedIcon}`}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ color: '#d4af37', textTransform: 'uppercase', fontSize: '0.7rem' }}>Lay on Hands</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{loh.current} / {loh.max}</div>
                    </div>
                </div>

                {/* Channel Divinity Icons */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#d4af37', textTransform: 'uppercase', fontSize: '0.7rem', marginBottom: '0.5rem' }}>Channel Divinity</div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {[...Array(channelDivinity.max)].map((_, i) => (
                            <div
                                key={i}
                                className={`${styles.sunIcon} ${i < channelDivinity.current ? (isLowHealth ? styles.dyingFire : '') : styles.sunExtinguished}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Spell Slots */}
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div>
                        <div style={{ color: '#d4af37', textTransform: 'uppercase', fontSize: '0.7rem', marginBottom: '0.3rem' }}>Lvl 1 Slots</div>
                        <div style={{ display: 'flex' }}>
                            {[...Array(spellSlots.l1.max)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`${styles.spellPip} ${i < spellSlots.l1.current ? styles.spellPipActive : ''} ${isLowHealth && i < spellSlots.l1.current ? styles.dyingFire : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <div style={{ color: '#d4af37', textTransform: 'uppercase', fontSize: '0.7rem', marginBottom: '0.3rem' }}>Lvl 2 Slots</div>
                        <div style={{ display: 'flex' }}>
                            {[...Array(spellSlots.l2.max)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`${styles.spellPip} ${i < spellSlots.l2.current ? styles.spellPipActive : ''} ${isLowHealth && i < spellSlots.l2.current ? styles.dyingFire : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Resources;
