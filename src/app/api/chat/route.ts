export async function POST(req: Request) {
    try {
        const { message, previousQuestion = "None" } = await req.json();

        // 0. Slash Commands
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.startsWith('/grantxp ')) {
            const amount = parseInt(lowerMessage.split(' ')[1]);
            if (!isNaN(amount)) {
                return Response.json({
                    type: 'system',
                    data: { xpGranted: amount }
                });
            }
        }

        let forcedIntent: string | null = null;
        let cleanMessage = message;

        if (lowerMessage.startsWith('/combat ')) {
            forcedIntent = 'TACTICAL';
            cleanMessage = message.slice(8).trim();
        } else if (lowerMessage.startsWith('/lore ')) {
            forcedIntent = 'COMMUNION';
            cleanMessage = message.slice(6).trim();
        } else if (lowerMessage.startsWith('/scene ')) {
            // Route directly to scene API — not tactical or communion
            const sceneText = message.slice(7).trim();
            const sceneUrl = new URL('/api/scene', req.url);
            const sceneRes = await fetch(sceneUrl.toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sceneText })
            });
            const sceneData = await sceneRes.json();
            return Response.json({ type: 'scene', data: sceneData });
        } else if (lowerMessage === '/scene') {
            return Response.json({ type: 'scene', data: { reaction: 'The Morninglord has not yet spoken. Provide the scene, My Lord.', sceneLogged: false } });
        } else if (lowerMessage === '/combat') {
            forcedIntent = 'TACTICAL';
            cleanMessage = "I stand ready for battle.";
        } else if (lowerMessage === '/lore') {
            forcedIntent = 'COMMUNION';
            cleanMessage = "I seek your guidance on my history.";
        }

        // 1. Intent Classification (Hybrid Approach)
        let intent = 'COMMUNION'; // default

        if (forcedIntent) {
            intent = forcedIntent;
        } else {
            // Fast Keyword Heuristic
            const tacticalKeywords = ['attack', 'move', 'cast', 'strike', 'hit', 'heal', 'defend', 'dodge', 'smite', 'lay on hands', 'cinder', 'graze', 'sap', 'enemy', 'goblin', 'dragon', 'sword', 'combat', 'damage', 'life', 'health'];
            const isLikelyTactical = tacticalKeywords.some(kw => lowerMessage.includes(kw));

            if (isLikelyTactical) {
                intent = 'TACTICAL';
            } else {
                // Fallback to LLM for ambiguous queries
                const classificationPrompt = `
You are an intent classifier for a D&D character sheet application. The user is playing as Sef'Ori Juris, a Paladin.
Analyze the following message and classify the intent as exactly one of the two following strings:
"TACTICAL" - If the user is describing a combat action, moving, casting a spell, attacking, defending, using a feature, or interacting with the environment physically.
"COMMUNION" - If the user is asking a lore question, talking to their deity/guide, asking about their backstory, or engaging in pure dialogue.

Respond ONLY with the exact string "TACTICAL" or "COMMUNION". Nothing else.

User Message: "${cleanMessage}"
`;

                const ollamaClassifyResponse = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'llama3.1',
                        prompt: classificationPrompt,
                        stream: false
                    })
                });

                if (!ollamaClassifyResponse.ok) {
                    throw new Error('Failed to classify intent via Ollama');
                }

                const classifyData = await ollamaClassifyResponse.json();
                intent = classifyData.response.trim().toUpperCase().includes('TACTICAL') ? 'TACTICAL' : 'COMMUNION';
            }
        }

        // 2. Route to appropriate backend logic
        const targetUrl = new URL(`/api/${intent === 'TACTICAL' ? 'tactical' : 'commune'}`, req.url);

        const routePayload = intent === 'TACTICAL'
            ? { scenario: cleanMessage }
            : { userResponse: cleanMessage, previousQuestion };

        const response = await fetch(targetUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(routePayload)
        });

        const data = await response.json();

        // 3. Return a unified format for the UI
        return Response.json({
            type: intent.toLowerCase(),
            data: data
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
