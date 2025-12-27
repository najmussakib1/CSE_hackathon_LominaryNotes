'use client';

import { useState, useEffect, useRef } from 'react';
import UploadSection from '@/components/UploadSection';
import AnalysisResults from '@/components/AnalysisResults';
import useVoice from '@/hooks/useVoice';
import {
  Sparkles, Library, Mic, MicOff, X, AlertTriangle,
  Loader2, CheckCircle2, BookOpen, Calculator,
  Cpu, Zap, ArrowLeft, Plus, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COURSES = [
  { id: 'MATH143', name: 'MATH143', fullName: 'Mathematics for Engineers', icon: Calculator, color: 'bg-blue-500' },
  { id: 'CSE105', name: 'CSE105', fullName: 'Structured Programming', icon: Cpu, color: 'bg-indigo-500' },
  { id: 'CSE106', name: 'CSE106', fullName: 'Data Structures', icon: Cpu, color: 'bg-purple-500' },
  { id: 'EEE163', name: 'EEE163', fullName: 'Electrical Circuits', icon: Zap, color: 'bg-amber-500' },
];

export default function Home() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuizDoc, setCurrentQuizDoc] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [courseMistakes, setCourseMistakes] = useState<string[]>([]);
  const isSessionActiveRef = useRef(false);
  const { isListening, isSpeaking, speak, listen, stop, abort, error: voiceError } = useVoice();

  const [interactionMode, setInteractionMode] = useState<'quiz' | 'doubt'>('quiz');
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);

  const [showAddMore, setShowAddMore] = useState(false);

  // Load persistence
  useEffect(() => {
    if (selectedCourse) {
      const savedData = localStorage.getItem(`loominary_data_${selectedCourse}`);
      const savedMistakes = localStorage.getItem(`loominary_mistakes_${selectedCourse}`);

      if (savedData) {
        setAnalysis(JSON.parse(savedData));
      } else {
        setAnalysis(null);
        setShowAddMore(false);
      }

      if (savedMistakes) {
        setCourseMistakes(JSON.parse(savedMistakes));
      } else {
        setCourseMistakes([]);
      }
    }
  }, [selectedCourse]);

  // Save persistence
  useEffect(() => {
    if (selectedCourse && analysis) {
      localStorage.setItem(`loominary_data_${selectedCourse}`, JSON.stringify(analysis));
    }
  }, [analysis, selectedCourse]);

  // Save mistakes persistence
  useEffect(() => {
    if (selectedCourse) {
      localStorage.setItem(`loominary_mistakes_${selectedCourse}`, JSON.stringify(courseMistakes));
    }
  }, [courseMistakes, selectedCourse]);

  const handleAnalysisComplete = (newData: any) => {
    if (analysis && analysis.documents && newData.documents) {
      // Append new documents to existing ones
      setAnalysis({
        ...analysis,
        documents: [...analysis.documents, ...newData.documents]
      });
    } else {
      setAnalysis(newData);
    }
    setShowAddMore(false);
  };

  const handleReset = () => {
    if (selectedCourse) {
      localStorage.removeItem(`loominary_data_${selectedCourse}`);
      localStorage.removeItem(`loominary_mistakes_${selectedCourse}`);
    }
    setAnalysis(null);
    setCourseMistakes([]);
    handleEndQuiz();
  };

  const startVoiceLoop = async (question: string, doc: any, mode: 'quiz' | 'doubt') => {
    if (!isSessionActiveRef.current) return;

    setCurrentQuestion(question);
    await speak(question);

    try {
      if (!isSessionActiveRef.current) return;
      const userAnswer = await listen();

      if (!isSessionActiveRef.current) return;

      if (userAnswer) {
        setIsProcessing(true);
        const res = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAnswer,
            currentQuestion: question,
            documentSummary: doc.summary,
            fileName: doc.fileName,
            mode
          })
        });
        const data = await res.json();
        setIsProcessing(false);

        if (!isSessionActiveRef.current) return;

        if (data.spokenResponse) {
          if (data.analysis) {
            setLastAnalysis(data.analysis);
            // Aggregate unique mistakes
            if (data.analysis.mistakes && data.analysis.mistakes.length > 0) {
              setCourseMistakes(prev => {
                const combined = [...prev];
                data.analysis.mistakes.forEach((m: string) => {
                  if (!combined.includes(m)) combined.push(m);
                });
                return combined.slice(-10); // Keep most recent 10 unique mistakes
              });
            }
          }
          startVoiceLoop(data.spokenResponse, doc, mode);
        }
      } else {
        // If no answer caught, ask nicely to repeat
        if (!isSessionActiveRef.current) return;
        console.log("No user answer detected, re-prompting...");
        const repeatMsg = mode === 'quiz'
          ? "I'm sorry, I didn't catch that. Could you please repeat your answer?"
          : "I'm sorry, I didn't hear your doubt clearly. Can you ask that again?";
        startVoiceLoop(repeatMsg, doc, mode);
      }
    } catch (err) {
      console.error("Voice loop error:", err);
      if (err !== 'aborted' && isSessionActiveRef.current) {
        setIsQuizActive(false);
        isSessionActiveRef.current = false;
      }
    }
  };

  const handleRemoveDoc = (fileName: string) => {
    if (analysis && analysis.documents) {
      const updatedDocs = analysis.documents.filter((d: any) => d.fileName !== fileName);
      if (updatedDocs.length === 0) {
        setAnalysis(null);
        if (selectedCourse) localStorage.removeItem(`loominary_data_${selectedCourse}`);
      } else {
        setAnalysis({ ...analysis, documents: updatedDocs });
      }
    }
  };

  const handleStartQuiz = (doc: any) => {
    setCurrentQuizDoc(doc);
    setInteractionMode('quiz');
    setIsQuizActive(true);
    isSessionActiveRef.current = true;
    setLastAnalysis(null);
    startVoiceLoop(doc.voiceConfig.firstQuestion, doc, 'quiz');
  };

  const handleStartDoubtSolving = (doc: any) => {
    setCurrentQuizDoc(doc);
    setInteractionMode('doubt');
    setIsQuizActive(true);
    isSessionActiveRef.current = true;
    setLastAnalysis(null);
    const welcomeMsg = `I'm ready to clear your doubts about "${doc.fileName}". What would you like to know?`;
    startVoiceLoop(welcomeMsg, doc, 'doubt');
  };

  const handleEndQuiz = () => {
    isSessionActiveRef.current = false;
    abort();
    setIsQuizActive(false);
    setCurrentQuizDoc(null);
    setIsProcessing(false);
    setLastAnalysis(null);
  };

  const selectedCourseData = COURSES.find(c => c.id === selectedCourse);

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-white selection:bg-indigo-500/30">
      {/* Quiz Overlay */}
      {isQuizActive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 p-8 h-[90vh]">
            {/* Assistant Section */}
            <div className="flex flex-col items-center justify-center space-y-8 bg-white/5 rounded-3xl p-12 border border-white/10">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {(isListening || isSpeaking || isProcessing) && (
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
                )}
                <div className="absolute inset-2 bg-indigo-500/40 rounded-full animate-pulse" />
                <div className={`relative p-6 rounded-full shadow-2xl transition-all duration-500 ${isListening ? 'bg-red-500 shadow-red-500/50' : isProcessing ? 'bg-amber-500 shadow-amber-500/50' : 'bg-indigo-600 shadow-indigo-500/50'}`}>
                  {isProcessing ? (
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  ) : isListening ? (
                    <Mic className="w-12 h-12 text-white" />
                  ) : (
                    <MicOff className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>

              <div className="space-y-4 text-center">
                <h2 className="text-3xl font-bold">
                  {isProcessing ? 'Analyzing...' : isListening ? 'Listening...' : isSpeaking ? 'Assistant Speaking' : 'Quiz Active'}
                </h2>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-xl text-indigo-300 font-medium italic">
                    {currentQuestion}
                  </p>
                </div>
                <p className="text-gray-400">
                  {isListening ? "Speak now to answer..." : isSpeaking ? "Listen carefully..." : "Preparing next question..."}
                </p>
              </div>

              <button
                onClick={handleEndQuiz}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold transition-all active:scale-[0.98]"
              >
                <X className="w-5 h-5" />
                End Session
              </button>
            </div>

            {/* AI Feedback Section */}
            <div className="flex flex-col bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-white/5">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Real-time AI Insights
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!lastAnalysis ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-700 animate-spin" />
                    <p>Provide an answer to see analysis...</p>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${lastAnalysis.status === 'correct' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        lastAnalysis.status === 'incorrect' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                        {lastAnalysis.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Feedback</h4>
                      <p className="text-gray-200 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                        {lastAnalysis.feedback}
                      </p>
                    </div>

                    {lastAnalysis.mistakes?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Points to Correct
                        </h4>
                        <div className="space-y-2">
                          {lastAnalysis.mistakes.map((m: string, i: number) => (
                            <div key={i} className="flex gap-3 text-sm text-gray-300 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                              <span className="text-red-500 font-bold">!</span>
                              {m}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {lastAnalysis.suggestions?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Suggestions
                        </h4>
                        <div className="space-y-2">
                          {lastAnalysis.suggestions.map((s: string, i: number) => (
                            <div key={i} className="flex gap-3 text-sm text-gray-300 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                              <span className="text-emerald-500 font-bold">→</span>
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Error Alert */}
      {voiceError && (
        <div className="fixed bottom-8 left-8 right-8 z-[200] max-w-md mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 text-red-400 animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-medium">{voiceError}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 bg-gray-900/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 rounded-lg cursor-pointer" onClick={() => setSelectedCourse(null)}>
            <Library className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Loominary <span className="text-indigo-400">Notes</span>
          </h1>
        </div>
        {selectedCourse && (
          <div className="flex items-center gap-4">
            <div className={`px-4 py-1.5 rounded-full ${selectedCourseData?.color} bg-opacity-10 border border-white/10 text-sm font-semibold flex items-center gap-2`}>
              {selectedCourseData && <selectedCourseData.icon className="w-4 h-4 text-indigo-400" />}
              {selectedCourse}
            </div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="p-1 px-3 text-xs font-semibold text-gray-500 hover:text-white transition-colors"
            >
              Back to Courses
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-8">
          <AnimatePresence mode="wait">
            {!selectedCourse ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12 py-12"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-extrabold tracking-tight">Select Your Course</h2>
                  <p className="text-gray-400 text-lg">Pick a subject to continue your academic journey.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {COURSES.map((course) => (
                    <motion.button
                      key={course.id}
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCourse(course.id)}
                      className="group relative flex flex-col p-8 bg-white/5 border border-white/10 rounded-3xl text-left transition-all hover:bg-white/[0.08] hover:border-indigo-500/30 overflow-hidden"
                    >
                      <div className={`p-4 rounded-2xl ${course.color} bg-opacity-10 text-indigo-400 mb-6 group-hover:scale-110 transition-transform`}>
                        <course.icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{course.name}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-8">{course.fullName}</p>

                      <div className="mt-auto flex items-center gap-2 text-indigo-400 font-bold group-hover:gap-3 transition-all">
                        Enter Course
                        <Plus className="w-4 h-4" />
                      </div>

                      {/* Decorative Background Element */}
                      <div className={`absolute -right-8 -bottom-8 w-32 h-32 ${course.color} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity`} />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="course-content"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8"
              >
                {!analysis || showAddMore ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-12 max-w-3xl mx-auto">
                    <div className="space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                        <BookOpen className="w-3 h-3" />
                        {selectedCourse} Dashboard
                      </div>
                      <h2 className="text-5xl font-extrabold tracking-tight leading-tight">
                        {analysis ? 'Append More' : 'Upload to'} <span className="text-indigo-400">Synthesize</span>.
                      </h2>
                      <p className="text-xl text-gray-500 leading-relaxed">
                        {analysis
                          ? `Add more lecture notes to your ${selectedCourse} collection.`
                          : `Provide your lecture notes for ${selectedCourseData?.fullName}. Loominary will process them into an interactive revision experience.`
                        }
                      </p>
                    </div>

                    <div className="w-full">
                      <UploadSection onAnalysisComplete={handleAnalysisComplete} />
                      {analysis && (
                        <button
                          onClick={() => setShowAddMore(false)}
                          className="mt-8 text-sm text-gray-500 hover:text-white transition-colors underline underline-offset-4"
                        >
                          Cancel and View Existing Notes
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Common Mistakes Section */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                      <div className="p-6 border-b border-white/10 bg-indigo-500/5 flex items-center justify-between">
                        <h4 className="text-lg font-bold flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                          Common Learning Pitfalls
                        </h4>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Permanent Record</span>
                      </div>
                      <div className="p-6">
                        {courseMistakes.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                            <div className="p-3 bg-white/5 rounded-full">
                              <Sparkles className="w-6 h-6 text-gray-600" />
                            </div>
                            <p className="text-gray-500 text-sm">No major pitfalls identified yet. Take a quiz to start tracking your common mistakes!</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {courseMistakes.map((mistake, idx) => (
                              <div key={idx} className="flex gap-3 items-start p-4 bg-red-500/5 border border-red-500/10 rounded-2xl group hover:border-red-500/30 transition-all">
                                <div className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                <p className="text-sm text-gray-300 leading-relaxed">{mistake}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold flex items-center gap-3">
                        <Library className="w-6 h-6 text-indigo-400" />
                        Course Materials
                      </h3>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (confirm('This will delete all PDFs and analysis for this course. Are you sure?')) {
                              handleReset();
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 text-sm font-bold transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear All
                        </button>
                        <button
                          onClick={() => setShowAddMore(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-sm font-bold transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Add New PDF
                        </button>
                      </div>
                    </div>
                    <AnalysisResults
                      data={analysis}
                      onReset={handleReset}
                      onStartQuiz={handleStartQuiz}
                      onStartDoubtSolving={handleStartDoubtSolving}
                      onRemoveDoc={handleRemoveDoc}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="py-8 text-center text-gray-600 text-sm border-t border-white/5 bg-gray-950">
        &copy; 2025 Loominary AI • Built for Hackathon IEEE
      </footer>
    </main>
  );
}
