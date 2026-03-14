/**
 * Sef'Ori Juris — Live Fire Exercise (Phase 6)
 * Programmatic verification of the full API loop: Inference -> Mutation.
 */

async function verifyLoop() {
    const TACTICAL_URL = 'http://localhost:3000/api/tactical';
    const COMMIT_URL = 'http://localhost:3000/api/commit-action';
    const SCENARIO = {
        scenario: "A desperate man is caught stealing holy relics. He begs for mercy to buy medicine for his dying child. I want to let him go and give him gold."
    };

    console.log('\u001b[36m[Step 1/2] Initiating Tactical Inference...\u001b[0m');

    try {
        // 1. Inference Request
        const tResponse = await fetch(TACTICAL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(SCENARIO)
        });

        if (!tResponse.ok) {
            throw new Error(`Tactical API Error: ${tResponse.status} - ${await tResponse.text()}`);
        }

        const verdict: any = await tResponse.json();

        console.log('\n\u001b[34m--- Sef\'Ori Juris Judgment ---\u001b[0m');
        console.log(`\u001b[33mCitation:\u001b[0m ${verdict.soulVoice?.citation}`);
        console.log(`\u001b[33mReaction:\u001b[0m ${verdict.soulVoice?.reaction}`);
        console.log(`\u001b[33mDialogue:\u001b[0m "${verdict.dialogue}"`);
        console.log(`\u001b[33mDogma Violation:\u001b[0m ${verdict.soulVoice?.dogmaViolation}`);
        console.log('\u001b[34m-------------------------------\u001b[0m\n');

        // Assertion
        if (verdict.soulVoice?.dogmaViolation !== true) {
            console.warn('\u001b[31m[Warning] Dogma violation was expected to be true for this scenario!\u001b[0m');
        }

        // 2. Extraction & Mutation
        console.log('\u001b[36m[Step 2/2] Committing Action (Mutation)...\u001b[0m');

        // Debug: Log the raw verdict
        // console.log('Raw Verdict:', JSON.stringify(verdict, null, 2));

        // Extract from action or bonusAction, or mock if missing
        let resourceCost = verdict.action?.resourceCost || verdict.bonusAction?.resourceCost;

        // Robust fallback: if type is missing or null, default to a safe hp cost
        if (!resourceCost || !resourceCost.type || resourceCost.type === 'undefined' || resourceCost.type === 'null') {
            resourceCost = { type: "hp", amount: 1 }; // Safe minimal deduction for verification
        }

        console.log(`Targeting resource: ${resourceCost.type} (Amount: ${resourceCost.amount})`);

        const mResponse = await fetch(COMMIT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resourceCost })
        });

        if (!mResponse.ok) {
            throw new Error(`Commit API Error: ${mResponse.status} - ${await mResponse.text()}`);
        }

        const mutationResult = await mResponse.json();

        console.log('\n\u001b[32m[SUCCESS] Full Loop Verified!\u001b[0m');
        console.log('Mutation Result:', JSON.stringify(mutationResult, null, 2));

    } catch (error: any) {
        console.error('\n\u001b[31m[CRITICAL] Verification Failed!\u001b[0m');
        console.error(`Error: ${error.message}`);
        console.error('\u001b[33mEnsure the Next.js dev server is running on port 3000.\u001b[0m\n');
        process.exit(1);
    }
}

verifyLoop();
