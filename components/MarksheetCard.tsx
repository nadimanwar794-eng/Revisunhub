import React, { useState, useEffect } from 'react';
// Sync check
import { MCQResult, User, SystemSettings } from '../types';
import { X, Share2, ChevronLeft, ChevronRight, Download, FileSearch, Grid, CheckCircle, XCircle, Clock, Award, BrainCircuit, Play, StopCircle, BookOpen, Target, Zap, BarChart3, ListChecks, FileText, LayoutTemplate, TrendingUp, Lightbulb, ExternalLink, RefreshCw, Lock, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { generateUltraAnalysis } from '../services/groq';
import { saveUniversalAnalysis, saveUserToLive, saveAiInteraction, getChapterData } from '../firebase';
import ReactMarkdown from 'react-markdown';
import { speakText, stopSpeech, getCategorizedVoices, stripHtml } from '../utils/textToSpeech';
import { CustomConfirm } from './CustomDialogs'; // Import CustomConfirm
import { SpeakButton } from './SpeakButton';
import { renderMathInHtml } from '../utils/mathUtils';

interface Props {
  result: MCQResult;
  user: User;
  settings?: SystemSettings;
  onClose: () => void;
  onViewAnalysis?: (cost: number) => void;
  onPublish?: () => void;
  questions?: any[]; 
  onUpdateUser?: (user: User) => void;
  initialView?: 'ANALYSIS' | 'RECOMMEND';
  onLaunchContent?: (content: any) => void;
  mcqMode?: 'FREE' | 'PREMIUM'; // NEW: Mode Check
}

export const MarksheetCard: React.FC<Props> = ({ result, user, settings, onClose, onViewAnalysis, onPublish, questions, onUpdateUser, initialView, onLaunchContent, mcqMode = 'FREE' }) => {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'OFFICIAL_MARKSHEET' | 'SOLUTION' | 'OMR' | 'PREMIUM_ANALYSIS' | 'RECOMMEND'>(
      mcqMode === 'PREMIUM' ? 'SOLUTION' : 'OFFICIAL_MARKSHEET'
  );
  
  // FREE MODE ANALYSIS LOCK
  const [isAnalysisUnlocked, setIsAnalysisUnlocked] = useState(mcqMode === 'PREMIUM');

  // ULTRA ANALYSIS STATE
  const [ultraAnalysisResult, setUltraAnalysisResult] = useState('');
  const [isLoadingUltra, setIsLoadingUltra] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [viewingNote, setViewingNote] = useState<any>(null); // New state for HTML Note Modal
  const [showAnalysisSelection, setShowAnalysisSelection] = useState(false); // Modal for Free vs Premium

  const generateLocalAnalysis = () => {
      // Calculate weak/strong based on topicStats
      const topics = Object.keys(topicStats).map(t => {
          const s = topicStats[t];
          let status = 'AVERAGE';
          if (s.percent >= 80) status = 'STRONG';
          else if (s.percent < 50) status = 'WEAK';

          return {
              name: t,
              status,
              actionPlan: status === 'WEAK' ? 'Focus on basic concepts and practice more questions from this topic.' : 'Good job! Keep revising to maintain speed.',
              studyMode: status === 'WEAK' ? 'DEEP_STUDY' : 'QUICK_REVISION'
          };
      });

      // const weakTopics = topics.filter(t => t.status === 'WEAK').map(t => t.name);

      return JSON.stringify({
          motivation: percentage > 80 ? "Excellent Performance! You are on track." : "Keep working hard. You can improve!",
          topics: topics,
      });
  };
  
  // TTS State
  const [voices, setVoices] = useState<{hindi: SpeechSynthesisVoice[], indianEnglish: SpeechSynthesisVoice[], others: SpeechSynthesisVoice[]}>({hindi: [], indianEnglish: [], others: []});
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  
  // TTS Playlist State
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  const stopPlaylist = () => {
      setIsPlayingAll(false);
      setCurrentTrack(0);
      stopSpeech();
  };

  useEffect(() => {
    if (isPlayingAll && currentTrack < playlist.length) {
        speakText(
            playlist[currentTrack],
            selectedVoice,
            speechRate,
            'hi-IN',
            undefined, // onStart
            () => { // onEnd
                if (isPlayingAll) {
                    setCurrentTrack(prev => prev + 1);
                }
            }
        ).catch(() => setIsPlayingAll(false));
    } else if (currentTrack >= playlist.length && isPlayingAll) {
        setIsPlayingAll(false);
        setCurrentTrack(0);
    }
  }, [currentTrack, isPlayingAll, playlist, selectedVoice, speechRate]);

  // Stop Playlist on Tab Change
  useEffect(() => {
      stopPlaylist();
  }, [activeTab]);

  // Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({isOpen: false, title: '', message: '', onConfirm: () => {}});

  const handleRetryMistakes = () => {
      // Logic Update: Use result.wrongQuestions directly if available, otherwise filter from 'questions'
      let wrongQs = result.wrongQuestions || [];

      // Fallback if wrongQuestions is empty but OMR data exists (Legacy compatibility)
      if (wrongQs.length === 0 && questions) {
          wrongQs = questions.filter((q, i) => {
              const omr = result.omrData?.find(d => d.qIndex === i);
              return omr && omr.selected !== -1 && omr.selected !== q.correctAnswer;
          });
      }

      if (!wrongQs || wrongQs.length === 0) {
          alert("No mistakes to retry! Great job.");
          return;
      }

      if (onLaunchContent) {
          onLaunchContent({
              id: `RETRY_${result.id}`,
              title: `Retry Mistakes: ${result.chapterTitle}`,
              type: 'MCQ_SIMPLE',
              mcqData: wrongQs,
              subtitle: 'Mistake Review Session'
          });
      }
  };

  // RECOMMENDATION STATE
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [topicStats, setTopicStats] = useState<Record<string, {total: number, correct: number, percent: number}>>({});

  useEffect(() => {
      if (questions) {
          const stats: Record<string, {total: number, correct: number, percent: number}> = {};
          questions.forEach((q, idx) => {
              const topic = q.topic || 'General';
              if (!stats[topic]) stats[topic] = { total: 0, correct: 0, percent: 0 };
              stats[topic].total++;

              const omr = result.omrData?.find(d => d.qIndex === idx);
              if (omr && omr.selected === q.correctAnswer) {
                  stats[topic].correct++;
              }
          });

          Object.keys(stats).forEach(t => {
              stats[t].percent = Math.round((stats[t].correct / stats[t].total) * 100);
          });
          setTopicStats(stats);
      }
  }, [questions]);

  // Handle Initial View Logic
  useEffect(() => {
      if (initialView === 'RECOMMEND' && questions && questions.length > 0 && isAnalysisUnlocked) {
          // Allow state to settle, then open
          setTimeout(() => {
              handleRecommend();
          }, 500);
      }
  }, [initialView, questions, isAnalysisUnlocked]);

  // Auto-Load Recommendations on Tab Change
  useEffect(() => {
      // Only fetch if data is missing. Do NOT open modal automatically.
      if ((activeTab === 'RECOMMEND' || activeTab === 'PREMIUM_ANALYSIS') && questions && questions.length > 0 && recommendations.length === 0 && isAnalysisUnlocked) {
          handleRecommend(false); // Pass false to suppress modal
      }
  }, [activeTab, questions, isAnalysisUnlocked]);

  const handleRecommend = async (openModal: boolean = false) => {
      if (!isAnalysisUnlocked) return;
      setRecLoading(true);

      // Identify weak topics (Percent < 70)
      const weakTopics = Object.keys(topicStats).filter(t => topicStats[t].percent < 70);

      const streamKey = (result.classLevel === '11' || result.classLevel === '12') && user.stream ? `-${user.stream}` : '';
      const key = `nst_content_${user.board || 'CBSE'}_${result.classLevel || '10'}${streamKey}_${result.subjectName}_${result.chapterId}`;

      // 1. Fetch Chapter Content (For Free/Premium Notes)
      let chapterData: any = {};
      try {
          chapterData = await getChapterData(key);
      } catch (e) { console.error(e); }

      // 2. Fetch Universal Notes (Recommended List)
      let universalData: any = {};
      try {
          universalData = await getChapterData('nst_universal_notes');
      } catch (e) { console.error(e); }

      const recs: any[] = [];

      // A) Free Recommendations (From Chapter HTML)
      const freeHtml = chapterData?.freeNotesHtml || chapterData?.schoolFreeNotesHtml;
      const extractedTopics: string[] = [];
      if (freeHtml) {
           try {
               const doc = new DOMParser().parseFromString(freeHtml, 'text/html');
               const headers = doc.querySelectorAll('h1, h2, h3, h4');
               headers.forEach(h => {
                   if(h.textContent && h.textContent.length > 3) extractedTopics.push(h.textContent.trim());
               });
           } catch(e) {}
      }

      // Iterate Weak Topics to find matches for EACH
      weakTopics.forEach(wt => {
          const wtLower = wt.trim().toLowerCase();

          // 1. Check Free Notes HTML Headers
          if (extractedTopics.length > 0) {
              const matchedHeader = extractedTopics.find(et =>
                  et.toLowerCase().includes(wtLower) || wtLower.includes(et.toLowerCase())
              );
              if (matchedHeader) {
                  recs.push({
                       title: matchedHeader,
                       topic: wt, // Map strictly to Weak Topic Name
                       type: 'FREE_NOTES_LINK',
                       isPremium: false,
                       url: 'FREE_CHAPTER_NOTES',
                       access: 'FREE'
                  });
              }
          }

          // 2. Check Universal Notes
          if (universalData && universalData.notesPlaylist) {
              const matches = universalData.notesPlaylist.filter((n: any) =>
                  n.title.toLowerCase().includes(wtLower) ||
                  (n.topic && n.topic.toLowerCase().includes(wtLower)) ||
                  wtLower.includes(n.topic?.toLowerCase() || '')
              );
              recs.push(...matches.map((n: any) => ({
                  ...n,
                  topic: wt, // Map strictly
                  type: 'UNIVERSAL_NOTE',
                  isPremium: n.access === 'PREMIUM' || n.type === 'PDF'
              })));
          }

          // 3. Check Chapter Topic Notes
          if (chapterData && chapterData.topicNotes) {
              const matches = chapterData.topicNotes.filter((n: any) =>
                  (n.topic && n.topic.toLowerCase().trim() === wtLower) ||
                  (n.topic && n.topic.toLowerCase().includes(wtLower)) ||
                  (n.topic && wtLower.includes(n.topic.toLowerCase()))
              );
              recs.push(...matches.map((n: any) => ({
                  ...n,
                  topic: wt, // Map strictly
                  type: 'TOPIC_NOTE',
                  access: n.isPremium ? 'PREMIUM' : 'FREE',
                  isPremium: n.isPremium
              })));
          }
      });

      // Deduplicate by title
      const uniqueRecs = recs.filter((v,i,a)=>a.findIndex(v2=>(v2.title===v.title && v2.topic === v.topic))===i);

      setRecommendations(uniqueRecs);
      setRecLoading(false);
  };

  const ITEMS_PER_PAGE = 50;

  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  
  const omrData = result.omrData || [];
  const hasOMR = omrData.length > 0;
  const totalPages = Math.ceil(omrData.length / ITEMS_PER_PAGE);
  const currentData = omrData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const devName = settings?.footerText || 'Nadim Anwar'; // Configurable via Admin

  useEffect(() => {
    if (initialView === 'ANALYSIS' || result.ultraAnalysisReport) {
        if (result.ultraAnalysisReport) {
             setUltraAnalysisResult(result.ultraAnalysisReport);
        }
    }
  }, [initialView, result.ultraAnalysisReport]);

  useEffect(() => {
      getCategorizedVoices().then(v => {
          setVoices(v);
          const preferred = v.hindi[0] || v.indianEnglish[0] || v.others[0];
          if (preferred) setSelectedVoice(preferred);
      });
  }, []);

  const handleDownload = async () => {
      let elementId = 'marksheet-content'; 
      if (activeTab === 'OFFICIAL_MARKSHEET') elementId = 'marksheet-style-1';
      
      const element = document.getElementById(elementId);
      if (!element) return;
      try {
          const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
          const link = document.createElement('a');
          link.download = `Marksheet_${user.name}_${new Date().getTime()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      } catch (e) {
          console.error('Download failed', e);
      }
  };

  const handleDownloadAll = async () => {
      setIsDownloadingAll(true);
      setTimeout(async () => {
          const element = document.getElementById('full-analysis-report');
          if (element) {
              try {
                  const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
                  const link = document.createElement('a');
                  link.download = `Full_Analysis_${user.name}_${new Date().getTime()}.png`;
                  link.href = canvas.toDataURL('image/png');
                  link.click();
              } catch (e) {
                  console.error('Full Download Failed', e);
              }
          }
          setIsDownloadingAll(false);
      }, 1000);
  };

  const handleShare = async () => {
      const appLink = settings?.officialAppUrl || "https://play.google.com/store/apps/details?id=com.nsta.app"; 
      const text = `*${settings?.appName || 'IDEAL INSPIRATION CLASSES'} RESULT*\n\nName: ${user.name}\nScore: ${result.score}/${result.totalQuestions}\nAccuracy: ${percentage}%\nCorrect: ${result.correctCount}\nWrong: ${result.wrongCount}\nTime: ${formatTime(result.totalTimeSeconds)}\nDate: ${new Date(result.date).toLocaleDateString()}\n\nदेखिये मेरा NSTA रिजल्ट! आप भी टेस्ट दें...\nDownload App: ${appLink}`;
      if (navigator.share) {
          try { await navigator.share({ title: 'Result', text }); } catch(e) {}
      } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
  };

  const unlockFreeAnalysis = () => {
      const COST = 20;
      if (user.credits < COST) {
          alert(`Insufficient Credits! Unlock costs ${COST} coins.`);
          return;
      }
      setConfirmConfig({
          isOpen: true,
          title: "Unlock Analysis",
          message: `View answers and explanations for ${COST} Coins?`,
          onConfirm: () => {
              if (onUpdateUser) onUpdateUser({ ...user, credits: user.credits - COST });
              setIsAnalysisUnlocked(true);
              setConfirmConfig(prev => ({...prev, isOpen: false}));
          }
      });
  };

  const handleUltraAnalysis = async (skipCost: boolean = false) => {
      if (result.ultraAnalysisReport) {
          setUltraAnalysisResult(result.ultraAnalysisReport);
          return;
      }

      if (!questions || questions.length === 0) {
          return;
      }

      const cost = settings?.mcqAnalysisCostUltra ?? 20;

      if (!skipCost) {
          if (user.credits < cost) {
              alert(`Insufficient Credits! You need ${cost} coins for Analysis Ultra.`);
              return;
          }

          if (!confirm(`Unlock AI Analysis Ultra for ${cost} Coins?\n\nThis will identify your weak topics and suggest a study plan.`)) {
              return;
          }
      }

      setIsLoadingUltra(true);
      
      try {
          const userAnswers: Record<number, number> = {};
          if (result.omrData) {
              result.omrData.forEach(d => {
                  userAnswers[d.qIndex] = d.selected;
              });
          }

          await new Promise(resolve => setTimeout(resolve, 1500));
          const analysisText = generateLocalAnalysis();
          setUltraAnalysisResult(analysisText);

          const updatedResult = { ...result, ultraAnalysisReport: analysisText };
          
          const updatedHistory = (user.mcqHistory || []).map(r => r.id === result.id ? updatedResult : r);
          
          const updatedUser = { 
              ...user, 
              credits: skipCost ? user.credits : user.credits - cost,
              mcqHistory: updatedHistory
          };

          localStorage.setItem('nst_current_user', JSON.stringify(updatedUser));
          await saveUserToLive(updatedUser);
          if (onUpdateUser) onUpdateUser(updatedUser);

          await saveUniversalAnalysis({
              id: `analysis-${Date.now()}`,
              userId: user.id,
              userName: user.name,
              date: new Date().toISOString(),
              subject: result.subjectName,
              chapter: result.chapterTitle,
              score: result.score,
              totalQuestions: result.totalQuestions,
              userPrompt: `Analysis for ${result.totalQuestions} Questions. Score: ${result.score}`, 
              aiResponse: analysisText,
              cost: skipCost ? 0 : cost
          });
          
          await saveAiInteraction({
              id: `ai-ultra-${Date.now()}`,
              userId: user.id,
              userName: user.name,
              type: 'ULTRA_ANALYSIS',
              query: `Ultra Analysis for ${result.chapterTitle}`,
              response: analysisText,
              timestamp: new Date().toISOString()
          });

      } catch (error: any) {
          console.error("Ultra Analysis Error:", error);
          setUltraAnalysisResult(JSON.stringify({ error: "Failed to generate analysis. Please try again or contact support." }));
      } finally {
          setIsLoadingUltra(false);
      }
  };

  const renderOMRRow = (qIndex: number, selected: number, correct: number) => {
      const options = [0, 1, 2, 3];
      return (
          <div key={qIndex} className="flex items-center gap-3 mb-2">
              <span className="w-6 text-[10px] font-bold text-slate-500 text-right">{qIndex + 1}</span>
              <div className="flex gap-1.5">
                  {options.map((opt) => {
                      let bgClass = "bg-white border border-slate-300 text-slate-400";
                      
                      const isSelected = selected === opt;
                      const isCorrect = correct === opt;
                      
                      if (isSelected) {
                          if (isCorrect) bgClass = "bg-green-600 border-green-600 text-white shadow-sm";
                          else bgClass = "bg-red-500 border-red-500 text-white shadow-sm";
                      } else if (isCorrect && selected !== -1) {
                          bgClass = "bg-green-600 border-green-600 text-white opacity-80"; 
                      } else if (isCorrect && selected === -1) {
                          bgClass = "border-green-500 text-green-600 bg-green-50";
                      }

                      return (
                          <div key={opt} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${bgClass}`}>
                              {String.fromCharCode(65 + opt)}
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const toggleSpeech = (text: string) => {
      if (isSpeaking) {
          stopSpeech();
          setIsSpeaking(false);
      } else {
          // COIN CHECK
          const COST = 20;
          if (user.credits < COST) {
              alert(`Insufficient Coins! Voice costs ${COST} Coins.`);
              return;
          }
          if (!user.isAutoDeductEnabled) {
              setConfirmConfig({
                  isOpen: true,
                  title: "Listen to Analysis?",
                  message: `This will cost ${COST} Coins.`,
                  onConfirm: () => {
                      if(onUpdateUser) onUpdateUser({...user, credits: user.credits - COST});
                      setConfirmConfig(prev => ({...prev, isOpen: false}));
                      startSpeaking(text);
                  }
              });
              return;
          }
          
          if(onUpdateUser) onUpdateUser({...user, credits: user.credits - COST});
          startSpeaking(text);
      }
  };

  const startSpeaking = (text: string) => {
      speakText(text, selectedVoice, speechRate);
      setIsSpeaking(true);
  };

  const generateQuestionText = (q: any, includeExplanation: boolean, index: number) => {
      let text = `Question ${index + 1}. ${stripHtml(q.question)}. `;

      if (q.options && q.options.length > 0) {
          text += "Options: ";
          q.options.forEach((opt: string, i: number) => {
              text += `${String.fromCharCode(65 + i)}. ${stripHtml(opt)}. `;
          });
      }

      if (includeExplanation && q.explanation) {
          text += `Correct Answer: Option ${String.fromCharCode(65 + q.correctAnswer)}. `;
          text += `Explanation: ${stripHtml(q.explanation)}.`;
      }

      return text;
  };

  const handlePlayAll = (questionsToPlay: any[], includeExplanation: boolean, customPlaylist?: string[]) => {
      if (isPlayingAll) {
          stopPlaylist();
          return;
      }

      const newPlaylist = customPlaylist || questionsToPlay.map((q, i) => generateQuestionText(q, includeExplanation, i));
      setPlaylist(newPlaylist);
      setCurrentTrack(0);
      setIsPlayingAll(true);
  };

  // --- SECTION RENDERERS ---

  const renderAnalysisContent = () => {
    let data;
    try {
        data = JSON.parse(ultraAnalysisResult);
    } catch (e) {
        // Fallback if not JSON
        return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-sm text-slate-700 whitespace-pre-wrap">
                <ReactMarkdown>{ultraAnalysisResult}</ReactMarkdown>
            </div>
        );
    }

    return (
        <div className="space-y-6" id="full-analysis-report">
            {/* Motivation Header */}
            {data.motivation && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <Sparkles size={20} /> AI Insights
                    </h3>
                    <p className="text-lg opacity-90 font-medium">{data.motivation}</p>
                </div>
            )}

            {/* Topics Grid */}
            <div className="grid gap-4">
                {data.topics?.map((t: any, i: number) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800 text-base">{t.name}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                t.status === 'WEAK' ? 'bg-red-100 text-red-600' :
                                t.status === 'STRONG' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                                {t.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-3 font-medium leading-relaxed">{t.actionPlan}</p>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                Recommended: {t.studyMode}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  // NEW: Recommended Notes Section (Premium Style)
  const renderRecommendationsSection = () => {
      // Group recommendations by Topic
      const groupedRecs: Record<string, any[]> = {};
      recommendations.forEach(rec => {
          const topic = rec.topic || 'General';
          if(!groupedRecs[topic]) groupedRecs[topic] = [];
          groupedRecs[topic].push(rec);
      });

      // Filter for Weak Topics based on topicStats (< 70%)
      const displayTopics = Object.keys(topicStats).filter(t => topicStats[t].percent < 70);

      return (
          <div className="bg-slate-50 min-h-full">
              {/* Branding Header */}
              <div className="bg-white p-6 rounded-b-3xl shadow-sm border-b border-slate-200 mb-6 text-center">
                  {settings?.appLogo && <img src={settings.appLogo} className="w-12 h-12 mx-auto mb-2 object-contain" />}
                  <h2 className="font-black text-slate-800 text-lg uppercase tracking-widest">{settings?.appName || 'INSTITUTE'}</h2>
                  <p className="text-xs font-bold text-slate-400">Personalized Study Plan for <span className="text-slate-900">{user.name}</span></p>
              </div>

              <div className="px-4 space-y-8 pb-20">
                  {displayTopics.length === 0 ? (
                      <div className="text-center py-10 opacity-60">
                          <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
                          <p className="font-black text-slate-800">No Weak Topics!</p>
                          <p className="text-xs font-bold text-slate-400">Keep up the great work.</p>
                      </div>
                  ) : displayTopics.map((topicName, idx) => {
                      const relevantRecs = groupedRecs[topicName] || [];

                      // Also check case-insensitive match if direct match fails
                      if (relevantRecs.length === 0) {
                          const key = Object.keys(groupedRecs).find(k => k.toLowerCase() === topicName.toLowerCase());
                          if (key) relevantRecs.push(...groupedRecs[key]);
                      }

                      // Find WRONG questions for this topic
                      const topicWrongQs = questions?.filter(q => {
                           const isTopicMatch = (q.topic && q.topic.toLowerCase().trim() === topicName.toLowerCase().trim()) ||
                                                (q.topic && topicName.toLowerCase().includes(q.topic.toLowerCase())) ||
                                                (q.topic && q.topic.toLowerCase().includes(topicName.toLowerCase()));

                           if (!isTopicMatch) return false;

                           // Check if it was answered wrong
                           const omr = result.omrData?.find((d: any) => questions && d.qIndex === questions.indexOf(q));
                           // Strict: Attempted AND Wrong
                           return omr && omr.selected !== -1 && omr.selected !== q.correctAnswer;
                      }) || [];

                      // If no notes AND no wrong questions, skip
                      if (relevantRecs.length === 0 && topicWrongQs.length === 0) return null;

                      const stats = topicStats[topicName];

                      return (
                          <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                  <div className="flex items-center gap-2">
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <h3 className="font-black text-slate-800 text-sm uppercase">{topicName}</h3>
                                              <SpeakButton text={`${topicName}. ${stats ? `${stats.total - stats.correct} Wrong, ${stats.correct} Correct` : ''}`} className="p-1 hover:bg-slate-200" iconSize={14} />
                                          </div>
                                          {stats && (
                                              <div className="flex gap-2 mt-1">
                                                  <span className="text-[10px] font-bold text-slate-500">{stats.total} Total</span>
                                                  <span className="text-[10px] font-bold text-red-500">{stats.total - stats.correct} Wrong</span>
                                                  <span className="text-[10px] font-bold text-green-600">{stats.correct} Correct</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold">FOCUS</span>
                              </div>

                              <div className="p-4 space-y-4">
                                  {/* 2. RECOMMENDED NOTES */}
                                  {relevantRecs.length > 0 && (
                                      <div className="space-y-2">
                                          <p className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1">
                                              <BookOpen size={12} /> Suggested Material
                                          </p>
                                          {relevantRecs.map((rec, rIdx) => (
                                              <div key={rIdx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                                                  <div className="flex items-center gap-3">
                                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${rec.isPremium ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                                          {rec.isPremium ? <FileText size={14} /> : <Lightbulb size={14} />}
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                          <div className="flex items-center gap-1">
                                                              <p className="font-bold text-slate-700 text-xs line-clamp-1">{rec.title}</p>
                                                              {/* Updated: Read Content if available */}
                                                              <SpeakButton text={`${rec.title}. ${stripHtml(rec.content || rec.html || '')}`} className="p-1 shrink-0" iconSize={12} />
                                                          </div>
                                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${rec.isPremium ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                                              {rec.isPremium ? 'PREMIUM PDF' : 'FREE NOTE'}
                                                          </span>
                                                      </div>
                                                  </div>

                                                  <button
                                                      onClick={() => {
                                                          if (rec.isPremium) {
                                                              if (onLaunchContent) {
                                                                  onLaunchContent({
                                                                      id: `REC_PREM_${idx}_${rIdx}`,
                                                                      title: rec.title,
                                                                      type: 'PDF',
                                                                      directResource: { url: rec.url, access: rec.access }
                                                                  });
                                                              } else {
                                                                  window.open(rec.url, '_blank');
                                                              }
                                                          } else {
                                                              if (rec.content) {
                                                                  setViewingNote(rec);
                                                              } else if (onLaunchContent) {
                                                                  onLaunchContent({
                                                                      id: `REC_FREE_${idx}_${rIdx}`,
                                                                      title: rec.title,
                                                                      type: 'PDF',
                                                                      directResource: { url: rec.url, access: rec.access }
                                                                  });
                                                              }
                                                          }
                                                      }}
                                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-sm ${rec.isPremium ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                  >
                                                      {rec.isPremium ? 'View PDF' : 'Read'}
                                                  </button>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>

              {/* Developer Footer */}
              <div className="text-center py-6 text-slate-400 border-t border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest">Developed by {devName}</p>
              </div>
          </div>
      );
  };

  const renderProgressDelta = () => {
      // Filter history for same chapter, excluding current result
      const pastTests = (user.mcqHistory || [])
          .filter(h => h.chapterId === result.chapterId && h.id !== result.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
          .slice(0, 3); // Take last 3

      if (pastTests.length === 0) return null;

      const lastTest = pastTests[0];
      const prevPercent = Math.round((lastTest.score / lastTest.totalQuestions) * 100);
      const currPercent = percentage; // using existing 'percentage' variable
      const diff = currPercent - prevPercent;
      const sign = diff > 0 ? '+' : '';

      return (
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
              <h4 className="font-black text-blue-900 text-sm mb-2 flex items-center gap-2">
                  <TrendingUp size={16} /> Progress Delta
              </h4>
              <p className="text-xs font-bold text-slate-700 mb-3">
                  Last Test: {prevPercent}% → Now: {currPercent}% (<span className={diff >= 0 ? 'text-green-600' : 'text-red-600'}>{sign}{diff}%</span>)
              </p>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-[10px] text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                          <tr>
                              <th className="p-2">Date</th>
                              <th className="p-2">Time</th>
                              <th className="p-2 text-center">Score</th>
                              <th className="p-2 text-center text-red-500">Wrong</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {[result, ...pastTests].map((test, idx) => (
                              <tr key={test.id} className={test.id === result.id ? "bg-blue-50/50 font-bold" : ""}>
                                  <td className="p-2 text-slate-700">
                                      {new Date(test.date).toLocaleDateString(undefined, {day: 'numeric', month: 'short'})}
                                      {test.id === result.id && <span className="ml-1 text-[8px] bg-blue-100 text-blue-700 px-1 rounded">NOW</span>}
                                  </td>
                                  <td className="p-2 text-slate-500">
                                      {new Date(test.date).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                                  </td>
                                  <td className="p-2 text-center font-bold text-slate-800">
                                      {test.score}/{test.totalQuestions}
                                  </td>
                                  <td className="p-2 text-center font-bold text-red-500">
                                      {test.wrongCount}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  const renderTopicBreakdown = () => {
      const topics = Object.keys(topicStats);
      if (topics.length === 0) return null;

      // Mistake Analysis (Weak Concepts)
      const weakConcepts = topics.filter(t => topicStats[t].percent < 50);

      // HISTORY ANALYSIS FOR MISTAKES
      const last3Tests = (user.mcqHistory || [])
          .filter(h => h.chapterId === result.chapterId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);

      const totalInLast3 = last3Tests.reduce((sum, t) => sum + t.totalQuestions, 0);
      const mistakesInLast3 = last3Tests.reduce((sum, t) => sum + t.wrongCount, 0);

      return (
          <div className="space-y-6">
               {renderProgressDelta()}

               {/* MISTAKE PATTERN ANALYSIS (NEW) */}
               {weakConcepts.length > 0 && (
                  <div className="bg-red-50 rounded-2xl p-6 shadow-sm border border-red-200 mb-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-red-900">
                          <Target size={60} />
                      </div>
                      <h3 className="font-black text-red-800 text-lg mb-4 flex items-center gap-2 relative z-10">
                          <BrainCircuit size={18} /> Mistake Pattern Analysis
                      </h3>
                      <p className="text-xs text-red-700 font-medium mb-4 relative z-10">
                          We analyzed your wrong answers. You are struggling with these specific concepts:
                      </p>

                      <p className="text-sm font-bold text-red-700 relative z-10 mb-4">
                          {totalInLast3 > 0
                              ? `In the last ${last3Tests.length} tests, you made ${mistakesInLast3}/${totalInLast3} mistakes.`
                              : `Accuracy in this topic is ${topicStats[weakConcepts[0]].percent}% (Below 50%).`}
                      </p>

                      <div className="space-y-2 relative z-10">
                          {weakConcepts.map(concept => {
                              const topicTotalStats = user.topicStrength?.[concept] || { correct: 0, total: 0 };
                              const topicWrongTotal = topicTotalStats.total - topicTotalStats.correct;

                              return (
                                  <div key={concept} className="bg-white/60 p-3 rounded-lg border border-red-100">
                                      <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold text-red-900 uppercase">{concept}</span>
                                          <span className="text-xs font-black text-red-600">
                                              {topicStats[concept].total - topicStats[concept].correct} Mistakes
                                          </span>
                                      </div>
                                      <div className="mt-1 text-[10px] text-red-600 font-medium border-t border-red-100/50 pt-1">
                                          Why this is weak?
                                          <br/>
                                          "You made {topicWrongTotal}/{topicTotalStats.total} mistakes in this topic historically."
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
               )}

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                      <BarChart3 size={18} /> Topic Breakdown
                  </h3>
                  <div className="space-y-4">
                      {topics.map((topic, i) => {
                          const stats = topicStats[topic];
                          const percent = stats.percent;

                          let colorClass = "bg-red-500";
                          if (percent >= 80) colorClass = "bg-green-500";
                          else if (percent >= 40) colorClass = "bg-yellow-500";

                          return (
                              <div key={i}>
                                  <div className="flex justify-between items-end mb-1">
                                      <span className="font-bold text-slate-700 text-xs uppercase">{topic}</span>
                                      <span className={`text-xs font-black ${percent >= 80 ? 'text-green-600' : percent >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                          {stats.correct}/{stats.total} ({percent}%)
                                      </span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                          className={`h-full ${colorClass} transition-all duration-1000 ease-out`}
                                          style={{ width: `${percent}%` }}
                                      ></div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  };

  // MARKSHET STYLE 1: Centered Logo
  const renderMarksheetStyle1 = () => (
      <div id="marksheet-style-1" className="bg-white p-8 max-w-2xl mx-auto border-4 border-slate-900 rounded-none relative">
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-900"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-900"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-900"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-900"></div>
          
          {/* Header */}
          <div className="text-center mb-8">
              {settings?.appLogo && (
                  <img src={settings.appLogo} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
              )}
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">{settings?.appName || 'INSTITUTE NAME'}</h1>
              <p className="text-lg font-bold text-slate-500">{settings?.aiName || 'AI Assessment Center'}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1">Generated By {settings?.aiName || 'AI'}</p>
          </div>

          {/* User Info */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 flex justify-between items-center">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Candidate Name</p>
                  <p className="text-xl font-black text-slate-800">{user.name}</p>
              </div>
              <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">UID / Roll No</p>
                  <p className="text-xl font-black font-mono text-slate-800">{user.displayId || user.id}</p>
              </div>
          </div>

          {/* Score Grid */}
          <div className="mb-8">
              <h3 className="text-center font-bold text-slate-900 uppercase mb-4 border-b pb-2">Performance Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="border p-4 bg-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase">Total Questions</p>
                      <p className="text-xl font-black">{result.totalQuestions}</p>
                  </div>
                  <div className="border p-4 bg-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase">Attempted</p>
                      <p className="text-xl font-black">{result.correctCount + result.wrongCount}</p>
                  </div>
                  <div className="border p-4 bg-green-50 border-green-200">
                      <p className="text-xs font-bold text-green-600 uppercase">Correct</p>
                      <p className="text-xl font-black text-green-700">{result.correctCount}</p>
                  </div>
                  <div className="border p-4 bg-red-50 border-red-200">
                      <p className="text-xs font-bold text-red-600 uppercase">Wrong</p>
                      <p className="text-xl font-black text-red-700">{result.wrongCount}</p>
                  </div>
              </div>
              <div className="mt-4 bg-slate-900 text-white p-6 text-center rounded-xl">
                  <p className="text-sm font-bold opacity-60 uppercase mb-1">Total Score</p>
                  <p className="text-5xl font-black">{result.score} <span className="text-lg opacity-50">/ {result.totalQuestions}</span></p>
                  <p className="text-sm font-bold mt-2 text-yellow-400">{percentage}% Accuracy</p>
              </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t border-slate-200 pt-4 mt-8">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Developed by {devName}</p>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">

        <CustomConfirm
            isOpen={confirmConfig.isOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            onConfirm={confirmConfig.onConfirm}
            onCancel={() => setConfirmConfig({...confirmConfig, isOpen: false})}
        />
        <div className="w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
            
            {/* Header - Sticky */}
            <div className="bg-white text-slate-800 px-4 py-3 border-b border-slate-100 flex justify-between items-center z-10 sticky top-0 shrink-0">
                <div className="flex items-center gap-3">
                    {settings?.appLogo && (
                        <img src={settings.appLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-50 border" />
                    )}
                    <div>
                        <h1 className="text-sm font-black uppercase text-slate-900 tracking-wide">
                            {settings?.appName || 'RESULT'}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400">Official Marksheet</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* TAB HEADER (Conditional Rendering based on Lock) */}
            <div className="px-4 pt-2 pb-0 bg-white border-b border-slate-100 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide items-center">
                {/* Free Mode: Show Marksheet */}
                {mcqMode === 'FREE' && (
                    <button
                        onClick={() => setActiveTab('OFFICIAL_MARKSHEET')}
                        className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === 'OFFICIAL_MARKSHEET' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                    >
                        <FileText size={14} className="inline mr-1 mb-0.5" /> Official Marksheet
                    </button>
                )}

                {/* LOCKED BUTTONS */}
                {!isAnalysisUnlocked ? (
                    <button
                        onClick={unlockFreeAnalysis}
                        className="px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 border-transparent text-slate-400 hover:text-slate-600 flex items-center gap-1 bg-slate-50/50"
                    >
                        <Lock size={12} /> Analysis (Locked)
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => setActiveTab('SOLUTION')}
                            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === 'SOLUTION' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                        >
                            <FileSearch size={14} className="inline mr-1 mb-0.5" /> Analysis
                        </button>
                        <button
                            onClick={() => setActiveTab('OMR')}
                            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === 'OMR' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Grid size={14} className="inline mr-1 mb-0.5" /> OMR
                        </button>

                        {/* Premium Analysis - Only for Premium Mode */}
                        {mcqMode === 'PREMIUM' && (
                            <button
                                onClick={() => setActiveTab('PREMIUM_ANALYSIS')}
                                className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === 'PREMIUM_ANALYSIS' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                            >
                                <BrainCircuit size={14} className="inline mr-1 mb-0.5" /> Premium Analysis
                            </button>
                        )}

                        <button
                            onClick={() => setActiveTab('RECOMMEND')}
                            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === 'RECOMMEND' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Lightbulb size={14} className="inline mr-1 mb-0.5" /> Recommend Notes
                        </button>
                    </>
                )}
            </div>

            {/* SCROLLABLE CONTENT */}
            <div id="marksheet-content" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50">
                
                {/* 1. MARKSHEET SECTION (Always Visible) */}
                {activeTab === 'OFFICIAL_MARKSHEET' && (
                    <>
                        {renderMarksheetStyle1()}
                        {/* LOCKED VIEW ADVERTISEMENT */}
                        {!isAnalysisUnlocked && (
                            <div className="mt-6 bg-white p-6 rounded-2xl border-2 border-indigo-100 text-center shadow-lg">
                                <Lock className="mx-auto text-indigo-400 mb-3" size={48} />
                                <h3 className="text-xl font-black text-slate-800 mb-2">Analysis Locked</h3>
                                <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                                    Unlock detailed answers, OMR sheet, and weak concept analysis.
                                </p>
                                <button
                                    onClick={unlockFreeAnalysis}
                                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto"
                                >
                                    <BrainCircuit size={20} /> Unlock Now (20 Coins)
                                </button>
                            </div>
                        )}
                        {/* Always show Mistakes in Marksheet view for Free mode as requested?
                            "pahle wala me bas mistake rakha jayega".
                            Maybe below the marksheet?
                        */}
                        {!isAnalysisUnlocked && result.wrongQuestions && result.wrongQuestions.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                                    <XCircle size={20} /> Mistakes Preview
                                </h3>
                                <div className="space-y-3">
                                    {result.wrongQuestions.slice(0, 3).map((q, i) => (
                                        <div key={i} className="bg-red-50 p-3 rounded-xl border border-red-100">
                                            <p className="text-xs font-bold text-red-800">Q{q.qIndex + 1}: {stripHtml(q.question)}</p>
                                        </div>
                                    ))}
                                    <p className="text-center text-xs text-slate-400 font-bold mt-2">
                                        ...and {Math.max(0, result.wrongQuestions.length - 3)} more. Unlock to view all.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* 2. SOLUTION SECTION (New Analysis) */}
                {activeTab === 'SOLUTION' && isAnalysisUnlocked && (
                    <div className="animate-in slide-in-from-bottom-4">
                        {/* We reuse previous renderSolution logic via helper functions or inline */}
                        {/* Need to port renderSolutionSection logic here fully */}
                        <div className="flex items-center justify-between mb-3 px-2">
                            <div className="flex items-center gap-2">
                                <FileSearch className="text-blue-600" size={20} />
                                <h3 className="font-black text-slate-800 text-lg">Detailed Analysis</h3>
                            </div>
                        </div>
                        {questions && questions.length > 0 ? (
                            <div className="space-y-6">
                                {questions.map((q, idx) => {
                                    const omrEntry = result.omrData?.find(d => d.qIndex === idx);
                                    const userSelected = omrEntry ? omrEntry.selected : -1;
                                    const correctAnswerIndex = q.correctAnswer;
                                    const isCorrect = userSelected === correctAnswerIndex;
                                    const isSkipped = userSelected === -1;

                                    return (
                                        <div key={idx} className={`bg-white rounded-2xl border ${isCorrect ? 'border-green-200' : isSkipped ? 'border-slate-200' : 'border-red-200'} shadow-sm overflow-hidden`}>
                                            <div className={`p-4 ${isCorrect ? 'bg-green-50' : isSkipped ? 'bg-slate-50' : 'bg-red-50'} border-b ${isCorrect ? 'border-green-100' : isSkipped ? 'border-slate-100' : 'border-red-100'} flex gap-3`}>
                                                <span className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${isCorrect ? 'bg-green-100 text-green-700' : isSkipped ? 'bg-slate-200 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-slate-800 leading-snug prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMathInHtml(q.question) }} />
                                                </div>
                                            </div>
                                            {q.options && (
                                                <div className="p-4 space-y-2">
                                                    {q.options.map((opt: string, optIdx: number) => {
                                                        const isSelectedByUser = userSelected === optIdx;
                                                        const isTheCorrectAnswer = correctAnswerIndex === optIdx;
                                                        let optionClass = "border-slate-100 bg-white text-slate-600";
                                                        if (isTheCorrectAnswer) optionClass = "border-green-300 bg-green-50 text-green-800 font-bold";
                                                        else if (isSelectedByUser) optionClass = "border-red-300 bg-red-50 text-red-800 font-bold";

                                                        return (
                                                            <div key={optIdx} className={`p-3 rounded-xl border flex items-center gap-3 text-xs transition-colors ${optionClass}`}>
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border ${isTheCorrectAnswer ? 'border-green-400 bg-green-100 text-green-700' : isSelectedByUser ? 'border-red-400 bg-red-100 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                                                                    {String.fromCharCode(65 + optIdx)}
                                                                </div>
                                                                <div className="flex-1" dangerouslySetInnerHTML={{ __html: renderMathInHtml(opt) }} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {q.explanation && (
                                                <div className="p-4 bg-blue-50 border-t border-blue-100">
                                                    <div className="text-xs text-slate-700 leading-relaxed font-medium prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMathInHtml(q.explanation) }} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <p>No questions data.</p>}
                    </div>
                )}

                {/* 3. OMR SECTION */}
                {activeTab === 'OMR' && isAnalysisUnlocked && (
                    <div className="animate-in slide-in-from-bottom-4">
                         {renderTopicBreakdown()}
                         <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
                            <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                                <Grid size={18} /> OMR Response Sheet
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                                {currentData.map((data) => renderOMRRow(data.qIndex, data.selected, data.correct))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. PREMIUM ANALYSIS SECTION */}
                {activeTab === 'PREMIUM_ANALYSIS' && isAnalysisUnlocked && (
                    <div className="animate-in slide-in-from-bottom-4">
                        {/* Premium Analysis Content Code Reuse */}
                        {!ultraAnalysisResult ? (
                            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 text-center text-white shadow-lg">
                                <BrainCircuit size={48} className="mx-auto mb-4 opacity-80" />
                                <h4 className="text-xl font-black mb-2">Unlock Premium AI Analysis</h4>
                                <button onClick={() => handleUltraAnalysis()} disabled={isLoadingUltra} className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-black shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 mx-auto disabled:opacity-80">
                                    {isLoadingUltra ? <span className="animate-spin">⏳</span> : <UnlockIcon />}
                                    {isLoadingUltra ? 'Analyzing...' : `Unlock Analysis (${settings?.mcqAnalysisCostUltra ?? 20} Coins)`}
                                </button>
                            </div>
                        ) : renderAnalysisContent()}
                    </div>
                )}

                {/* 5. RECOMMENDED NOTES PAGE */}
                {activeTab === 'RECOMMEND' && isAnalysisUnlocked && (
                    <div className="animate-in slide-in-from-bottom-4 h-full">
                        {renderRecommendationsSection()}
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            <div className="bg-white p-4 border-t border-slate-100 flex items-center justify-center gap-6 z-10 shrink-0">
                {/* Only show share/download if unlocked or basic marksheet */}
                <button
                    onClick={handleShare}
                    className="p-3 bg-green-50 text-green-600 rounded-full hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-95"
                    title="Share Result"
                >
                    <Share2 size={20} />
                </button>
                
                <button
                    onClick={() => handleDownload()}
                    className="p-3 bg-slate-100 text-slate-600 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                    title={activeTab === 'OFFICIAL_MARKSHEET' ? 'Download Marksheet' : 'Download Page'}
                >
                    <Download size={20} />
                </button>
            </div>
             
             <div className="text-center py-2 bg-slate-50 border-t border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Developed by Nadim Anwar</p>
             </div>
        </div>
    </div>
  );
};

const UnlockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);
