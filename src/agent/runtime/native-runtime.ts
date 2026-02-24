import { IAgentRuntime } from './interface';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class NativeRuntime implements IAgentRuntime {
    async initialize(): Promise<void> {
        console.log('Initializing Native Node.js Runtime...');
    }

    async execute(command: string): Promise<string> {
        try {
            const { stdout, stderr } = await execAsync(command);
            return stdout || stderr;
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    }

    async cleanup(): Promise<void> {
        console.log('Native runtime cleanup complete.');
    }
}
