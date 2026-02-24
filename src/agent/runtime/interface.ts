export interface IAgentRuntime {
  initialize(): Promise<void>;
  execute(command: string): Promise<string>;
  cleanup(): Promise<void>;
}
