import React, { useState, useEffect } from 'react';
import { User, MCQItem, MCQResult, TopicItem } from '../types';
import { X, CheckCircle, ArrowRight, Loader2, BrainCircuit, AlertCircle } from 'lucide-react';
import { getChapterData, saveUserToLive, saveTestResult, saveUserHistory } from '../firebase';
import { storage } from '../utils/storage';

interface Props {
    user: User;
    topics: TopicItem[];
    onClose: () => void;
    onComplete: (results: MCQResult[]) => void;
}

export const TodayMcqSession: React.FC<Props> = ({ user, topics, onClose, onComplete }) => {
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentMcqData, setCurrentMcqData] = useState<MCQItem[]>([]);

    // Test State for Current Topic
    const [qIndex, setQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [showResult, setShowResult] = useState(false); // Result for current topic
    const [topicScore, setTopicScore] = useState(0);

    const [sessionResults, setSessionResults] = useState<MCQResult[]>([]);

    useEffect(() => {
        loadTopicData(currentIndex);
    }, [currentIndex]);

    const loadTopicData = async (index: number) => {
        if (index >= topics.length) {
            onComplete(sessionResults);
            return;
        }

        setLoading(true);
        const topic = topics[index];
        setQIndex(0);
        setAnswers({});
        setShowResult(false);
        setTopicScore(0);

        try {
            let data: any = null;
            const board = user.board || 'CBSE';
            const classLevel = user.classLevel || '10';
            const streamKey = (classLevel === '11' || classLevel === '12') && user.stream ? `-${user.stream}` : '';
            const subject = topic.subjectName || 'Unknown';

            // Fetch Content
            const strictKey = `nst_content_${board}_${classLevel}${streamKey}_${subject}_${topic.chapterId}`;
            data = await storage.getItem(strictKey);
            if (!data) data = await getChapterData(strictKey);
            if (!data) data = await getChapterData(topic.chapterId);

            let mcqs: MCQItem[] = [];
            if (data && data.manualMcqData) {
                // Filter by Subtopic Logic
                const normSubTopic = topic.name.toLowerCase().trim();
                mcqs = data.manualMcqData.filter((q: any) => q.topic && q.topic.toLowerCase().trim() === normSubTopic);

                // Fallback: If no subtopic specific MCQs, maybe use generic ones?
                // User logic is specific to subtopics now. If empty, we might need to skip or show empty.
                if (mcqs.length === 0) {
                     // Try loose match
                     mcqs = data.manualMcqData.filter((q: any) => q.topic && q.topic.toLowerCase().includes(normSubTopic));
                }
            }

            setCurrentMcqData(mcqs);
        } catch (e) {
            console.error("Failed to load MCQ", e);
            setCurrentMcqData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (optionIdx: number) => {
        if (answers[qIndex] !== undefined) return;

        const newAnswers = { ...answers, [qIndex]: optionIdx };
        setAnswers(newAnswers);

        // Auto Advance after short delay
        setTimeout(() => {
            if (qIndex < currentMcqData.length - 1) {
                setQIndex(prev => prev + 1);
            } else {
                calculateTopicResult(newAnswers);
            }
        }, 500);
    };

    const calculateTopicResult = (finalAnswers: Record<number, number>) => {
        let correct = 0;
        currentMcqData.forEach((q, i) => {
            if (finalAnswers[i] === q.correctAnswer) correct++;
        });
        setTopicScore(correct);
        setShowResult(true);
    };

    const handleNextTopic = () => {
        // Save Result
        const topic = topics[currentIndex];
        const total = currentMcqData.length;
        const score = topicScore;
        const percentage = total > 0 ? (score/total)*100 : 0;

        // Determine Status based on NEW Logic
        // < 50 Weak, 50-79 Avg, >= 80 Excellent (User said "80% aagaya ab ye topic jayega exclent page me")
        // Wait, did user define "Strong"?
        // User: "10 topic week , 5 avrage aur 2 stronge hua... mcq banaye 80% aagaya ab ye topic jayega exclent page me"
        // Implies: < 50 Weak, 50-65 Avg, 65-79 Strong, >= 80 Excellent. (Approximation)
        let status = 'AVERAGE';
        if (percentage < 50) status = 'WEAK';
        else if (percentage >= 80) status = 'EXCELLENT';
        else if (percentage >= 65) status = 'STRONG';

        const result: MCQResult = {
            id: `mcq-rev-${Date.now()}`,
            userId: user.id,
            chapterId: topic.chapterId,
            chapterTitle: topic.chapterName,
            subjectId: 'REVISION',
            subjectName: topic.subjectName || 'Revision',
            date: new Date().toISOString(),
            score: score,
            totalQuestions: total,
            correctCount: score,
            wrongCount: total - score,
            totalTimeSeconds: 0,
            averageTimePerQuestion: 0,
            performanceTag: percentage >= 80 ? 'EXCELLENT' : percentage >= 50 ? 'GOOD' : 'BAD',
            ultraAnalysisReport: JSON.stringify({
                topics: [{ name: topic.name, status: status }]
            })
        };

        setSessionResults(prev => [...prev, result]);

        // Save to DB immediately to be safe
        saveUserHistory(user.id, result);
        saveTestResult(user.id, result);

        setCurrentIndex(prev => prev + 1);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center">
                <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                <p className="font-bold text-slate-600 animate-pulse">Loading Topic {currentIndex + 1}...</p>
            </div>
        );
    }

    // Completion View
    if (currentIndex >= topics.length) {
        return null; // Handled by loadTopicData check, but for safety
    }

    const topic = topics[currentIndex];

    // No Questions Found View
    if (currentMcqData.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle size={48} className="text-orange-500 mb-4" />
                <h3 className="text-xl font-black text-slate-800 mb-2">{topic.name}</h3>
                <p className="text-slate-500 mb-6">No practice questions found for this topic.</p>
                <button onClick={() => setCurrentIndex(prev => prev + 1)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">Skip Topic</button>
            </div>
        );
    }

    // Topic Result View (Intermediate)
    if (showResult) {
        const percentage = Math.round((topicScore / currentMcqData.length) * 100);
        let statusColor = 'text-orange-500';
        let statusText = 'Average';
        if (percentage >= 80) { statusColor = 'text-green-600'; statusText = 'Excellent! 🌟'; }
        else if (percentage < 50) { statusColor = 'text-red-500'; statusText = 'Needs Work'; }
        else if (percentage >= 65) { statusColor = 'text-blue-500'; statusText = 'Strong 💪'; }

        return (
            <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in">
                <div className="mb-6 relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="60" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                        <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent"
                            className={statusColor.replace('text-', 'stroke-')}
                            strokeDasharray={2 * Math.PI * 60}
                            strokeDashoffset={2 * Math.PI * 60 * (1 - percentage/100)}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-slate-800">
                        {percentage}%
                    </div>
                </div>

                <h3 className="text-2xl font-black text-slate-800 mb-2">{topic.name}</h3>
                <p className={`text-lg font-bold mb-8 ${statusColor}`}>{statusText}</p>

                <button
                    onClick={handleNextTopic}
                    className="w-full max-w-xs bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                    Next Topic <ArrowRight size={20} />
                </button>
            </div>
        );
    }

    // MCQ Question View
    const question = currentMcqData[qIndex];
    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">{topic.name}</h3>
                    <p className="text-xs text-slate-400 font-bold">Question {qIndex + 1} / {currentMcqData.length}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
            </div>

            {/* Progress */}
            <div className="h-1 bg-slate-100 w-full">
                <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${((qIndex + 1) / currentMcqData.length) * 100}%` }}
                ></div>
            </div>

            {/* Question */}
            <div className="flex-1 overflow-y-auto p-6 pb-24">
                <h2 className="text-lg font-bold text-slate-800 mb-8 leading-relaxed">
                    {question.question}
                </h2>

                <div className="space-y-3">
                    {question.options.map((opt, idx) => {
                        const isSelected = answers[qIndex] === idx;
                        const isCorrect = idx === question.correctAnswer;
                        let btnClass = "border-slate-200 bg-white text-slate-600 hover:bg-slate-50";

                        if (answers[qIndex] !== undefined) {
                            if (isCorrect) btnClass = "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500";
                            else if (isSelected) btnClass = "border-red-500 bg-red-50 text-red-700";
                            else btnClass = "border-slate-100 opacity-50";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                disabled={answers[qIndex] !== undefined}
                                className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all flex items-center gap-3 ${btnClass}`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                                    answers[qIndex] !== undefined && isCorrect ? 'bg-green-500 border-green-500 text-white' :
                                    answers[qIndex] !== undefined && isSelected ? 'bg-red-500 border-red-500 text-white' :
                                    'bg-slate-100 border-slate-300 text-slate-500'
                                }`}>
                                    {['A','B','C','D'][idx]}
                                </div>
                                <span className="flex-1">{opt}</span>
                                {answers[qIndex] !== undefined && isCorrect && <CheckCircle size={18} className="text-green-600" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
