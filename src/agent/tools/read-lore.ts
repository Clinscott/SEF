import { readFile } from 'fs/promises';
import { resolve } from 'path';

export async function readLore(filePath: string): Promise<string> {
    const allowedFiles = [
        resolve(__dirname, '../soul.md'),
        resolve(__dirname, '../memory.md')
    ];

    const absolutePath = resolve(process.cwd(), filePath);

    if (!allowedFiles.includes(absolutePath)) {
        throw new Error(`Access Denied: ${filePath} is outside the allowed lore scope.`);
    }

    return await readFile(absolutePath, 'utf8');
}
