/**
 * Sef'Ori Juris — Local Brain Bootloader
 * Ensures Ollama is running and the required model is available before the UI starts.
 */

async function bootBrain() {
    const OLLAMA_TAGS_URL = 'http://localhost:11434/api/tags';
    const REQUIRED_MODEL = 'llama3.1';

    console.log('\n[Brain Bootloader] Initializing Pre-flight Health Check...');

    try {
        const response = await fetch(OLLAMA_TAGS_URL);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        const models = data.models || [];
        const modelExists = models.some((m: any) => m.name.includes(REQUIRED_MODEL));

        if (modelExists) {
            console.log('\u001b[32m[Brain Online] ' + REQUIRED_MODEL + ' is ready.\u001b[0m');
        } else {
            console.error('\n\u001b[31m[CRITICAL] Model Missing!\u001b[0m');
            console.error('The required model "' + REQUIRED_MODEL + '" was not found in local Ollama.');
            console.error('Please run the following command in your terminal:');
            console.error('\u001b[33mollama pull ' + REQUIRED_MODEL + '\u001b[0m\n');
            process.exit(1);
        }

    } catch (error: any) {
        console.error('\n\u001b[31m[CRITICAL] Ollama is not running!\u001b[0m');
        console.error('The Sef\'Ori Juris agent cannot function without its tactical brain.');
        console.error('Please start the \u001b[36mOllama\u001b[0m application and try again.\n');
        process.exit(1);
    }
}

bootBrain();
