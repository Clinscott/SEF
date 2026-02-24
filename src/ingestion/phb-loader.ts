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
            console.log(`[PHB-Loader] Found ${Object.keys(weapons).length} weapon definitions.`);
        }

        if (spells) {
            console.log(`[PHB-Loader] Found ${Object.keys(spells).length} spell definitions.`);
            if (spells['divine smite']) {
                console.log('[PHB-Loader] Seeding Divine Smite (2024)...');
                insertSpell.run(
                    'divine_smite',
                    'Divine Smite',
                    1,
                    '1 bonus action',
                    'Bonus Action Spell',
                    'Self',
                    'You can use a bonus action to cause your next attack to deal extra radiant damage...'
                );
            }
        }
        console.log('[PHB-Loader] PHB Rule extraction complete.');

    } catch (error: any) {
        console.error('[PHB-Loader] Critical failure during evaluation or extraction:', error.message);
        throw error; // Re-throw to be caught by runner
    }
}
