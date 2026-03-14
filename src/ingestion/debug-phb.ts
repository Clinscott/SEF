import * as vm from 'vm';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const phbPath = resolve(process.cwd(), '2024-PHB/pub_20240917_PHB.js');
const code = readFileSync(phbPath, 'utf8');

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
    FeatsList: {},
    FeatList: {},
    levels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    console: console,
    Math: Math,
    JSON: JSON,
    Object: Object,
    Array: Array,
    String: String,
    RequiredSheetVersion: (v: string, n: number) => { }
};

const proxySandbox = new Proxy(sandbox, {
    get(target, prop) {
        if (prop in target) return target[prop];
        return createUniversalMock();
    }
});

vm.createContext(proxySandbox);
try {
    vm.runInContext(code, proxySandbox);
    console.log('--- Sandbox Keys ---');
    Object.keys(sandbox).forEach(key => {
        const val = sandbox[key];
        const count = (typeof val === 'object' && val !== null) ? Object.keys(val).length : 'N/A';
        console.log(`${key}: ${count} items`);
    });
} catch (e: any) {
    console.error('Error:', e.message);
}
