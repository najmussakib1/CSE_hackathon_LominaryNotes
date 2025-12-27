'use client';

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BackgroundAnimation() {
    const [mounted, setMounted] = useState(false);
    const [books, setBooks] = useState<any[]>([]);
    const [lightParticles, setLightParticles] = useState<any[]>([]);

    useEffect(() => {
        // Generate random positions ONLY on the client
        const newBooks = Array.from({ length: 6 }).map(() => ({
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
            duration: 30 + Math.random() * 20,
            path: [
                Math.random() * 100 + "%",
                Math.random() * 100 + "%",
                Math.random() * 100 + "%"
            ],
            yPath: [
                Math.random() * 100 + "%",
                Math.random() * 100 + "%",
                Math.random() * 100 + "%"
            ]
        }));

        const newLights = Array.from({ length: 12 }).map(() => ({
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
            duration: 3 + Math.random() * 5,
            delay: Math.random() * 5
        }));

        setBooks(newBooks);
        setLightParticles(newLights);
        setMounted(true);
    }, []);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-gray-950">
            {/* Abstract Blobs for depth - These are fine as they use fixed or synced animation starts */}
            <motion.div
                animate={{
                    x: [0, 100, -100, 0],
                    y: [0, 150, 50, 0],
                    scale: [1, 1.1, 0.9, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-0 w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]"
            />
            <motion.div
                animate={{
                    x: [0, -150, 50, 0],
                    y: [0, -100, 150, 0],
                    scale: [1, 1.2, 0.8, 1],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 right-0 w-[45%] h-[45%] rounded-full bg-purple-600/10 blur-[120px]"
            />

            {/* Roaming Books - Only render after mount to avoid hydration mismatch */}
            {mounted && books.map((book, i) => (
                <motion.div
                    key={`book-${i}`}
                    initial={{
                        x: book.left,
                        y: book.top,
                        opacity: 0
                    }}
                    animate={{
                        x: book.path,
                        y: book.yPath,
                        rotate: [0, 45, -45, 0],
                        opacity: [0, 0.3, 0.3, 0],
                    }}
                    transition={{
                        duration: book.duration,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute"
                >
                    <BookOpen className="w-12 h-12 text-indigo-400/20" />
                </motion.div>
            ))}

            {/* Twinkling Lights */}
            {mounted && lightParticles.map((light, i) => (
                <motion.div
                    key={`light-${i}`}
                    initial={{
                        x: light.left,
                        y: light.top
                    }}
                    animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 0.5, 0],
                    }}
                    transition={{
                        duration: light.duration,
                        repeat: Infinity,
                        delay: light.delay,
                    }}
                    className="absolute"
                >
                    <div className="w-1 h-1 bg-white rounded-full blur-[1px] shadow-[0_0_10px_white]" />
                </motion.div>
            ))}

            {/* Grid and Noise */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 contrast-150 brightness-150" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>
    );
}
