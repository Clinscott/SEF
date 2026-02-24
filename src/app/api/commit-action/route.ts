import { NextRequest, NextResponse } from 'next/server';
import agentEvents from '@/lib/events';
import { updateResource, updateVitals, updateSteedVitals, getCharacterState } from '@/lib/agent/state';

// Strict validation mapping for LLM hallucinations
const RESOURCE_MAP: Record<string, string> = {
    'spell_slots_l1': 'spell_slots_l1',
    'spell_slot_l1': 'spell_slots_l1',
    'spell_slot_1': 'spell_slots_l1',
    'l1_slot': 'spell_slots_l1',
    'spell_slots_l2': 'spell_slots_l2',
    'spell_slot_l2': 'spell_slots_l2',
    'spell_slot_2': 'spell_slots_l2',
    'l2_slot': 'spell_slots_l2',
    'lay_on_hands': 'lay_on_hands',
    'loh': 'lay_on_hands',
    'channel_divinity': 'channel_divinity',
    'cd': 'channel_divinity'
};

export async function POST(req: NextRequest) {
    try {
        const { mechanics } = await req.json();
        const state: any = getCharacterState();

        console.log('[Mutation] Initiating Commitment:', mechanics);

        // 1. Handle Resource Costs (Smites, LoH, etc.)
        if (mechanics.resourceCost) {
            const rawType = mechanics.resourceCost.type?.toLowerCase();
            const validatedId = RESOURCE_MAP[rawType];

            if (validatedId) {
                const amount = mechanics.resourceCost.amount || 0;
                const resource = state.resources.find((r: any) => r.id === validatedId);

                if (resource) {
                    const newValue = Math.max(0, resource.current_value - amount);
                    console.log(`[Mutation] Deducting ${amount} from ${validatedId}. New Value: ${newValue}`);
                    updateResource(validatedId, newValue);
                } else {
                    console.warn(`[Mutation] Validated Resource ID ${validatedId} not found in database.`);
                }
            } else {
                console.warn(`[Mutation] Unrecognized Resource Type hallucinated by LLM: ${rawType}`);
            }
        }

        // 2. Handle HP Changes (Damage or Healing)
        if (mechanics.hpChange) {
            const { target, amount } = mechanics.hpChange;
            if (target === 'sef') {
                const newHp = Math.max(0, Math.min(state.vitals.max_hp, state.vitals.current_hp + amount));
                console.log(`[Mutation] Sef HP Change: ${amount}. New HP: ${newHp}`);
                updateVitals(newHp, state.vitals.temp_hp);
            } else if (target === 'cinder') {
                const newHp = Math.max(0, Math.min(state.steed.max_hp, state.steed.current_hp + amount));
                console.log(`[Mutation] Cinder HP Change: ${amount}. New HP: ${newHp}`);
                updateSteedVitals(newHp);
            }
        }

        // 3. Trigger Real-time UI Refresh via SSE
        agentEvents.emit('stateUpdate');

        return NextResponse.json({ success: true, message: "Verdict committed to database." });
    } catch (e: any) {
        console.error('[Mutation Error]:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
