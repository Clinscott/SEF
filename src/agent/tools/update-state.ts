import { writeFile, readFile } from 'fs/promises';
import { resolve } from 'path';

export async function updateState(update: string): Promise<string> {
    const memoryPath = resolve(__dirname, '../memory.md');

    const currentContent = await readFile(memoryPath, 'utf8');
    const timestamp = new Error().stack?.split('\n')[2]?.trim() || new Date().toISOString(); // Simple stack trace for context or use Date
    const newContent = `${currentContent}\n\n- [${new Date().toISOString()}]: ${update}`;

    await writeFile(memoryPath, newContent, 'utf8');
    return "State updated successfully.";
}
