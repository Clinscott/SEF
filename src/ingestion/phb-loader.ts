import * as vm from 'vm';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import db from './database';

export function loadPHBRuleset() {
    const phbPath = resolve(process.cwd(), '2024-PHB/pub_20240917_PHB.js');
    console.log(`[PHB-Loader] Loading asset from ${phbPath}...`);

    const code = readFileSync(phbPath, 'utf8');

    // Prepare a sandbox with mocks for the MPMB global objects
    const createUniversalMock = (): any => {
        const fn = function () { };
        return new Proxy(fn, {
            get(target, prop) {
                if (prop === Symbol.toPrimitive) return () => '';
                if (prop === 'toString' || prop === 'valueOf') return () => '';
                if (prop in target) return (target as any)[prop];
                const mock = createUniversalMock();
                (target as any)[prop] = mock;
                return mock;
            }
        });
    };

    const sandbox: any = {
        SourceList: {},
        SpellsList: {},
        WeaponsList: {},
        ClassList: {},
        RaceList: {},
        BackgroundList: {},
        ClassSubList: {},
        defaultSpellTable: [],
        iFileName: 'pub_20240917_PHB.js',
        SheetVersion: 13.0,
        RequiredSheetVersion: (v: string, n: number) => { },
        desc: (val: any) => Array.isArray(val) ? val.join('\n') : val,
        levels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        console: console,
        Math: Math,
        JSON: JSON,
        Object: Object,
        Array: Array,
        String: String,
        Number: Number,
        Date: Date,
        Error: Error,
        RegExp: RegExp,
        parseInt: parseInt,
        parseFloat: parseFloat
    };

    const proxySandbox = new Proxy(sandbox, {
        get(target, prop) {
            if (prop in target) return target[prop];
            const name = typeof prop === 'string' ? prop : '';
            if (name === 'setTimeout' || name === 'setInterval') return () => { };
            const mock = createUniversalMock();
            target[prop] = mock;
            return mock;
        }
    });

    vm.createContext(proxySandbox);
    try {
        console.log('[PHB-Loader] Running sandboxed script (this may take a few seconds)...');
        vm.runInContext(code, proxySandbox);
        console.log('[PHB-Loader] Script successfully sandboxed and executed.');

        const weapons = (sandbox as any).WeaponsList;
        const spells = (sandbox as any).SpellsList;

        console.log('[PHB-Loader] Preparing database statements...');
        const insertWeapon = db.prepare('INSERT OR REPLACE INTO ref_weapons (id, name, damage_die, mastery_id) VALUES (?, ?, ?, ?)');
        const insertMastery = db.prepare('INSERT OR REPLACE INTO ref_masteries (id, name, engine_logic_ref) VALUES (?, ?, ?)');
        const insertSpell = db.prepare('INSERT OR REPLACE INTO ref_spells (id, name, level, casting_time, action_type, range, description) VALUES (?, ?, ?, ?, ?, ?, ?)');

        console.log('[PHB-Loader] Seeding 2024 Masteries...');
        insertMastery.run('graze', 'Graze', 'str-mod-on-miss');
        insertMastery.run('sap', 'Sap', 'disadv-on-next-attack');
        console.log('[PHB-Loader] Masteries seeded.');

        if (weapons) {
            console.log(`[PHB-Loader] Found ${Object.keys(weapons).length} weapon definitions. Seeding...`);
            let wCount = 0;
            for (const [key, w] of Object.entries(weapons) as [string, any][]) {
                if (w && w.name) {
                    const dmgDie = Array.isArray(w.damage) ? `${w.damage[0]}d${w.damage[1]}` : (w.damage || null);
                    // Determine if it has a mastery property or fallback to null
                    const mastery = null;
                    insertWeapon.run(key, w.name, dmgDie, mastery);
                    wCount++;
                }
            }
            console.log(`[PHB-Loader] Successfully seeded ${wCount} weapons.`);
        }

        if (spells) {
            console.log(`[PHB-Loader] Found ${Object.keys(spells).length} spell definitions. Seeding...`);
            let sCount = 0;
            for (const [key, s] of Object.entries(spells) as [string, any][]) {
                if (s && s.name) {
                    const level = typeof s.level === 'number' ? s.level : 0;
                    const castTime = s.time || '1 action';
                    const actionType = typeof s.time === 'string' && s.time.toLowerCase().includes('bonus') ? 'Bonus Action Spell' : 'Action Spell';
                    const range = s.range || 'Self';
                    const rawDesc = s.description || s.desc || '';
                    const desc = typeof rawDesc === 'function' ? rawDesc() : String(rawDesc);

                    insertSpell.run(
                        key,
                        s.name,
                        level,
                        castTime,
                        actionType,
                        range,
                        desc.substring(0, 500) // Truncate to save DB space
                    );
                    sCount++;
                }
            }
            console.log(`[PHB-Loader] Successfully seeded ${sCount} spells.`);
        }

        const feats = (sandbox as any).FeatsList;
        if (feats) {
            console.log(`[PHB-Loader] Found ${Object.keys(feats).length} feat definitions. Seeding...`);
            const insertFeat = db.prepare('INSERT OR REPLACE INTO ref_feats (id, name, description, prerequisites) VALUES (?, ?, ?, ?)');
            let fCount = 0;
            for (const [key, f] of Object.entries(feats) as [string, any][]) {
                if (f && f.name) {
                    const desc = typeof f.description === 'function' ? f.description() : (f.description || f.desc || '');
                    const prereq = f.prerequisite || f.prereq || 'None';
                    insertFeat.run(key, f.name, String(desc).substring(0, 1000), String(prereq));
                    fCount++;
                }
            }
            console.log(`[PHB-Loader] Successfully seeded ${fCount} feats.`);
        }

        const classes = (sandbox as any).ClassList;
        if (classes) {
            console.log(`[PHB-Loader] Found ${Object.keys(classes).length} class definitions. Seeding features...`);
            const insertFeature = db.prepare('INSERT OR REPLACE INTO ref_class_features (id, class, name, level, description) VALUES (?, ?, ?, ?, ?)');
            let featureCount = 0;
            for (const [key, c] of Object.entries(classes) as [string, any][]) {
                if (c && c.features) {
                    const className = c.name || key;
                    for (const [fKey, f] of Object.entries(c.features) as [string, any][]) {
                        if (f && f.name) {
                            const desc = typeof f.description === 'function' ? f.description() : (f.description || f.desc || '');
                            const level = f.minlevel || 1;
                            insertFeature.run(`${key}-${fKey}`, className, f.name, level, String(desc).substring(0, 1000));
                            featureCount++;
                        }
                    }
                }
            }
            console.log(`[PHB-Loader] Successfully seeded ${featureCount} class features.`);
        }
        console.log('[PHB-Loader] PHB Rule extraction complete.');

    } catch (error: any) {
        console.error('[PHB-Loader] Critical failure during evaluation or extraction:', error.message);
        throw error; // Re-throw to be caught by runner
    }
}
