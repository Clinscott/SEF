'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
    id: string;
    role: 'user' | 'sef' | 'system';
    content: string;
    verdict?: any;
    timestamp: Date;
}

const CommandConsole: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init',
            role: 'system',
            content: 'SEF_ORI_JURIS OS v1.0.0 ONLINE.\nESTABLISHING COMMUNION LINK... \nLINK SECURED.\n\nAWAITING INPUT.',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Focus input on click anywhere in the console
    const handleConsoleClick = () => {
        if (window.getSelection()?.toString().length === 0) {
            inputRef.current?.focus();
        }
    };

    const handleConsult = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/tactical', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario: input })
            });
            const data = await res.json();

            let cliResponse = '';

            if (data.soulVoice?.reaction) {
                cliResponse += `[SOUL_VOICE] "${data.soulVoice.reaction}"\n[CITATION] ${data.soulVoice.citation}\n\n`;
            } else if (data.dialogue) {
                cliResponse += `[DIALOGUE] "${data.dialogue}"\n\n`;
            }

            if (data.movement?.recommendation) {
                cliResponse += `[MOVEMENT] ${data.movement.speed}ft - ${data.movement.recommendation}\n`;
            }

            if (data.action?.type) {
                cliResponse += `[ACTION] ${data.action.type.toUpperCase()} - ${data.action.details}\n`;
                if (data.action.resourceCost) {
                    cliResponse += `   COST: ${data.action.resourceCost.amount} ${data.action.resourceCost.type.toUpperCase()}\n`;
                }
            }

            if (data.bonusAction?.type) {
                cliResponse += `[BONUS] ${data.bonusAction.type.toUpperCase()} - ${data.bonusAction.details}\n`;
            }

            if (!cliResponse) {
                cliResponse = "IDLE BREATH. SPEAK AGAIN.";
            }

            const sefMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'sef',
                content: cliResponse.trim(),
                verdict: data,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, sefMsg]);

            if (data.action || data.bonusAction) {
                handleExecute(data, sefMsg.id);
            }

        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: 'ERR: CONNECTION TO HOLY LAWS SEVERED. RETRY INPUT.',
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const handleExecute = async (verdict: any, msgId: string) => {
        try {
            const resourceCost = verdict.action?.resourceCost || verdict.bonusAction?.resourceCost || { type: "hp", amount: 0 };

            // Only log if actual mutation occurs
            const mutationNoOp = ['none', 'null', 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            const isNoOp = mutationNoOp.includes(resourceCost.type?.toLowerCase()) || resourceCost.amount === 0;

            await fetch('/api/commit-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceCost })
            });

            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'system',
                    content: isNoOp 
                        ? `[SYS] RECORDED JUDGMENT FOR REF: ${msgId}\n[SYS] NO MUTATION REQUIRED.`
                        : `[SYS] RECORDED JUDGMENT FOR REF: ${msgId}\n[SYS] RESOURCES DEDUCTED ACCORDING TO HOLY LAW.`,
                    timestamp: new Date()
                }]);
            }, 500); // Dramatic delay
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div 
            className="flex flex-col h-full min-h-[600px] bg-[#050505] rounded-xl border border-zinc-800/80 shadow-[0_0_30px_rgba(0,0,0,0.8)] font-mono text-[13px] leading-relaxed tracking-wide overflow-hidden relative cursor-text group"
            onClick={handleConsoleClick}
        >
            {/* Ambient background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-amber-500/5 blur-[80px] pointer-events-none z-0"></div>

            {/* Retro CRT Scanlines & Vignette */}
            <div className="absolute inset-0 pointer-events-none z-20 opacity-20 mix-blend-overlay"
                 style={{ 
                     backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', 
                     backgroundSize: '100% 2px, 3px 100%' 
                 }}>
            </div>
            <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]"></div>

            {/* Terminal Header */}
            <div className="bg-zinc-900/80 backdrop-blur-sm px-4 py-2 border-b border-white/5 flex items-center justify-between relative z-10">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60 border border-red-500/20"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/60 border border-amber-500/20"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/60 border border-green-500/20"></div>
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest absolute left-1/2 -translate-x-1/2">
                    bash — sef_ori_juris
                </div>
                <div className="text-[10px] text-zinc-600 font-black">
                    tty1
                </div>
            </div>

            {/* Output Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent relative z-10"
            >
                {messages.map((msg) => (
                    <div key={msg.id} className="whitespace-pre-wrap break-words">
                        {msg.role === 'user' && (
                            <div className="text-zinc-300">
                                <span className="text-emerald-500 font-bold mr-3 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">craig@corvus:~$</span>
                                <span className="opacity-90">{msg.content}</span>
                            </div>
                        )}

                        {msg.role === 'sef' && (
                            <div className="text-amber-500/90 pl-4 border-l border-amber-500/30 py-1 my-3 drop-shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                {msg.content}
                            </div>
                        )}

                        {msg.role === 'system' && (
                            <div className="text-zinc-600 text-[11px] uppercase tracking-wider font-bold my-1">
                                {msg.content}
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="text-amber-500/40 animate-pulse before:content-['>_'] pr-2 pl-4 py-2">
                        EXECUTING BINARY QUERY...
                    </div>
                )}
            </div>

            {/* Input Row */}
            <div className="p-4 px-6 bg-zinc-950/40 border-t border-white/5 flex items-center relative z-10">
                <span className="text-emerald-500 font-bold mr-3 select-none group-focus-within:text-emerald-400 transition-colors drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">craig@corvus:~$</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConsult();
                        }
                    }}
                    disabled={loading}
                    spellCheck="false"
                    className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-800 font-mono focus:ring-0 p-0 caret-emerald-500"
                    autoFocus
                />
            </div>
        </div>
    );
};

export default CommandConsole;
