import { EventEmitter } from 'events';

const globalForEvents = globalThis as unknown as { agentEvents: EventEmitter };

const agentEvents = globalForEvents.agentEvents || new EventEmitter();
agentEvents.setMaxListeners(100); // Allow many SSE connections

if (process.env.NODE_ENV !== 'production') globalForEvents.agentEvents = agentEvents;

export default agentEvents;
