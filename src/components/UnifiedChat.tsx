'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Move, Shield, ScrollText } from 'lucide-react';

interface ChatMessage {
    id: string;
    role: 'user' | 'sef' | 'system';
    content?: string;
    type?: 'tactical' | 'communion' | 'error' | 'system' | 'scene';
    verdict?: any; // The raw payload from the tactical or commune backend
}

export default function UnifiedChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'init',
            role: 'sef',
            content: "Speak, mortal. Does combat loom, or do you seek the clarity of the Anvil?",
            type: 'communion'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-resizing textarea refs
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-resize logic
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`; // Set to scrollHeight, cap at 200px
        }
    }, [input]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const currentInput = input.trim();
        setInput(''); // Clear immediately for UX

        // Reset height immediately after clear
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: currentInput
        };

        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        const lastCommunionMsg = [...messages].reverse().find(m => m.role === 'sef' && m.type === 'communion');
        const previousQuestion = lastCommunionMsg?.verdict?.nextQuestion || lastCommunionMsg?.verdict?.question || lastCommunionMsg?.content || "None";

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: currentInput, previousQuestion })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Divine connection failed.");
            }

            if (data.error) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'system',
                    content: `Error: ${data.error}`
                }]);
                return;
            }

            const sefMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'sef',
                type: data.type,
                verdict: data.data // Keep raw data for UI rendering
            };

            if (data.type === 'system') {
                const systemMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'system',
                    content: `[SYSTEM] Experience Granted: ${data.data.xpGranted} XP.`,
                    type: 'system'
                    // removed unsupported timestamp
                };

                // Fire the system API to actually grant the XP
                fetch('/api/system', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: '/grantxp', args: [data.data.xpGranted] })
                }).then(res => res.json()).then(sysData => {
                    if (sysData.levelUp) {
                        const levelMsg: ChatMessage = {
                            id: (Date.now() + 2).toString(),
                            role: 'system',
                            content: `[SYSTEM] LEVEL UP ACHEIVED: You are now Level ${sysData.newLevel}. The Morninglord demands a choice of boons.`,
                            type: 'system'
                        };
                        setMessages(prev => [...prev, levelMsg]);
                    }
                });

                setMessages(prev => [...prev, systemMsg]);
                setLoading(false);
                return;
            }

            setMessages(prev => [...prev, sefMsg]);

            // Handle Attribute Updates (Divine Decrees)
            if (data.type === 'tactical' && data.data?.attributeUpdate) {
                let { key, value } = data.data.attributeUpdate;
                if (key) {
                    // Special case: If user said "take X damage", the LLM might return a negative number or a math expression.
                    // We need to decide if we set it absolutely or as a delta.
                    // If the user says "you are at 2 life", value should be 2.
                    // If the user says "take 20 damage", value might be -20.

                    fetch('/api/system', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: '/set_attribute', args: { key, value } })
                    }).then(res => res.json()).then(sysData => {
                        if (sysData.success) {
                            setMessages(prev => [...prev, {
                                id: (Date.now() + 3).toString(),
                                role: 'system',
                                content: key === 'full_heal'
                                    ? `[SYSTEM] Vitality Restored: Full Health achieved.`
                                    : `[SYSTEM] Attribute Adjusted: ${key.toUpperCase()} set to ${sysData.value}.`,
                                type: 'system'
                            }]);
                        }
                    });
                }
            }

            // Handle Rule Updates (Divine Decrees for Feats/Features)
            if (data.type === 'tactical' && data.data?.ruleUpdate) {
                const { name, source } = data.data.ruleUpdate;
                if (name) {
                    // We'll trust the LLM's description or fetch a placeholder
                    fetch('/api/system', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            command: '/add_feature',
                            args: {
                                id: name.toLowerCase().replace(/\s+/g, '_'),
                                name,
                                description: data.data.ruleUpdate.description || 'Added by Divine Decree',
                                source: source || 'divine'
                            }
                        })
                    });

                    setMessages(prev => [...prev, {
                        id: (Date.now() + 4).toString(),
                        role: 'system',
                        content: `[SYSTEM] Soul Fortified: Feature "${name}" integrated.`,
                        type: 'system'
                    }]);
                }
            }

            if (data.type === 'communion' && data.data.distilled?.includes('[UPDATE:')) {
                const match = data.data.distilled.match(/\[UPDATE:\s*(\w+)\s*=\s*(\d+)\]/);
                if (match) {
                    const [, key, value] = match;
                    fetch('/api/system', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: '/set_attribute', args: { key, value: parseInt(value) } })
                    });
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 4).toString(),
                        role: 'system',
                        content: `[SYSTEM] Attribute Adjusted: ${key.toUpperCase()} set to ${value}.`,
                        type: 'system'
                    }]);
                }
            }

            // If it was tactical and had a cost, auto-commit it (from legacy CommandConsole logic)
            if (data.type === 'tactical' && (data.data.action || data.data.bonusAction)) {
                const resourceCost = data.data.action?.resourceCost || data.data.bonusAction?.resourceCost || { type: "hp", amount: 0 };
                if (resourceCost.amount !== 0) { // Fix: Allow negative amounts for XP
                    const commitRes = await fetch('/api/commit-action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ resourceCost })
                    });

                    if (resourceCost.type === 'xp' && resourceCost.amount < 0) {
                        const amountGained = Math.abs(resourceCost.amount);
                        setMessages(prev => [...prev, {
                            id: Date.now() + 1 + "",
                            role: 'system',
                            content: `[SYSTEM] Experience Granted: ${amountGained} XP.`,
                            type: 'system'
                        }]);

                        // We can't easily know if we leveled up from the standard commit-action response without changing it.
                        // Wait, let's just trigger a system check.
                        const sysCheck = await fetch('/api/system', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ command: '/grantxp', args: [0] }) // 0 XP grant to check level
                        });
                        const sysData = await sysCheck.json();
                        if (sysData.levelUp) {
                            setMessages(prev => [...prev, {
                                id: Date.now() + 2 + "",
                                role: 'system',
                                content: `[SYSTEM] LEVEL UP ACHEIVED: You are now Level ${sysData.newLevel}. The Morninglord demands a choice of boons.`,
                                type: 'system'
                            }]);
                        }
                    }
                }
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: "The connection to the divine has been severed. Please try again."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const renderSefMessage = (msg: ChatMessage) => {
        if (msg.type === 'communion') {
            const communeData = msg.verdict;
            // Depending on if it's an initial question or a lore response
            return (
                <div className="space-y-4">
                    {communeData?.distilled && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] shadow-sm">
                            <ScrollText size={12} className="text-amber-400" />
                            MEMORY FORGED: {communeData.distilled}
                        </div>
                    )}
                    <div className="text-zinc-200 leading-relaxed font-serif text-[1.1rem] tracking-wide">
                        {communeData?.nextQuestion || communeData?.question || msg.content || "..."}
                    </div>
                </div>
            );
        }

        if (msg.type === 'scene') {
            const sceneData = msg.verdict;
            return (
                <div className="space-y-3">
                    {sceneData?.sceneLogged && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] shadow-sm">
                            <ScrollText size={12} className="text-emerald-400" />
                            SCENE RECORDED
                        </div>
                    )}
                    <div className="text-zinc-200 leading-relaxed font-serif text-[1.1rem] tracking-wide">
                        {sceneData?.reaction || "The world shifts around me. I await your command, My Lord."}
                    </div>
                </div>
            );
        }

        if (msg.type === 'tactical') {
            const tacticalData = msg.verdict;
            return (
                <div className="space-y-4">
                    {/* Soul Voice / Dialogue Header */}
                    <div className="text-zinc-200 font-serif text-[1.1rem] leading-relaxed">
                        "{tacticalData?.soulVoice?.reaction || tacticalData?.dialogue || "Standing ready."}"
                    </div>
                    {tacticalData?.soulVoice?.citation && (
                        <div className="text-[10px] uppercase text-zinc-500 tracking-widest mt-1">
                            Ref: {tacticalData.soulVoice.citation}
                        </div>
                    )}

                    {/* Tactical Breakdowns */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {tacticalData?.movement?.recommendation && (
                            <div className="px-3 py-1.5 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-full text-xs flex items-center gap-2">
                                <div className="text-zinc-400 uppercase tracking-widest text-[9px] flex items-center gap-1"><Move size={10} className="text-zinc-500" /> MOVE</div>
                                <div className="text-zinc-200 font-medium">{tacticalData.movement.speed}ft</div>
                                <div className="text-zinc-500 text-[10px] ml-1">{tacticalData.movement.recommendation}</div>
                            </div>
                        )}
                        {tacticalData?.action?.type && (
                            <div className="px-3 py-1.5 bg-zinc-900/80 backdrop-blur-sm border border-amber-500/20 rounded-full text-xs flex items-center gap-2">
                                <div className="text-amber-500/80 uppercase tracking-widest text-[9px] flex items-center gap-1"><Shield size={10} className="text-amber-600/50" /> ACTION</div>
                                <div className="text-amber-100 font-medium">{tacticalData.action.type}</div>
                                <div className="text-zinc-500 text-[10px] ml-1">{tacticalData.action.details}</div>
                                {tacticalData.action.resourceCost && tacticalData.action.resourceCost.amount > 0 && (
                                    <div className="text-red-400/90 font-mono text-[9px] ml-1 font-bold">-{tacticalData.action.resourceCost.amount} {tacticalData.action.resourceCost.type.toUpperCase()}</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        return <div className="text-zinc-200 leading-relaxed font-serif text-[1.1rem]">{msg.content}</div>;
    };

    return (
        <div className="flex flex-col h-full w-full relative">

            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent blur-[60px] pointer-events-none z-0" />

            {/* Ambient Bottom Glow under the text area */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-amber-500/5 to-transparent blur-[80px] pointer-events-none z-0" />

            {/* Chat History Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent z-10 pb-4"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start w-full'}`}
                        >
                            {msg.role === 'user' ? (
                                // User Bubble
                                <div className="max-w-[80%] bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-100 rounded-[1.5rem] rounded-tr-md px-6 py-4 shadow-lg border border-white/5 text-[15px] leading-relaxed break-words relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {msg.content}
                                </div>
                            ) : msg.role === 'system' ? (
                                // System Log
                                <div className="w-full text-center text-zinc-500 my-4 text-xs font-mono uppercase tracking-widest">
                                    {msg.content}
                                </div>
                            ) : (
                                // Sef Agent Bubble
                                <div className="w-full max-w-[95%] bg-transparent flex gap-5">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-950 border border-amber-500/40 flex items-center justify-center mt-1 shadow-[0_0_25px_rgba(212,175,55,0.25)] relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent pointer-events-none group-hover:animate-pulse" />
                                        <span className="text-amber-500 text-lg font-bold font-serif relative z-10 drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]">S</span>
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <div className="text-[9px] text-amber-500/50 uppercase tracking-widest mb-2 font-black">Sef'Ori Juris</div>
                                        {renderSefMessage(msg)}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start w-full"
                        >
                            <div className="w-full max-w-[90%] bg-transparent flex gap-4 opacity-60">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700/50 flex items-center justify-center animate-pulse mt-1" />
                                <div className="bg-transparent text-zinc-500 rounded-2xl px-2 py-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Composer Area - Floating Pill */}
            <div className="w-full shrink-0 pt-4 pb-6 md:pb-8 z-20 relative">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="relative flex items-end gap-3 bg-zinc-900/80 backdrop-blur-2xl border border-amber-500/20 rounded-[2rem] p-2 pr-2 pl-5 focus-within:border-amber-400/60 focus-within:bg-zinc-900/95 focus-within:shadow-[0_0_40px_-10px_rgba(212,175,55,0.2)] transition-all duration-500 shadow-2xl">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            placeholder="Speak your intent to the Master..."
                            style={{ backgroundColor: 'transparent' }}
                            className="flex-1 border-none outline-none text-zinc-100 placeholder:text-zinc-500/70 resize-none py-4 min-h-[56px] max-h-[200px] text-[16px] leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700 w-full font-serif"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="w-12 h-12 mb-1 mr-1 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:hover:scale-100 shadow-[0_0_15px_rgba(212,175,55,0.4)] disabled:shadow-none flex-shrink-0"
                        >
                            <Send size={20} className={input.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
