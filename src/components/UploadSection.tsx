'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // We need to create this util or just use template literals

export default function UploadSection({ onAnalysisComplete }: { onAnalysisComplete: (data: any) => void }) {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndAddFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            validateAndAddFiles(Array.from(e.target.files));
        }
    };

    const validateAndAddFiles = (newFiles: File[]) => {
        setError(null);
        const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf'];
        const allowedExtensions = ['.txt', '.md', '.pdf'];

        const validFiles = newFiles.filter(file => {
            const isAllowedType = allowedTypes.includes(file.type);
            const isAllowedExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
            return isAllowedType || isAllowedExtension;
        });

        if (validFiles.length < newFiles.length) {
            setError('Some files were skipped. Please upload only .txt, .md, or .pdf files.');
        }

        setFiles(prev => {
            const combined = [...prev, ...validFiles];
            // Remove duplicates by name and size
            return combined.filter((file, index, self) =>
                index === self.findIndex((f) => f.name === file.name && f.size === file.size)
            );
        });
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Analysis failed');
                } else {
                    const errorText = await response.text();
                    console.error('Server error response (non-JSON):', errorText);
                    throw new Error('Server returned an error. Check console for details.');
                }
            }

            const data = await response.json();
            onAnalysisComplete(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to analyze files. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            <div
                className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl transition-colors ${dragActive
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-white/20 hover:border-white/40 bg-white/5'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".txt,.md,.pdf"
                    multiple
                    onChange={handleChange}
                />

                <div className="flex flex-col items-center gap-2 text-center p-4">
                    <div className="p-3 rounded-full bg-white/5 ring-1 ring-white/10">
                        <Upload className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-white font-medium">
                            Click or drag study materials here
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Supports .TXT, .MD, and .PDF
                        </p>
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="mt-6 space-y-3">
                    <p className="text-sm font-medium text-gray-400">Selected Files ({files.length})</p>
                    <div className="grid grid-cols-1 gap-2">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-indigo-400" />
                                    <div>
                                        <p className="text-sm text-white font-medium truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-4 flex items-center gap-2 text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {files.length > 0 && !loading && (
                <button
                    onClick={handleUpload}
                    className="mt-6 w-full py-4 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                >
                    Analyze All Documents
                </button>
            )}

            {loading && (
                <div className="mt-6 flex flex-col items-center gap-3 text-indigo-300">
                    <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-sm animate-pulse">Synthesizing multiple documents...</p>
                </div>
            )}
        </div>
    );
}
