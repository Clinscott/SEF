'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Sparkles, History } from 'lucide-react';

interface Message {
    id: string;
    role: 'sef' | 'guide';
    text: string;
    distilled?: string;
}

const CommunionAnvil: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial question on mount
    useEffect(() => {
        const startCommunion = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/commune', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                const data = await res.json();
                if (data.question) {
                    setMessages([{ id: Date.now().toString(), role: 'sef', text: data.question }]);
                }
            } catch (e) {
                console.error('Failed to start communion:', e);
            } finally {
                setLoading(false);
            }
        };
        startCommunion();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async () => {
        if (!input.trim() || loading) return;

        const lastSefMsg = [...messages].reverse().find(m => m.role === 'sef');
        const userMsg: Message = { id: Date.now().toString(), role: 'guide', text: input };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/commune', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userResponse: input,
                    previousQuestion: lastSefMsg?.text
                })
            });
            const data = await res.json();

            if (data.success) {
                const sefMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'sef',
                    text: data.nextQuestion,
                    distilled: data.distilled
                };
                setMessages(prev => [...prev, sefMsg]);
            }
        } catch (e) {
            console.error('Commune error:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950/80 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <History size={18} className="text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">Communion Anvil</h3>
                        <p className="text-[10px] text-zinc-500 italic">Forging memories from the guide's light.</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-1 h-1 rounded-full bg-amber-500/40" />
                    ))}
                </div>
            </div>

            {/* Chat Feed */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className={`flex ${msg.role === 'guide' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] space-y-2 ${msg.role === 'guide' ? 'text-right' : 'text-left'}`}>
                                {/* Distilled Fact (Aureate) */}
                                {msg.distilled && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/60 border border-amber-500/20 rounded-full text-[10px] text-amber-500 font-bold uppercase tracking-tighter shadow-lg"
                                    >
                                        <Sparkles size={10} /> IT IS FORGED: {msg.distilled}
                                    </motion.div>
                                )}

                                {/* Bubble */}
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xl border
                                    ${msg.role === 'guide'
                                        ? 'bg-amber-600/20 text-amber-100 border-amber-500/30'
                                        : 'bg-zinc-900/60 text-zinc-300 border-white/10 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="px-4 py-3 rounded-2xl bg-zinc-900/40 text-zinc-500 text-xs italic border border-white/5 animate-pulse">
                                Sef is filtering the guide's words...
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Gate */}
            <div className="p-4 bg-zinc-900/20 border-t border-white/10 backdrop-blur-2xl">
                <div className="relative group">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                        placeholder="OFFER CLARITY TO THE CHIEF JURIST..."
                        className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 pr-12 text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 transition-all resize-none h-16 text-xs tracking-wide shadow-inner"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !input.trim()}
                        className="absolute bottom-3 right-3 p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20 hover:bg-amber-500 hover:text-zinc-950 transition-all disabled:opacity-30"
                    >
                        <ScrollText size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommunionAnvil;
