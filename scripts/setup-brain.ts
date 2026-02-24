import { execSync } from 'child_process';

/**
 * Sef'Ori Juris — Brain Setup Utility
 * Verifies Ollama installation and pulls the required Llama 3.1 model.
 */

function setupBrain() {
    const REQUIRED_MODEL = 'llama3.1';

    console.log('\n[Brain Setup] Initializing Divine Upload Protocol...');

    // 1. Verify CLI Installation
    try {
        const version = execSync('ollama --version').toString().trim();
        console.log(`[Setup] Ollama CLI detected: ${version}`);
    } catch (error) {
        console.error('\n\u001b[31m[CRITICAL] Ollama CLI not found!\u001b[0m');
        console.error('The High Chief Jurist requires the Ollama environment to function.');
        console.error('Please download and install Ollama for Windows from:');
        console.error('\u001b[36mhttps://ollama.com/download\u001b[0m');
        console.error('\nAfter installation, start the Ollama application and run this script again.\n');
        process.exit(1);
    }

    // 2. Commencing Model Pull
    try {
        console.log(`\n[Setup] Commencing divine upload of ${REQUIRED_MODEL}...`);
        console.log('(This may take several minutes depending on your connection)\n');

        execSync(`ollama pull ${REQUIRED_MODEL}`, { stdio: 'inherit' });

        console.log('\n\u001b[32m[Success] The High Chief Jurist\'s mind is ready.\u001b[0m');
        console.log('You may now start the development server with: \u001b[33mnpm run dev\u001b[0m\n');
    } catch (error: any) {
        console.error('\n\u001b[31m[Error] Failed to pull model:\u001b[0m', error.message);
        console.error('Ensure the Ollama application is running in your system tray.\n');
        process.exit(1);
    }
}

setupBrain();
