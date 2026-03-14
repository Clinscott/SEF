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
    console.log('--- Sample Feat ---');
    const featKey = Object.keys(sandbox.FeatsList)[0];
    console.log(featKey, JSON.stringify(sandbox.FeatsList[featKey], (key, value) => typeof value === 'function' ? '[Function]' : value, 2));

    console.log('--- Sample Class ---');
    const classKey = Object.keys(sandbox.ClassList).find(k => k.toLowerCase().includes('paladin')) || Object.keys(sandbox.ClassList)[0];
    console.log(classKey, JSON.stringify(sandbox.ClassList[classKey], (key, value) => typeof value === 'function' ? '[Function]' : value, 2));
} catch (e: any) {
    console.error('Error:', e.message);
}
