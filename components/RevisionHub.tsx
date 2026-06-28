import React, { useState, useEffect, useMemo } from 'react';
import { User, StudentTab, SystemSettings, TopicItem, TopicStatus } from '../types';
import { BrainCircuit, Clock, CheckCircle, TrendingUp, AlertTriangle, ArrowRight, BookOpen, AlertCircle, X, FileText, CheckSquare, Calendar, Zap, AlertCircle as AlertIcon, ChevronDown, ChevronUp, Loader2, Lock, Unlock, MessageSquare, Bot, PlayCircle, Star, Volume2, Mic, AlertOctagon, Crown, Layout, Trophy } from 'lucide-react';
import { generateCustomNotes } from '../services/groq';
import { saveAiInteraction, getChapterData, saveUserToLive } from '../firebase';
import { CustomAlert } from './CustomDialogs';
import { RevisionSession } from './RevisionSession';
import { TodayRevisionView } from './TodayRevisionView';
import { TodayMcqSession } from './TodayMcqSession';
import { TopicChart } from './TopicChart';
import { speakWithHighlight } from '../utils/ttsHighlighter';
import { LEVEL_UP_CONFIG } from '../constants';

interface Props {
    user: User;
    onTabChange: (tab: StudentTab) => void;
    settings?: SystemSettings;
    onNavigateContent?: (type: 'PDF' | 'MCQ', chapterId: string, topicName?: string, subjectName?: string) => void;
    onUpdateUser?: (user: User) => void;
}

const RevisionHubComponent: React.FC<Props> = ({ user, onTabChange, settings, onNavigateContent, onUpdateUser }) => {
    // --- LEVEL LOCK CHECK ---
    const userLevel = user.level || 1;
    const isLevelLocked = false;

    const [topics, setTopics] = useState<TopicItem[]>([]);
    const [hubMode, setHubMode] = useState<'FREE' | 'PREMIUM'>(user.subscriptionTier !== 'FREE' ? 'PREMIUM' : 'FREE');
    const [activeFilter, setActiveFilter] = useState<'TODAY' | 'WEAK' | 'AVERAGE' | 'STRONG' | 'EXCELLENT' | 'MISTAKES' | 'MCQ'>('TODAY');
    const [ttsRate, setTtsRate] = useState(1.0); // TTS Speed Control

    // Mistakes View State
    const [expandedMistakeTest, setExpandedMistakeTest] = useState<string | null>(null);
    const [expandedMistakeAttemptId, setExpandedMistakeAttemptId] = useState<string | null>(null);

    // UI State
    const [showYesterdayReport, setShowYesterdayReport] = useState(false);
    const [showTodayRevisionSession, setShowTodayRevisionSession] = useState(false);
    const [showTodayMcqSession, setShowTodayMcqSession] = useState(false);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, type: 'SUCCESS'|'ERROR'|'INFO', title?: string, message: string}>({isOpen: false, type: 'INFO', message: ''});

    // Memoize History Processing to prevent Infinite Loops / Auto Refresh
    const processedTopics = useMemo(() => {
        try {
            const history = user.mcqHistory || [];
            const topicMap = new Map<string, TopicItem>();

            // Sort history chronologically (oldest first)
            const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Tracking Map: UniqueID -> { status, score, lastMcqDate, lastRevDate }
            const trackingMap = new Map<string, {
                status: TopicStatus,
                score: number,
                lastMcqDate: string,
                lastRevDate: string | null
            }>();

            sortedHistory.forEach(result => {
                const isNoteRevision = (result as any).type === 'REVISION_NOTES';
                const attemptDate = result.date;

                // Helper to process a subtopic
                const processSubTopic = (name: string, reportedStatus?: TopicStatus, score?: number) => {
                    // Normalize ID
                    const uniqueId = `${result.chapterId}_${name.trim()}`;

                    let current = trackingMap.get(uniqueId) || {
                        status: 'AVERAGE',
                        score: 0,
                        lastMcqDate: '',
                        lastRevDate: null
                    };

                    if (isNoteRevision) {
                        current.lastRevDate = attemptDate;
                    } else {
                        current.lastMcqDate = attemptDate;
                        current.score = score !== undefined ? score : result.score;

                        if (reportedStatus) {
                            current.status = reportedStatus;
                        } else {
                            const percentage = result.totalQuestions > 0 ? (result.score / result.totalQuestions) * 100 : 0;
                            if (percentage >= 80) current.status = 'EXCELLENT';
                            else if (percentage >= 65) current.status = 'STRONG';
                            else if (percentage >= 50) current.status = 'AVERAGE';
                            else current.status = 'WEAK';
                        }
                    }
                    trackingMap.set(uniqueId, current);

                    // Calculate Due Dates
                    let nextRev: string | null = null;
                    let mcqDue: string | null = null;

                    const lastActionWasRevision = current.lastRevDate && new Date(current.lastRevDate).getTime() > new Date(current.lastMcqDate).getTime();

                    if (lastActionWasRevision) {
                        // Revised recently -> Waiting for MCQ
                        let days = 5;
                        if (current.status === 'WEAK') days = 2;
                        else if (current.status === 'STRONG' || current.status === 'EXCELLENT') days = 10;

                        const date = new Date(current.lastRevDate!);
                        date.setDate(date.getDate() + days);
                        mcqDue = date.toISOString();
                    } else {
                        // Took Test -> Waiting for Revision
                        let days = 3;
                        if (current.status === 'WEAK') days = 1;
                        else if (current.status === 'STRONG') days = 7;
                        else if (current.status === 'EXCELLENT') days = 30;

                        const date = new Date(current.lastMcqDate);
                        date.setDate(date.getDate() + days);
                        nextRev = date.toISOString();
                    }

                    topicMap.set(uniqueId, {
                        id: uniqueId,
                        chapterId: result.chapterId,
                        chapterName: result.chapterTitle || 'Unknown Chapter',
                        name: name,
                        score: current.score,
                        lastAttempt: result.date,
                        status: current.status,
                        nextRevision: nextRev,
                        mcqDueDate: mcqDue,
                        subjectName: result.subjectName,
                        isSubTopic: true
                    });
                };

                // 1. Try Parse Ultra Report
                if (result.ultraAnalysisReport) {
                    try {
                        const parsed = JSON.parse(result.ultraAnalysisReport);
                        if (parsed.topics && Array.isArray(parsed.topics)) {
                            parsed.topics.forEach((t: any) => {
                                let s: TopicStatus = 'AVERAGE';
                                if (t.status === 'WEAK') s = 'WEAK';
                                else if (t.status === 'STRONG') s = 'STRONG';
                                else if (t.status === 'EXCELLENT') s = 'EXCELLENT';
                                processSubTopic(t.name, s);
                            });
                            return;
                        }
                    } catch (e) {}
                }

                // 2. Fallback
                const percentage = result.totalQuestions > 0 ? (result.score / result.totalQuestions) * 100 : 0;
                let status: TopicStatus = 'AVERAGE';
                if (percentage >= 80) status = 'EXCELLENT';
                else if (percentage >= 65) status = 'STRONG';
                else if (percentage >= 50) status = 'AVERAGE';
                else status = 'WEAK';

                processSubTopic(result.chapterTitle || 'Chapter', status, percentage);
            });

            return Array.from(topicMap.values()).sort((a, b) => {
                // Smart AI Sorting Logic (Weighted Priority)
                const getPriority = (item: TopicItem) => {
                    const date = new Date(item.nextRevision || item.mcqDueDate || item.lastAttempt).getTime();
                    const now = Date.now();
                    const daysOverdue = Math.max(0, (now - date) / (1000 * 60 * 60 * 24));

                    // Weight 1: Score (Lower score = Higher Priority)
                    const scoreWeight = (100 - (item.score || 0)) * 2;

                    // Weight 2: Recency (More overdue = Higher Priority)
                    const timeWeight = daysOverdue * 10;

                    // Weight 3: Status Multiplier
                    let statusWeight = 0;
                    if (item.status === 'WEAK') statusWeight = 500;
                    else if (item.status === 'AVERAGE') statusWeight = 200;

                    return scoreWeight + timeWeight + statusWeight;
                };

                const pA = getPriority(a);
                const pB = getPriority(b);

                // Sort Descending (Higher Priority First)
                return pB - pA;
            });
        } catch (e) {
            console.error("Revision Hub Processing Error:", e);
            // Return empty array to prevent crash
            return [];
        }

    }, [user.mcqHistory]);

    useEffect(() => {
        setTopics(processedTopics);
    }, [processedTopics]);

    // --- HELPER FUNCTIONS ---

    const getCleanDisplayName = (topicName: string, mainTopicName: string, subjectName?: string) => {
        let cleanName = topicName.trim();

        // Helper to strip prefix case-insensitively
        const stripPrefix = (str: string, prefix: string) => {
            if (str.toLowerCase().startsWith(prefix.toLowerCase())) {
                let rest = str.substring(prefix.length);
                // Remove common separators
                return rest.replace(/^[\s\-:|–>]+/, '').trim();
            }
            return str;
        };

        if (subjectName) cleanName = stripPrefix(cleanName, subjectName);
        if (mainTopicName) cleanName = stripPrefix(cleanName, mainTopicName);

        return cleanName || topicName;
    };

    // Calculate Today's Counts (Midnight Comparison)
    const now = new Date();
    const todayStr = now.toDateString();

    // AUTO AI PLAN (Simulated Logic based on Weakest Topics)
    const handleGenerateAiPlan = () => {
        const weakTopics = topics.filter(t => t.status === 'WEAK').sort((a, b) => a.score - b.score).slice(0, 5);
        if (weakTopics.length === 0) {
            setAlertConfig({isOpen: true, type: 'INFO', title: 'You are doing great!', message: 'No critical weak topics found to schedule.'});
            return;
        }

        let planMessage = "📅 **Recommended Study Plan**\n\n";
        weakTopics.forEach((t, i) => {
            planMessage += `${i+1}. **${t.name}** (${t.subjectName})\n   - Review Notes (15 mins)\n   - Practice 10 MCQs\n\n`;
        });

        setAlertConfig({isOpen: true, type: 'INFO', title: 'AI Study Plan Generated', message: planMessage});
    };

    const pendingNotes = topics.filter(t => t.nextRevision && new Date(t.nextRevision) <= now);
    const pendingMcqs = topics.filter(t => t.mcqDueDate && new Date(t.mcqDueDate) <= now);

    const completedToday = useMemo(() => {
        return (user.mcqHistory || [])
            .filter(h => new Date(h.date).toDateString() === todayStr && (h as any).type === 'REVISION_NOTES')
            .map(h => {
                let name = h.chapterTitle || 'Topic';
                if (h.ultraAnalysisReport) {
                    try {
                        const parsed = JSON.parse(h.ultraAnalysisReport);
                        if (parsed.topics && parsed.topics.length > 0) name = parsed.topics[0].name;
                    } catch(e) {}
                }
                return {
                    name,
                    chapterId: h.chapterId,
                    chapterTitle: h.chapterTitle,
                    subjectName: h.subjectName
                };
            });
    }, [user.mcqHistory, todayStr]);

    // WEEKLY BREAKDOWN GROUPING (New Request)
    const getWeeklyBreakdown = (filteredTopics: TopicItem[]) => {
        const weeks: Record<string, TopicItem[]> = {
            'Week 1': [],
            'Week 2': [],
            'Week 3': [],
            'Week 4': [],
            'Week 5+': []
        };

        const nowTime = new Date().getTime();

        // Sort by Score Ascending (Weakest First)
        const sortedTopics = [...filteredTopics].sort((a, b) => a.score - b.score);

        sortedTopics.forEach(t => {
            const dueDate = t.nextRevision || t.mcqDueDate || t.lastAttempt; // Fallback to last attempt if no due date
            if (!dueDate) return;

            const dueTime = new Date(dueDate).getTime();
            const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));

            // Grouping Logic
            if (diffDays <= 7) weeks['Week 1'].push(t); // Includes Overdue
            else if (diffDays <= 14) weeks['Week 2'].push(t);
            else if (diffDays <= 21) weeks['Week 3'].push(t);
            else if (diffDays <= 28) weeks['Week 4'].push(t);
            else weeks['Week 5+'].push(t);
        });

        // Clean up empty weeks
        Object.keys(weeks).forEach(key => {
            if (weeks[key].length === 0) delete weeks[key];
        });

        return weeks;
    };

    // TTS LOGIC (Updated for Weekly View)
    const handleReadPage = (weeks: Record<string, TopicItem[]>) => {
        let textToSpeak = "";

        try {
            Object.keys(weeks).forEach(week => {
                textToSpeak += `${week}. `;
                weeks[week].forEach(t => {
                     textToSpeak += `${getCleanDisplayName(t.name, t.chapterName, t.subjectName)}. Score ${Math.round(t.score)} percent. `;
                });
            });

            if (textToSpeak) {
                console.log("Reading Page Content:", textToSpeak);
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.rate = ttsRate; // USE STATE RATE

                // Voice Selection (Prefer Google/Microsoft English)
                const voices = window.speechSynthesis.getVoices();
                const preferredVoice = voices.find(v =>
                    v.name.includes('Google US English') ||
                    v.name.includes('Microsoft Zira') ||
                    v.lang.startsWith('en')
                );
                if (preferredVoice) utterance.voice = preferredVoice;

                utterance.onerror = (e) => console.error("TTS Error:", e);
                window.speechSynthesis.speak(utterance);
            } else {
                setAlertConfig({isOpen: true, type: 'INFO', message: "Nothing to read on this page."});
            }
        } catch (e) {
            console.error("TTS Preparation Failed:", e);
            setAlertConfig({isOpen: true, type: 'ERROR', message: "Failed to start audio reader."});
        }
    };

    // SUBSCRIPTION LOGIC
    const isFreeUser = user.subscriptionTier === 'FREE';
    // For Hub Access logic:
    // Free Mode: Visible but restricted features.
    // Premium Mode: Visible with all features.
    // Only blocked if Level System locks it entirely.

    const handleTopicClick = (t: TopicItem) => {
        if (hubMode === 'FREE') {
            setAlertConfig({
                isOpen: true,
                type: 'INFO',
                title: 'Free Mode Restriction',
                message: `📖 In Free Mode, we tell you WHAT to study ("${t.name}").\nTo access deep content, analysis, and instant revision tools, switch to Premium Mode.`
            });
            return;
        }

        // Logic for Basic User (Sundays Only) - Preserved if relevant, but user wants clear Free/Premium split now.
        // Assuming Premium Mode covers Basic/Ultra logic.
        if (user.subscriptionLevel === 'BASIC' && now.getDay() !== 0 && hubMode === 'PREMIUM') {
             setAlertConfig({
                isOpen: true,
                type: 'INFO',
                title: 'Basic Plan Restriction',
                message: 'Basic users can only access Premium Revision Content on Sundays. Upgrade to Ultra for daily access.'
            });
            return;
        }

        if (onNavigateContent) {
            onNavigateContent('PDF', t.chapterId, t.name, t.subjectName);
        }
    };

     const handleUndoRevision = (topicName: string, chapterId: string) => {
        const history = [...(user.mcqHistory || [])];
        const entryIndex = history.findIndex(h => {
            const isToday = new Date(h.date).toDateString() === todayStr;
            const isRevision = (h as any).type === 'REVISION_NOTES';
            let topicMatch = false;
            if (h.ultraAnalysisReport) {
                try {
                    const parsed = JSON.parse(h.ultraAnalysisReport);
                    if (parsed.topics?.some((t: any) => t.name === topicName)) topicMatch = true;
                } catch(e) {}
            } else {
                if (h.chapterTitle === topicName) topicMatch = true;
            }
            return isToday && isRevision && topicMatch;
        });

        if (entryIndex !== -1) {
            history.splice(entryIndex, 1);
            const updatedUser = { ...user, mcqHistory: history };
            if (onUpdateUser) {
                onUpdateUser(updatedUser);
                saveUserToLive(updatedUser);
                setAlertConfig({isOpen: true, type: 'SUCCESS', message: `Undid revision for ${topicName}`});
            }
        }
    };

    // LEVEL LOCK VIEW
    if (isLevelLocked) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] p-6 text-center animate-in fade-in">
                <div className="bg-slate-100 p-6 rounded-full mb-6 relative">
                    <BrainCircuit size={64} className="text-slate-400" />
                    <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-2 rounded-full border-4 border-white">
                        <Lock size={20} />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Revision Hub Locked</h2>
                <p className="text-slate-500 mb-6 max-w-xs">
                    This advanced feature unlocks at <span className="font-bold text-indigo-600">Level {requiredLevel}</span>.
                    Keep learning to level up!
                </p>
                <div className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase">Current Level</p>
                    <p className="text-3xl font-black text-slate-800">{userLevel} <span className="text-sm text-slate-400 font-medium">/ {requiredLevel}</span></p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 p-4 animate-in fade-in relative">
            {/* MODE SWITCHER */}
            <div className="flex justify-center mb-4">
                <div className="bg-slate-100 p-1 rounded-full flex gap-1 shadow-inner">
                    <button
                        onClick={() => setHubMode('FREE')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                            hubMode === 'FREE' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Layout size={14} /> Free Hub
                    </button>
                    <button
                        onClick={() => setHubMode('PREMIUM')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                            hubMode === 'PREMIUM' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow text-white' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Crown size={14} /> Premium Hub
                    </button>
                </div>
            </div>

            {/* STICKY HEADER */}
            <div className="flex items-center justify-between mb-4 sticky top-0 z-30 bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <BrainCircuit className={hubMode === 'PREMIUM' ? "text-indigo-600" : "text-slate-600"} />
                    {hubMode === 'PREMIUM' ? 'Premium Hub' : 'Revision Hub'}
                </h2>
                <div className="flex gap-2">
                     {activeFilter === 'TODAY' && hubMode === 'PREMIUM' && (
                        <button
                            onClick={handleGenerateAiPlan}
                            className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-purple-200 flex items-center gap-2"
                        >
                            <Zap size={14} /> AI Plan
                        </button>
                     )}
                     {activeFilter !== 'TODAY' && (
                        <>
                            <button
                                onClick={() => {
                                    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
                                    const nextIdx = (rates.indexOf(ttsRate) + 1) % rates.length;
                                    setTtsRate(rates[nextIdx]);
                                }}
                                className="bg-slate-100 text-slate-700 px-2 py-1.5 rounded-xl text-[10px] font-bold shadow-sm hover:bg-slate-200 flex items-center gap-1"
                                title="Change Speed"
                            >
                                <Zap size={12} /> {ttsRate}x
                            </button>
                            <button
                                onClick={() => {
                                    const weeklyData = getWeeklyBreakdown(topics.filter(t => t.status === activeFilter));
                                    handleReadPage(weeklyData);
                                }}
                                className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-200 flex items-center gap-2"
                            >
                                <Mic size={14} /> Read Page
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setShowYesterdayReport(!showYesterdayReport)}
                        className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Clock size={14} /> Report
                    </button>
                </div>
            </div>

            {/* DAILY BRIEFING (Restricted in Free Mode) */}
             <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3 relative overflow-hidden z-10">
                <div className="absolute -right-4 -bottom-4 opacity-10 text-indigo-900 rotate-12">
                    <MessageSquare size={100} />
                </div>
                <div className="bg-white p-2 rounded-full shadow-sm text-indigo-600 z-10">
                    <Bot size={24} />
                </div>
                <div className="z-10">
                    <p className="text-xs font-bold text-indigo-900 mb-1">Daily Briefing</p>
                    <p className="text-sm text-indigo-800 leading-relaxed">
                        Hello, <span className="font-bold">{user.name}</span>! 👋 <br/>
                        {hubMode === 'FREE' ? (
                            <span>Here is your revision list for today. Upgrade to Premium for AI analysis.</span>
                        ) : (
                            <span>You have <span className="font-black bg-white px-1 rounded text-indigo-600">{pendingNotes.length} notes</span> to read and <span className="font-black bg-white px-1 rounded text-purple-600">{pendingMcqs.length} MCQs</span> pending.</span>
                        )}
                    </p>
                </div>
            </div>

            {/* TABS (Filtered based on Hub Mode) */}
             <div className="grid grid-cols-5 gap-2 mb-6 bg-slate-100 p-1 rounded-xl relative z-10">
                {[
                    { id: 'TODAY', label: 'Today', icon: Calendar, mode: 'BOTH' },
                    { id: 'MCQ', label: 'MCQ', icon: CheckSquare, mode: 'PREMIUM' },
                    { id: 'MISTAKES', label: 'Mistakes', icon: AlertOctagon, mode: 'PREMIUM' },
                    { id: 'WEAK', label: 'Weak', icon: AlertIcon, mode: 'BOTH' },
                    { id: 'AVERAGE', label: 'Avg', icon: TrendingUp, mode: 'BOTH' },
                    { id: 'STRONG', label: 'Strong', icon: CheckCircle, mode: 'BOTH' },
                ].filter(t => t.mode === 'BOTH' || t.mode === hubMode).map(tab => {
                    const isActive = activeFilter === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id as any)}
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                                isActive ? 'bg-white shadow-sm text-blue-600 scale-105' : 'text-slate-500 hover:bg-white/50'
                            }`}
                        >
                            <Icon size={16} className={isActive ? 'mb-1 text-blue-600' : 'mb-1 text-slate-400'} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

             {/* EXCELLENT TAB (Premium Only) */}
            {hubMode === 'PREMIUM' && (
                <div className="flex justify-end mb-4 relative z-10">
                     <button
                        onClick={() => setActiveFilter('EXCELLENT')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                            activeFilter === 'EXCELLENT' ? 'bg-green-100 text-green-700 border-2 border-green-200 shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <Star size={14} className={activeFilter === 'EXCELLENT' ? 'fill-green-700 text-green-700' : 'text-slate-400'} />
                        30-Day Mastery
                    </button>
                </div>
            )}

            {/* SESSIONS */}
            {showTodayRevisionSession && hubMode === 'PREMIUM' && (
                <TodayRevisionView
                    user={user}
                    topics={pendingNotes}
                    onClose={() => setShowTodayRevisionSession(false)}
                    onComplete={(completed) => {
                        const newHistoryEntries = completed.map(t => ({
                            id: `rev-note-${Date.now()}-${t.id}`,
                            userId: user.id,
                            chapterId: t.chapterId,
                            subjectName: t.subjectName || 'Revision',
                            chapterTitle: t.chapterName,
                            date: new Date().toISOString(),
                            type: 'REVISION_NOTES',
                            score: t.score,
                            totalQuestions: 0,
                            correctCount: 0,
                            wrongCount: 0,
                            totalTimeSeconds: 0,
                            averageTimePerQuestion: 0,
                            performanceTag: 'GOOD' as any,
                            ultraAnalysisReport: JSON.stringify({
                                topics: [{ name: t.name, status: t.status }]
                            })
                        }));
                         // @ts-ignore
                        const updatedHistory = [...(user.mcqHistory || []), ...newHistoryEntries];
                        const updatedUser = { ...user, mcqHistory: updatedHistory };
                        if (onUpdateUser) {
                            onUpdateUser(updatedUser);
                            saveUserToLive(updatedUser);
                        }
                        setShowTodayRevisionSession(false);
                    }}
                />
            )}

             {showTodayMcqSession && hubMode === 'PREMIUM' && (
                <TodayMcqSession
                    user={user}
                    topics={pendingMcqs}
                    onClose={() => setShowTodayMcqSession(false)}
                    onUpdateUser={onUpdateUser}
                />
            )}

            <CustomAlert
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(prev => ({...prev, isOpen: false}))}
            />

            {/* --- MAIN CONTENT AREA --- */}

            {/* 1. TODAY VIEW */}
            {activeFilter === 'TODAY' && (
                 <div className="relative z-10 space-y-4">
                    {/* NOTES SECTION */}
                    <div className="bg-blue-50/50 rounded-3xl border border-blue-100 p-5">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                <BookOpen className="text-blue-600" size={20} /> Pending Notes
                            </h3>
                            {pendingNotes.length > 0 && hubMode === 'PREMIUM' && (
                                <button
                                    onClick={() => {
                                        if (user.subscriptionLevel === 'BASIC' && now.getDay() !== 0) {
                                            setAlertConfig({isOpen: true, type: 'INFO', title: 'Sunday Only', message: 'Basic Plan allows revision sessions only on Sundays.'});
                                        } else {
                                            setShowTodayRevisionSession(true);
                                        }
                                    }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <PlayCircle size={14} /> Start Revision
                                </button>
                            )}
                            {/* FREE MODE INDICATOR */}
                            {hubMode === 'FREE' && pendingNotes.length > 0 && (
                                <div className="text-[10px] font-bold text-slate-400 italic bg-slate-100 px-2 py-1 rounded">
                                    Self Study List
                                </div>
                            )}
                        </div>
                         {pendingNotes.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs font-bold">No notes due.</div>
                        ) : (
                             <div className="space-y-3">
                                {pendingNotes.map((t, i) => (
                                    <div key={i} className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-blue-500 font-bold uppercase mb-0.5">{t.subjectName}</p>
                                            <h4 className="font-bold text-slate-800 text-sm">{getCleanDisplayName(t.name, t.chapterName, t.subjectName)}</h4>
                                        </div>
                                         <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${
                                            t.status === 'WEAK' ? 'bg-red-100 text-red-600' :
                                            t.status === 'STRONG' ? 'bg-blue-100 text-blue-600' :
                                            t.status === 'EXCELLENT' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                        }`}>
                                            {t.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COMPLETED TODAY (Premium Only) */}
                     {completedToday.length > 0 && hubMode === 'PREMIUM' && (
                        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5">
                            <h3 className="font-black text-slate-600 text-sm flex items-center gap-2 mb-3">
                                <CheckCircle size={16} /> Completed Today
                            </h3>
                            <div className="space-y-2">
                                {completedToday.map((t, i) => (
                                    <div key={i} className="bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity">
                                        <div>
                                            <h4 className="font-bold text-slate-700 text-xs">{getCleanDisplayName(t.name, t.chapterTitle || '', t.subjectName)}</h4>
                                        </div>
                                        <button
                                            onClick={() => handleUndoRevision(t.name, t.chapterId)}
                                            className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 font-bold hover:bg-red-100 flex items-center gap-1"
                                        >
                                            Undo
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
            )}

            {/* 2. FILTERED VIEWS (WEEKLY BREAKDOWN) */}
            {activeFilter !== 'TODAY' && activeFilter !== 'MCQ' && activeFilter !== 'MISTAKES' && (
                <div className="space-y-6 relative z-10">
                     <TopicChart topics={topics.filter(t => t.status === activeFilter)} type={activeFilter as any} />

                     {(() => {
                        const relevantTopics = topics.filter(t => t.status === activeFilter);
                        const weeklyData = getWeeklyBreakdown(relevantTopics);
                        const weekKeys = Object.keys(weeklyData);

                        if (weekKeys.length === 0) {
                            return <div className="text-center py-12 text-slate-400 font-bold">No topics found.</div>;
                        }

                        return weekKeys.map(week => (
                            <div key={week} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm mb-4">
                                {/* WEEK HEADER */}
                                <div className="bg-slate-100 p-3 border-b border-slate-200">
                                    <h4 className="font-black text-slate-700 flex items-center gap-2 text-base uppercase tracking-wide">
                                        <Calendar size={18} className="text-indigo-500" /> {week}
                                    </h4>
                                </div>

                                <div className="p-4 space-y-4">
                                    {weeklyData[week].map((t, i) => {
                                        const displayName = getCleanDisplayName(t.name, t.chapterName, t.subjectName);
                                        const percent = Math.round(t.score || 0);

                                        // Colors based on score/status
                                        let barColor = "bg-orange-500";
                                        let textColor = "text-orange-600";
                                        if (percent >= 80) { barColor = "bg-green-500"; textColor = "text-green-600"; }
                                        else if (percent < 50) { barColor = "bg-red-500"; textColor = "text-red-600"; }

                                        // Subject Badge Color
                                        let badgeColor = "bg-slate-100 text-slate-600";
                                        const sub = (t.subjectName || '').toLowerCase();
                                        if (sub.includes('math')) badgeColor = "bg-blue-100 text-blue-600";
                                        else if (sub.includes('science')) badgeColor = "bg-purple-100 text-purple-600";
                                        else if (sub.includes('social')) badgeColor = "bg-orange-100 text-orange-600";

                                        return (
                                            <div
                                                key={i}
                                                onClick={() => handleTopicClick(t)}
                                                className={`group ${hubMode === 'PREMIUM' ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                                            >
                                                <div className="flex justify-between items-end mb-1.5">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${badgeColor}`}>
                                                            {t.subjectName ? t.subjectName.substring(0, 3) : 'GEN'}
                                                        </span>
                                                        <span className="font-bold text-slate-700 text-xs uppercase truncate max-w-[180px] group-hover:text-indigo-600 transition-colors">
                                                            {displayName}
                                                        </span>
                                                        {hubMode === 'FREE' && <Lock size={10} className="text-slate-400 shrink-0" />}
                                                    </div>
                                                    <span className={`text-xs font-black ${textColor}`}>
                                                        {percent}%
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                                    <div
                                                        className={`h-full ${barColor} transition-all duration-1000 ease-out shadow-sm`}
                                                        style={{ width: `${Math.max(5, percent)}%` }} // Min width for visibility
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ));
                     })()}
                </div>
            )}

            {/* 3. MCQ VIEW */}
            {activeFilter === 'MCQ' && (
                <div className="space-y-4 relative z-10">
                     {topics.filter(t => t.mcqDueDate && new Date(t.mcqDueDate) > now).length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-bold">No upcoming MCQs locked.</div>
                    ) : (
                        topics.filter(t => t.mcqDueDate && new Date(t.mcqDueDate) > now).map((t, i) => {
                             const diff = Math.ceil((new Date(t.mcqDueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                             return (
                                <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 opacity-75">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-slate-700">{getCleanDisplayName(t.name, t.chapterName, t.subjectName)}</h4>
                                            <p className="text-xs text-slate-400">{t.chapterName}</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200">
                                            <Lock size={12} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-500">{diff} Days</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* 4. MISTAKES VIEW */}
            {activeFilter === 'MISTAKES' && (
                <div className="space-y-4 relative z-10">
                    {(() => {
                        // Filter for mistakes
                        const mistakesHistory = (user.mcqHistory || [])
                            .filter(h => h.wrongQuestions && h.wrongQuestions.length > 0)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                        if (mistakesHistory.length === 0) {
                            return (
                                <div className="text-center py-12 text-slate-400 font-bold">
                                    <CheckCircle size={48} className="mx-auto text-green-200 mb-4" />
                                    No mistakes recorded yet! Great job!
                                </div>
                            );
                        }

                        // Group by Test Name
                        const grouped: Record<string, typeof mistakesHistory> = {};
                        mistakesHistory.forEach(h => {
                             const name = h.chapterTitle || 'Unknown Test';
                             if (!grouped[name]) grouped[name] = [];
                             grouped[name].push(h);
                        });

                        return Object.keys(grouped).map(testName => (
                            <div key={testName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                {/* LEVEL 1: Test Name Header */}
                                <div
                                    onClick={() => setExpandedMistakeTest(expandedMistakeTest === testName ? null : testName)}
                                    className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    <div>
                                        <h4 className="font-bold text-slate-700 text-sm">{testName}</h4>
                                        <p className="text-xs text-slate-400">{grouped[testName].length} Attempts</p>
                                    </div>
                                    {expandedMistakeTest === testName ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                </div>

                                {/* LEVEL 2: Attempts List */}
                                {expandedMistakeTest === testName && (
                                    <div className="bg-slate-50/50">
                                        {grouped[testName].map((attempt, idx) => (
                                            <div key={attempt.id || idx} className="border-b border-slate-100 last:border-0">
                                                <div
                                                    onClick={() => setExpandedMistakeAttemptId(expandedMistakeAttemptId === attempt.id ? null : attempt.id)}
                                                    className="p-3 flex justify-between items-center cursor-pointer hover:bg-white transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-lg ${
                                                            attempt.score >= 80 ? 'bg-green-100 text-green-600' :
                                                            attempt.score < 50 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                                        }`}>
                                                            <AlertOctagon size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-700">
                                                                {new Date(attempt.date).toLocaleDateString()} at {new Date(attempt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">
                                                                Score: {Math.round(attempt.totalQuestions > 0 ? (attempt.score / attempt.totalQuestions) * 100 : 0)}% • {attempt.wrongQuestions?.length || 0} Mistakes
                                                            </p>
                                                        </div>
                                                    </div>
                                                     {expandedMistakeAttemptId === attempt.id ? <ChevronUp size={14} className="text-slate-300" /> : <ChevronDown size={14} className="text-slate-300" />}
                                                </div>

                                                {/* LEVEL 3: Mistakes Detail */}
                                                {expandedMistakeAttemptId === attempt.id && (
                                                    <div className="bg-red-50/30 p-4 space-y-4 border-t border-red-50 inset-shadow-sm">
                                                        {attempt.wrongQuestions?.map((q, qIdx) => (
                                                            <div key={qIdx} className="bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                                                                <div className="flex gap-2 mb-2">
                                                                    <span className="text-xs font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded h-fit">Q{q.qIndex + 1}</span>
                                                                    <p className="text-xs font-bold text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question }} />
                                                                </div>

                                                                <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                                                                    <p className="text-[10px] font-bold text-green-700 mb-0.5">Correct Answer:</p>
                                                                    <p className="text-xs text-green-800 font-medium" dangerouslySetInnerHTML={{ __html: String(q.correctAnswer) }} />
                                                                </div>

                                                                {q.explanation && (
                                                                    <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                                        <p className="text-[10px] font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                                                                            <BookOpen size={10} /> Explanation
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ));
                    })()}
                </div>
            )}

        </div>
    );
};

export const RevisionHub = React.memo(RevisionHubComponent);
