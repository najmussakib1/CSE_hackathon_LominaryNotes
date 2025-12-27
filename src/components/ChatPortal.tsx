'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Hash, User, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Message {
    id: string;
    content: string;
    courseId: string;
    createdAt: string;
    userId: string;
    user: {
        name: string | null;
        email: string | null;
    };
}

interface ChatPortalProps {
    courseId: string;
    currentUserId?: string;
}

export default function ChatPortal({ courseId, currentUserId }: ChatPortalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/messages/${encodeURIComponent(courseId)}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error('Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); // Polling every 5s
        return () => clearInterval(interval);
    }, [courseId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch(`/api/messages/${encodeURIComponent(courseId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage }),
            });

            if (res.ok) {
                const msg = await res.json();
                setMessages((prev) => [...prev, msg]);
                setNewMessage('');
            }
        } catch (err) {
            console.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white leading-none mb-1">Study Haven</h3>
                        <p className="text-xs text-gray-400 font-medium">#{courseId.replace(/\s+/g, '-').toLowerCase()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Live</span>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
            >
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-40">
                        <Hash className="w-12 h-12" />
                        <p className="text-sm font-medium">No discussions yet.<br />Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.userId === currentUserId;
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    {!isMe && <span className="text-xs font-bold text-indigo-300">{msg.user.name || 'Student'}</span>}
                                    <span className="text-[10px] text-gray-500 font-medium">
                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <div
                                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${isMe
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white/10 text-gray-200 border border-white/10 rounded-tl-none'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Share an insight or ask a doubt..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 pl-5 pr-12 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="absolute right-2 p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
