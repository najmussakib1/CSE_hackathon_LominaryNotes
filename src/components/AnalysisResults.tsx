'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    BookOpen,
    HelpCircle,
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Mic,
    ChevronDown,
    FileText,
    Trash2
} from 'lucide-react';

interface DocumentAnalysis {
    fileName: string;
    summary: string;
    questions: string[];
    mistakes: { pitfall: string; correction: string; }[];
    voiceConfig: {
        systemPrompt: string;
        firstQuestion: string;
    };
}

interface AnalysisResultsProps {
    data: {
        documents: DocumentAnalysis[];
    };
    onReset: () => void;
    onStartQuiz?: (doc: DocumentAnalysis) => void;
    onStartDoubtSolving?: (doc: DocumentAnalysis) => void;
    onRemoveDoc?: (fileName: string) => void;
}

export default function AnalysisResults({ data, onReset, onStartQuiz, onStartDoubtSolving, onRemoveDoc }: AnalysisResultsProps) {
    const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header / Action Bar */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Upload New Documents
                </button>
                <div className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                    Analysis Complete ({data.documents?.length || 0} Files)
                </div>
            </div>

            <div className="space-y-4">
                {data.documents?.map((doc, idx) => {
                    const isExpanded = expandedIndex === idx;

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "group border rounded-2xl transition-all duration-300 overflow-hidden",
                                isExpanded
                                    ? "bg-white/[0.03] border-indigo-500/30 shadow-2xl shadow-indigo-500/10"
                                    : "bg-white/5 border-white/10 hover:border-white/20"
                            )}
                        >
                            {/* Document Header */}
                            <div
                                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                                className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2.5 rounded-xl transition-colors",
                                        isExpanded ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-gray-400"
                                    )}>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white leading-tight">{doc.fileName}</h3>
                                        <p className="text-xs text-gray-500 mt-1">Click to view summary & practice</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Are you sure you want to remove \"${doc.fileName}\"?`)) {
                                                onRemoveDoc?.(doc.fileName);
                                            }
                                        }}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-40 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <ChevronDown className={cn(
                                        "w-5 h-5 text-gray-500 transition-transform duration-300",
                                        isExpanded && "rotate-180 text-indigo-400"
                                    )} />
                                </div>
                            </div>

                            {/* Document Content */}
                            {isExpanded && (
                                <div className="p-6 pt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Action row for this specific doc */}
                                    <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onStartDoubtSolving?.(doc);
                                            }}
                                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-sm font-semibold transition-all active:scale-95"
                                        >
                                            <HelpCircle className="w-4 h-4" />
                                            Solve Doubts
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onStartQuiz?.(doc);
                                            }}
                                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                                        >
                                            <Mic className="w-4 h-4" />
                                            Start Voice Quiz
                                        </button>
                                    </div>

                                    {/* Summary */}
                                    <section className="bg-white/5 border border-white/5 p-5 rounded-xl">
                                        <div className="flex items-center gap-3 mb-3 text-indigo-400">
                                            <BookOpen className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Summary</span>
                                        </div>
                                        <p className="text-gray-300 leading-relaxed italic">
                                            "{doc.summary}"
                                        </p>
                                    </section>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Questions */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-3 text-purple-400">
                                                <HelpCircle className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Practice Questions</span>
                                            </div>
                                            <div className="space-y-2">
                                                {doc.questions.map((q, qIdx) => (
                                                    <div key={qIdx} className="bg-white/5 p-3 rounded-lg text-sm text-gray-400 border border-transparent hover:border-white/5 transition-colors">
                                                        <span className="text-indigo-500 mr-2 font-mono">0{qIdx + 1}</span> {q}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* Pitfalls */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-3 text-amber-400">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Conceptual Pitfalls</span>
                                            </div>
                                            <div className="space-y-3">
                                                {doc.mistakes.map((m, mIdx) => (
                                                    <div key={mIdx} className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-lg space-y-2">
                                                        <p className="text-xs text-amber-200/70 font-medium">❌ {m.pitfall}</p>
                                                        <p className="text-xs text-emerald-400/90 ml-4 font-medium">✅ {m.correction}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
