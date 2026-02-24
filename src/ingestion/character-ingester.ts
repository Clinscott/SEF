import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import db from './database';

export async function ingestCharacterData() {
    const pdfPath = resolve(process.cwd(), 'Sef.pdf');
    console.log(`[Ingester] Parsing ${pdfPath}...`);

    const existingPdfBytes = readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    // Mapping character stats from correct MPMB AcroForm names
    const getFieldText = (name: string): string => {
        try {
            return form.getTextField(name).getText() || '';
        } catch (e) {
            return '';
        }
    };

    // --- Ability Scores (All 6) ---
    const attributes = [
        { id: 'str', name: 'Strength', fieldScore: 'Str', fieldMod: 'Str Mod', defaultScore: 18, defaultMod: 4 },
        { id: 'dex', name: 'Dexterity', fieldScore: 'Dex', fieldMod: 'Dex Mod', defaultScore: 10, defaultMod: 0 },
        { id: 'con', name: 'Constitution', fieldScore: 'Con', fieldMod: 'Con Mod', defaultScore: 14, defaultMod: 2 },
        { id: 'int', name: 'Intelligence', fieldScore: 'Int', fieldMod: 'Int Mod', defaultScore: 9, defaultMod: -1 },
        { id: 'wis', name: 'Wisdom', fieldScore: 'Wis', fieldMod: 'Wis Mod', defaultScore: 12, defaultMod: 1 },
        { id: 'cha', name: 'Charisma', fieldScore: 'Cha', fieldMod: 'Cha Mod', defaultScore: 16, defaultMod: 3 }
    ];

    const insertAttr = db.prepare('INSERT OR REPLACE INTO ref_attributes (id, name, score, modifier) VALUES (?, ?, ?, ?)');
    for (const attr of attributes) {
        const score = parseInt(getFieldText(attr.fieldScore)) || attr.defaultScore;
        const mod = parseInt(getFieldText(attr.fieldMod)) || attr.defaultMod;
        insertAttr.run(attr.id, attr.name, score, mod);
    }
    console.log(`[Ingester] Seeded ${attributes.length} ability scores.`);

    // --- Vitals ---
    const maxHp = parseInt(getFieldText('HP Max')) || 48;
    const currentHp = parseInt(getFieldText('HP Max Current')) || 48;
    const ac = parseInt(getFieldText('AC')) || 18;

    const insertVitals = db.prepare('INSERT OR REPLACE INTO state_vitals (id, current_hp, max_hp, temp_hp, ac) VALUES (?, ?, ?, ?, ?)');
    insertVitals.run('main', currentHp, maxHp, 0, ac);

    // --- Resources ---
    const lohMax = parseInt(getFieldText('Limited Feature Max Usages 1')) || 20;
    const lohCurrent = parseInt(getFieldText('Limited Feature Used 1')) || 20;

    const insertResource = db.prepare('INSERT OR REPLACE INTO state_resources (id, name, current_value, max_value, reset_type) VALUES (?, ?, ?, ?, ?)');
    insertResource.run('lay_on_hands', 'Lay on Hands', lohCurrent, lohMax, 'long_rest');
    insertResource.run('spell_slots_l1', 'L1 Spell Slots', 3, 3, 'long_rest');
    insertResource.run('spell_slots_l2', 'L2 Spell Slots', 2, 2, 'long_rest');
    insertResource.run('proficiency_bonus', 'Proficiency Bonus', 2, 2, 'none');

    // --- Weapons ---
    const insertWeapon = db.prepare('INSERT OR REPLACE INTO ref_weapons (id, name, damage_die, mastery_id) VALUES (?, ?, ?, ?)');
    insertWeapon.run('greatsword_sef', 'Greatsword', '2d6', 'graze');
    insertWeapon.run('longsword_sef', 'Longsword', '1d8', 'sap');

    // --- Book Benefits: "I AM THE LAW" ---
    const insertBookBenefit = db.prepare(
        'INSERT OR REPLACE INTO state_book_benefits (id, chapter, name, description, uses_remaining, max_uses, reset_type, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    // Chapter I — Passive (always active, unlimited)
    insertBookBenefit.run(
        'chapter_i_intimidation', 'I', 'Authority Is Inherent',
        'Advantage on Charisma (Intimidation) checks. Power does not require permission.',
        -1, -1, 'passive', 1
    );

    // Chapter II — Long rest limited
    insertBookBenefit.run(
        'chapter_ii_temp_hp', 'II', 'Order Prevents Greater Harm',
        'Once per long rest, on reducing a creature to 0 HP: gain temp HP equal to proficiency bonus. Disorder is violence deferred.',
        1, 1, 'long_rest', 1
    );

    // Chapter III — Passive (always active, triggered by choice)
    insertBookBenefit.run(
        'chapter_iii_no_mercy', 'III', 'Mercy Is a Liability',
        'When you choose not to show mercy after defeating a foe: next attack roll gains +2 to hit. Inconsistency is injustice wearing a smile.',
        -1, -1, 'passive', 1
    );

    // Chapter IV — Long rest limited
    insertBookBenefit.run(
        'chapter_iv_insight', 'IV', 'Law Is Above Intent',
        'Once per long rest, replace a failed Wisdom (Insight) check with a 10 on the die. Intent cannot be proven. Action can.',
        1, 1, 'long_rest', 1
    );

    // Chapter V — Passive (proficiency gain)
    insertBookBenefit.run(
        'chapter_v_proficiency', 'V', 'Enforcement Confers Responsibility',
        'Gain proficiency in one of: Intimidation, Investigation, or Religion. To act is to accept consequence.',
        -1, -1, 'passive', 1
    );

    console.log(`[Ingester] Seeded 5 book benefits from "I AM THE LAW".`);

    // --- Steed: Cinder ---
    const insertSteed = db.prepare(
        'INSERT OR REPLACE INTO state_steed (id, name, type, current_hp, max_hp, ac, speed, otherworldly_stride_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    insertSteed.run('cinder', 'Cinder', 'Celestial', 35, 35, 12, 60, 1);
    console.log(`[Ingester] Seeded Cinder (The Steed).`);

    console.log(`[Ingester] Sef'Ori Juris data successfully seeded to SQLite.`);
}
