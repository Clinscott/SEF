'use client';

import React from 'react';
import styles from '@/app/Aureate.module.css';

interface StatProps {
    current: number;
    max: number;
    temp?: number;
    label: string;
    isSmall?: boolean;
}

const HealthOrb: React.FC<StatProps> = ({ current, max, temp = 0, label, isSmall }) => {
    const percentage = Math.min((current / max) * 100, 100);
    const tempPercentage = Math.min((temp / max) * 100, 100);

    return (
        <div className={styles.aureateBorder} style={{ display: 'inline-block', margin: '1rem', textAlign: 'center' }}>
            <h3 className={styles.verdictHeader} style={{ fontSize: isSmall ? '0.8rem' : '1.2rem' }}>{label}</h3>
            <div className={styles.liquidOrb} style={{ width: isSmall ? '100px' : '150px', height: isSmall ? '100px' : '150px' }}>
                {/* Main Health Liquid */}
                <div
                    className={styles.liquid}
                    style={{ height: `${percentage}%` }}
                />
                {/* Temporary HP Liquid (Radiant Blue) overlay */}
                {temp > 0 && (
                    <div
                        className={`${styles.liquid} ${styles.thpLiquid}`}
                        style={{ height: `${tempPercentage}%`, opacity: 0.6 }}
                    />
                )}
                <div className={styles.statText} style={{ fontSize: isSmall ? '1rem' : '1.5rem' }}>
                    {current}{temp > 0 ? `+${temp}` : ''}
                </div>
            </div>
            <div style={{ marginTop: '0.5rem', color: '#d4af37', fontWeight: 'bold' }}>
                {current}/{max}
            </div>
        </div>
    );
};

export interface VitalsData {
    sef: { current: number; max: number; temp: number };
    cinder: { current: number; max: number };
    loh: { current: number; max: number };
    ac: number;
}

const Vitals: React.FC<{ data: VitalsData }> = ({ data }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap' }}>
            <HealthOrb
                label="Sef'Ori Juris"
                current={data.sef.current}
                max={data.sef.max}
                temp={data.sef.temp}
            />

            <HealthOrb
                label="Cinder"
                current={data.cinder.current}
                max={data.cinder.max}
                isSmall={true}
            />

            <div className={styles.aureateBorder} style={{ minWidth: '200px' }}>
                <h3 className={styles.verdictHeader}>Resources</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#00f2ff' }}>Lay on Hands</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.loh.current}/{data.loh.max}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#d4af37' }}>Armor Class</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.ac}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Vitals;
