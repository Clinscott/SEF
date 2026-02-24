import { IAgentRuntime } from './runtime/interface';
import { NativeRuntime } from './runtime/native-runtime';
import { DockerRuntime } from './runtime/docker-runtime';
import { readLore } from './tools/read-lore';
import { updateState } from './tools/update-state';
import { evaluateAction, TacticalResponse } from './tactical-engine';
import * as config from '../../config/agent-config.json';
import { resolve } from 'path';

export class PaladinAgent {
    private runtime: IAgentRuntime;
    private soulContent: string = '';

    constructor() {
        this.runtime = config.runtimeMode === 'docker'
            ? new DockerRuntime()
            : new NativeRuntime();
    }

    async boot(): Promise<void> {
        console.log(`[Agent] Booting Sef'Ori Juris in ${config.runtimeMode} mode...`);

        // Load Soul & Memory into context
        this.soulContent = await readLore(config.paths.soul);
        const memoryContent = await readLore(config.paths.memory);

        await this.runtime.initialize();

        console.log(`[Agent] Soul loaded. ${this.soulContent.length} chars of ruleset active.`);
        await updateState("Agent Sef'Ori Juris successfully booted.");
    }

    async handleQuery(query: string): Promise<string> {
        // In a real implementation, we would send this to Ollama
        // with the soulContent as the system prompt.

        if (query.toLowerCase().includes("amaunator")) {
            return "By the Morninglord's Light, Amaunator is the Keeper of the Eternal Sun and the Law that binds the heavens.";
        }

        return await this.runtime.execute(query);
    }

    handleTacticalQuery(scenario: string): TacticalResponse {
        return evaluateAction(scenario);
    }
}
