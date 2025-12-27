'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, PerspectiveCamera, Environment, Text, Sparkles, OrbitControls, useScroll, ScrollControls, Scroll } from '@react-three/drei';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { motion, useScroll as useFramerScroll, useTransform } from 'framer-motion';
import {
    BookOpen, Mic, MessageSquare, Brain,
    ArrowRight, Github, Star, Zap, Shield, Sparkle
} from 'lucide-react';
import Link from 'next/link';

function FloatingCrystal({ position, color, speed = 1, size = 1 }: any) {
    const mesh = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const t = state.clock.getElapsedTime() * speed;
        if (mesh.current) {
            mesh.current.position.y = position[1] + Math.sin(t) * 0.2;
            mesh.current.rotation.x = t * 0.5;
            mesh.current.rotation.y = t * 0.3;
        }
    });

    return (
        <Float speed={speed * 2} rotationIntensity={1} floatIntensity={1}>
            <mesh position={position} ref={mesh}>
                <octahedronGeometry args={[size]} />
                <MeshDistortMaterial
                    color={color}
                    speed={speed}
                    distort={0.4}
                    radius={1}
                    metalness={0.8}
                    roughness={0.2}
                    emissive={color}
                    emissiveIntensity={0.5}
                />
            </mesh>
        </Float>
    );
}

function Scene() {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 8]} />
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            <FloatingCrystal position={[-4, 2, 0]} color="#6366f1" speed={0.8} size={0.6} />
            <FloatingCrystal position={[4, -2, -2]} color="#ec4899" speed={1.2} size={0.8} />
            <FloatingCrystal position={[2, 3, -1]} color="#8b5cf6" speed={1} size={0.5} />

            <Sparkles count={200} scale={15} size={1} speed={0.4} color="#6366f1" />

            <Sphere args={[1, 64, 64]} position={[0, 0, -2]}>
                <MeshDistortMaterial
                    color="#4f46e5"
                    attach="material"
                    distort={0.5}
                    speed={2}
                    roughness={0}
                />
            </Sphere>
        </>
    );
}

export default function LandingPage() {
    const { scrollYProgress } = useFramerScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.8]);

    return (
        <div className="bg-[#030014] text-white overflow-x-hidden selection:bg-indigo-500/30">
            {/* 3D Background */}
            <div className="fixed inset-0 z-0 opacity-40">
                <Canvas>
                    <Scene />
                </Canvas>
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl">
                            <Sparkle className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter">Loominary</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#about" className="hover:text-white transition-colors">About</a>
                        <a href="https://github.com/najmussakib1/CSE_hackathon_LominaryNotes" className="hover:text-white transition-colors">Github</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="px-5 py-2.5 text-sm font-bold hover:text-indigo-400 transition-colors">
                            Sign In
                        </Link>
                        <Link href="/register" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-32">
                {/* Hero Section */}
                <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative">
                    <motion.div
                        style={{ opacity, scale }}
                        className="max-w-4xl space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest shadow-xl">
                            <Zap className="w-3 h-3 fill-current" />
                            The Future of Exam Prep
                        </div>

                        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.1]">
                            Study Smarter with <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                Loominary AI
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Transform static lecture notes into interactive 3D learning experiences.
                            PDF Analysis, Voice Q&A, and Group Discussions in one flagship platform.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link href="/register" className="group px-8 py-4 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-all active:scale-95">
                                Join the Mission
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#features" className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold hover:bg-white/10 transition-all active:scale-95">
                                See Features
                            </a>
                        </div>
                    </motion.div>

                    <div className="absolute bottom-10 animate-bounce opacity-40">
                        <div className="w-6 h-10 rounded-full border-2 border-white flex justify-center pt-2">
                            <div className="w-1 h-2 bg-white rounded-full" />
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center space-y-4 mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold">Unrivaled Power</h2>
                            <p className="text-gray-500 max-w-xl mx-auto">Everything you need to dominate your academics, powered by cutting-edge AI architecture.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={BookOpen}
                                title="Deep PDF Analysis"
                                description="Loominary synthesizes your lecture notes into structured summaries and high-yield questions automatically."
                                color="bg-indigo-500"
                            />
                            <FeatureCard
                                icon={Mic}
                                title="Socratic Voice Q&A"
                                description="Our voice assistant doesn't just give answers—it guides you through concepts using the Socratic method."
                                color="bg-purple-500"
                            />
                            <FeatureCard
                                icon={MessageSquare}
                                title="The Study Haven"
                                description="Collaborate with peers in real-time within course-specific discussion portals integrated into your dashboard."
                                color="bg-pink-500"
                            />
                            <FeatureCard
                                icon={Brain}
                                title="Mistake Mastery"
                                description="Our AI tracks your recurring pitfalls and builds a permanent record to ensure you never repeat a mistake."
                                color="bg-blue-500"
                            />
                            <FeatureCard
                                icon={Shield}
                                title="Course Persistence"
                                description="All your data is saved securely. Switch between subjects like Calculus and CSE without losing a beat."
                                color="bg-emerald-500"
                            />
                            <FeatureCard
                                icon={Zap}
                                title="Hyper-Fast"
                                description="Built on Next.js 16 and Llama 3.1, providing near-instant responses for a seamless study flow."
                                color="bg-amber-500"
                            />
                        </div>
                    </div>
                </section>

                {/* Closing CTA */}
                <section className="py-20 px-6">
                    <div className="max-w-5xl mx-auto bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-12 md:p-20 text-center space-y-8 relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:24px_24px]" />
                        <h2 className="text-4xl md:text-6xl font-black">Level Up Your Learning.</h2>
                        <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto">
                            Join hundreds of students using Loominary to simplify their studies and ace their exams.
                        </p>
                        <Link href="/register" className="inline-flex px-10 py-5 bg-white text-indigo-600 rounded-full font-black text-xl hover:scale-105 transition-all shadow-xl active:scale-95">
                            Create Free Account
                        </Link>
                    </div>
                </section>

                {/* About & Developer Section */}
                <section id="about" className="py-32 px-6 border-t border-white/5 bg-white/[0.02]">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        {/* The Study Haven Intro */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-wider">
                                <MessageSquare className="w-3 h-3" />
                                The Study Haven
                            </div>
                            <h2 className="text-4xl font-bold leading-tight">Your Digital <span className="text-pink-400">Collaboration Sanctuary</span>.</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                The Study Haven is an interactive community hub designed for real-time academic collaboration. It integrates course-specific discussion portals directly into your dashboard, allowing students to bridge the gap between individual study and peer-to-peer knowledge sharing.
                            </p>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                From clarifying complex doubts to sharing revision insights, it's the ultimate digital sanctuary for collaborative learning, ensuring no student has to tackle a difficult subject alone.
                            </p>
                        </motion.div>

                        {/* Developer Bio */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative p-8 md:p-12 bg-indigo-500/5 border border-indigo-500/10 rounded-[3rem] overflow-hidden group hover:border-indigo-500/30 transition-all shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
                                <Shield className="w-32 h-32 text-indigo-400" />
                            </div>

                            <div className="relative space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-600/40">
                                        NS
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">MD. Najmus Sakib</h3>
                                        <p className="text-indigo-400 font-semibold">CSE, BUET</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-gray-400 leading-relaxed">
                                    <p className="font-medium text-white/90">
                                        Full Stack Web Developer & AI-ML Enthusiast
                                    </p>
                                    <p>
                                        A passionate developer dedicated to crafting intelligent solutions that empower education. With a deep interest in large language models and spatial computing, I strive to build tools that make learning more immersive and efficient.
                                    </p>
                                    <p>
                                        Specializing in Next.js, React Three Fiber, and Generative AI, I focus on the intersection of beautiful design and powerful functionality to solve real-world student challenges.
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <a href="https://github.com/najmussakib1" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10">
                                        <Github className="w-5 h-5" />
                                    </a>
                                    <Link href="/register" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20">
                                        Collaborate with Me
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <footer className="py-12 border-t border-white/5 text-center text-gray-500 text-sm bg-black/40">
                    <p>&copy; 2025 Loominary Notes • Built by Najmus Sakib for IEEE Hackathon</p>
                    <div className="flex justify-center gap-6 mt-4">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="https://github.com/najmussakib1" className="hover:text-white transition-colors">Author</a>
                    </div>
                </footer>
            </main>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description, color }: any) {
    return (
        <motion.div
            whileHover={{ y: -10 }}
            className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/[0.08] transition-all group"
        >
            <div className={`w-14 h-14 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-7 h-7 text-white`} />
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </motion.div>
    );
}
