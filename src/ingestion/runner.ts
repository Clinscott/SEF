import { initializeDatabase } from './database';
import { loadPHBRuleset } from './phb-loader';
import { ingestCharacterData } from './character-ingester';

async function main() {
    console.log('--- Starting Sef\'Ori Juris Ingestion Sequence ---');

    try {
        // 1. Initialize the Database Schema
        initializeDatabase();

        // 2. Load PHB Ruleset (Sandboxed)
        console.log('\n[Step 2/3] Loading 2024 PHB Ruleset...');
        loadPHBRuleset();

        // 3. Ingest Character Character Data from PDF
        console.log('\n[Step 3/3] Ingesting Character Data...');
        await ingestCharacterData();

        console.log('\n--- Ingestion Sequence Complete ---');
        console.log('Database juris_state.db is now populated.');
    } catch (error) {
        console.error('Critical failure in ingestion sequence:', error);
        process.exit(1);
    }
}

main();
