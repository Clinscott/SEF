import express from 'express';
import { PaladinAgent } from '../agent/paladin-agent';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const agent = new PaladinAgent();

app.use(express.json());

app.post('/chat', async (req, res) => {
    const { query } = req.body;
    try {
        const response = await agent.handleQuery(query);
        res.json({ response });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/tactical', (req, res) => {
    const { scenario } = req.body;
    if (!scenario || typeof scenario !== 'string') {
        res.status(400).json({ error: 'A "scenario" string is required. Example: "Three goblins rush from the shadows."' });
        return;
    }
    try {
        const response = agent.handleTacticalQuery(scenario);
        res.json(response);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/status', (req, res) => {
    res.json({ status: 'Sef\'Ori Juris is vigilant. The court is in session.' });
});

export async function startServer() {
    await agent.boot();
    app.listen(port, () => {
        console.log(`[Server] Sef'Ori Juris backend running on http://localhost:${port}`);
    });
}
