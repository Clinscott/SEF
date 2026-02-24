import { EventEmitter } from 'events';

class AgentEventEmitter extends EventEmitter { }

// Singleton instance to be used across the Next.js backend
const agentEvents = new AgentEventEmitter();

export default agentEvents;
