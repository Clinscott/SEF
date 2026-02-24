/**
 * Sef'Ori Juris — Brain Verification Script
 * Validates that Ollama is responsive, llama3.1 is loaded, and JSON output is working.
 */

async function testBrain() {
    const URL = 'http://localhost:11434/api/generate';
    const PAYLOAD = {
        model: "llama3.1",
        prompt: 'Identify yourself, Paladin. Return strictly valid JSON using this structure: {"identity": "string", "status": "string"}',
        format: "json",
        stream: false
    };

    console.log('\u001b[36m[Verification] Contacting the tactical brain (llama3.1)...\u001b[0m');

    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(PAYLOAD)
        });

        if (!response.ok) {
            throw new Error(`Ollama responded with ${response.status}: ${await response.text()}`);
        }

        const data: any = await response.json();
        const content = JSON.parse(data.response);

        // Success Output
        console.clear();
        console.log('\n\u001b[32m[SUCCESS] Brain Verification Complete!\u001b[0m');
        console.log('\u001b[35m--------------------------------------------------\u001b[0m');
        console.log('Sef\'Ori Juris Identity Verified:');
        console.log(JSON.stringify(content, null, 2));
        console.log('\u001b[35m--------------------------------------------------\u001b[0m\n');

    } catch (error: any) {
        console.error('\n\u001b[31m[CRITICAL] Brain Connection Failed!\u001b[0m');
        console.error(`Error: ${error.message}`);
        console.error('\u001b[33mEnsure Ollama is running and llama3.1 is pulled.\u001b[0m\n');
        process.exit(1);
    }
}

testBrain();
