import { startServer } from './server/index';

console.log("--- Initializing Sef'Ori Juris ---");
startServer().catch(err => {
    console.error("Critical failure during initialization:", err);
    process.exit(1);
});
