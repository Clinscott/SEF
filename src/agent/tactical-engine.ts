import Database from 'better-sqlite3';
import { resolve } from 'path';

export interface TacticalResponse {
    observation: string;
    soulVoice: {
        reaction: string;
        dogmaViolation: boolean;
        citation?: string;
    };
    movement: {
        speed: number;
        recommendation: string;
    };
    action: {
        type: string;
        weapon?: string;
        mastery?: string;
        details: string;
        resourceCost?: { type: string; amount: number };
    };
    bonusAction: {
        type: string;
        details: string;
        resourceCost?: { type: string; amount: number };
    };
    reaction: {
        type: string;
        trigger: string;
        details: string;
    };
    dialogue: string;
    stateSnapshot: {
        currentHp: number;
        maxHp: number;
        tempHp: number;
        ac: number;
        steed?: {
            name: string;
            currentHp: number;
            maxHp: number;
            ac: number;
            strideAvailable: boolean;
        };
        spellSlots: { l1: { current: number; max: number }; l2: { current: number; max: number } };
        layOnHands: { current: number; max: number };
        bookBenefits: { chapterII_available: boolean; chapterIV_available: boolean };
    };
}

export function evaluateAction(scenario: string, dbPath?: string): TacticalResponse {
    const resolvedPath = dbPath || resolve(process.cwd(), 'juris_state.db');
    const db = new Database(resolvedPath);

    try {
        const vitals = getVitals(db);
        const resources = getResources(db);
        const bookBenefits = getBookBenefits(db);
        const steed = getSteed(db);

        const threatLevel = assessThreat(scenario);
        const mounted = steed && steed.current_hp > 0;

        const movement = determineMovement(scenario, threatLevel, mounted, steed?.speed || 30);
        const weaponInfo = chooseWeapon(threatLevel, scenario);
        const bonusAction = determineBonusAction(vitals, resources, threatLevel, mounted, steed?.otherworldly_stride_available === 1);
        const reaction = determineReaction(scenario, mounted);

        // Dogma Judgment Logic
        const isPeaceful = scenario.toLowerCase().includes('mercy') || scenario.toLowerCase().includes('peace');
        const dogmaViolation = isPeaceful;
        const reactionText = isPeaceful
            ? "Your impulse to stay the hand is noted, but the Sun does not negotiate with shadows. We shall prepare for the worst while you seek your peace."
            : "The hammer finds the nail. The disorder must be struck down before it spreads.";
        const citation = isPeaceful ? "Chapter III: Mercy Is a Liability." : "Chapter I: Authority Is Inherent.";

        return {
            observation: `The disorder is assessed. ${scenario}. Sef stands with divine certainty.`,
            soulVoice: {
                reaction: reactionText,
                dogmaViolation,
                citation
            },
            movement,
            action: {
                type: 'attack',
                weapon: weaponInfo.name,
                mastery: weaponInfo.mastery,
                details: `Strike with ${weaponInfo.name}. ${weaponInfo.masteryDetails}.`
            },
            bonusAction: {
                ...bonusAction,
                resourceCost: bonusAction.type === 'Divine Smite' ? { type: 'spell_slot_l1', amount: 1 } :
                    bonusAction.type === 'Lay on Hands' ? { type: 'lay_on_hands', amount: 5 } : undefined
            },
            reaction,
            dialogue: generateDialogue(scenario, threatLevel),
            stateSnapshot: {
                currentHp: vitals.current_hp,
                maxHp: vitals.max_hp,
                tempHp: vitals.temp_hp,
                ac: vitals.ac,
                steed: steed ? {
                    name: steed.name,
                    currentHp: steed.current_hp,
                    maxHp: steed.max_hp,
                    ac: steed.ac,
                    strideAvailable: steed.otherworldly_stride_available === 1
                } : undefined,
                spellSlots: {
                    l1: { current: resources.l1.current, max: resources.l1.max },
                    l2: { current: resources.l2.current, max: resources.l2.max }
                },
                layOnHands: { current: resources.loh.current, max: resources.loh.max },
                bookBenefits: bookBenefits
            }
        };
    } finally {
        db.close();
    }
}

// --- Internal Logic Helpers ---

function getVitals(db: any) {
    return db.prepare('SELECT current_hp, max_hp, temp_hp, ac FROM state_vitals WHERE id = ?').get('main') || { current_hp: 48, max_hp: 48, temp_hp: 0, ac: 18 };
}

function getResources(db: any) {
    const res = db.prepare('SELECT id, current_value, max_value FROM state_resources').all();
    const map: any = { l1: { current: 3, max: 3 }, l2: { current: 2, max: 2 }, loh: { current: 20, max: 20 } };
    res.forEach((r: any) => {
        if (r.id === 'spell_slots_l1') map.l1 = { current: r.current_value, max: r.max_value };
        if (r.id === 'spell_slots_l2') map.l2 = { current: r.current_value, max: r.max_value };
        if (r.id === 'lay_on_hands') map.loh = { current: r.current_value, max: r.max_value };
    });
    return map;
}

function getBookBenefits(db: any) {
    const rows = db.prepare('SELECT id, uses_remaining FROM state_book_benefits WHERE id IN (?, ?)').all('chapter_ii_temp_hp', 'chapter_iv_insight');
    return {
        chapterII_available: rows.find((r: any) => r.id === 'chapter_ii_temp_hp')?.uses_remaining > 0,
        chapterIV_available: rows.find((r: any) => r.id === 'chapter_iv_insight')?.uses_remaining > 0
    };
}

function getSteed(db: any) {
    return db.prepare('SELECT * FROM state_steed WHERE id = ?').get('cinder');
}

function assessThreat(scenario: string): 'low' | 'high' {
    const highThreatKeywords = ['dragon', 'boss', 'captain', 'champion', 'knight', 'many', 'surrounded'];
    return highThreatKeywords.some(k => scenario.toLowerCase().includes(k)) ? 'high' : 'low';
}

function determineMovement(scenario: string, threat: string, mounted: boolean, speed: number) {
    let rec = mounted ? "Cinder carries the mountain. Advance with momentum." : "Advance to optimal melee range.";
    if (scenario.toLowerCase().includes('protect') || scenario.toLowerCase().includes('ally')) {
        rec = "Reposition to shield the witness. Establish a defensive perimeter.";
    }
    return { speed, recommendation: rec };
}

function chooseWeapon(threat: string, scenario: string) {
    if (threat === 'high') {
        return {
            name: 'Longsword',
            mastery: 'Sap',
            masteryDetails: 'On hit, the target has disadvantage on its next attack roll'
        };
    }
    return {
        name: 'Greatsword',
        mastery: 'Graze',
        masteryDetails: 'On miss, target still takes Strength modifier damage'
    };
}

function determineBonusAction(vitals: any, resources: any, threat: string, mounted: boolean, stride: boolean) {
    if (stride && mounted && threat === 'high') {
        return { type: 'Otherworldly Stride', details: 'Teleport Cinder and Sef up to 60ft via divine stride.' };
    }
    if (resources.l1.current > 0 || resources.l2.current > 0) {
        return { type: 'Divine Smite', details: 'Prepare a Level 1 or 2 Radiant Smite upon a successful hit.' };
    }
    if (vitals.current_hp < (vitals.max_hp / 2) && resources.loh.current > 5) {
        return { type: 'Lay on Hands', details: 'Heal 5 HP to self.' };
    }
    return { type: 'none', details: 'No optimal bonus action available.' };
}

function determineReaction(scenario: string, mounted: boolean) {
    return {
        type: 'Sentinel',
        trigger: mounted ? 'Enemy attacks Cinder or adjacent ally.' : 'Enemy attacks adjacent ally.',
        details: 'Strike the law-breaker with an immediate opportunity attack. Their speed becomes 0 on hit.'
    };
}

function generateDialogue(scenario: string, threat: string) {
    const chapters = [
        "Chapter I. \"Power does not require permission. It requires recognition.\"",
        "Chapter II. \"Disorder is violence deferred.\"",
        "Chapter III. \"Inconsistency is injustice wearing a smile.\"",
        "Chapter IV. \"Law is Above Intent.\"",
        "Chapter V. \"To act is to accept consequence.\""
    ];
    const quote = chapters[Math.floor(Math.random() * chapters.length)];
    return `The Verdict is rendered. ${quote}`;
}
