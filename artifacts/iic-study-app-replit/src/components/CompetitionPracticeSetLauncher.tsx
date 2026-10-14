// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Lock,
  Unlock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Star,
  FileText,
  X,
  Zap,
  Info,
  Award,
  Layers,
  Flame,
  Check
} from 'lucide-react';
import {
  PracticeSetMeta,
  PRACTICE_SETS_CONFIG,
  buildPracticeSetQuestions,
  PracticeSetResult
} from '../utils/competitionPracticeSets';
import { buildClassAutoPracticeSets } from '../utils/classAutoPracticeSets';
import { subscribeMcqLessons } from '../firebase';
import { getCurrentWeekInfo } from '../utils/setLeaderboard';
import { CompetitionPracticeSetModal } from './CompetitionPracticeSetModal';
import { SetLeaderboardModal } from './SetLeaderboardModal';
import { hapticLight, hapticStrong } from '../utils/haptic';

interface Props {
  user: any;
  settings?: any;
  compMcqPracticeLessons?: any[];
  isDarkMode?: boolean;
  onOpenStore?: () => void;
  onClose?: () => void;
}

export const CompetitionPracticeSetLauncher: React.FC<Props> = ({
  user,
  settings,
  compMcqPracticeLessons = [],
  isDarkMode = false,
  onOpenStore,
  onClose
}) => {
  const [selectedSet, setSelectedSet] = useState<PracticeSetMeta | null>(null);
  const [activeLeaderboardSet, setActiveLeaderboardSet] = useState<PracticeSetMeta | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CLASS_10' | 'CLASS_12' | 'BASIC' | 'ULTRA' | 'BSEB' | 'SUBJECTS'>('ALL');
  const [showVipLockAlert, setShowVipLockAlert] = useState<{ open: boolean; title: string; requiredTier: 'BASIC' | 'ULTRA' } | null>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);

  // Weekly countdown info for banner
  const weekInfo = useMemo(() => getCurrentWeekInfo(), []);

  // VIP Status Check
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN';
  const isUltraUser = isAdmin || (user?.isPremium && user?.subscriptionLevel === 'ULTRA');
  const isBasicUser = isAdmin || isUltraUser || (user?.isPremium && user?.subscriptionLevel === 'BASIC');

  // Real-time lessons listener to automatically form Class 10 & 12 subject sets
  useEffect(() => {
    const unsub = subscribeMcqLessons(lessons => {
      setAllLessons(lessons || []);
    });
    return unsub;
  }, []);

  // 1. Auto-generated Class 10 Subject Sets (Deterministic chunking: Set 1, Set 2...)
  const class10Sets = useMemo(() => {
    return buildClassAutoPracticeSets('10', allLessons, settings);
  }, [allLessons, settings]);

  // 2. Auto-generated Class 12 Subject Sets (Deterministic chunking: Set 1, Set 2...)
  const class12Sets = useMemo(() => {
    return buildClassAutoPracticeSets('12', allLessons, settings);
  }, [allLessons, settings]);

  // 3. Convert custom practice sets configured by Admin
  const customSetsAsMeta: (PracticeSetMeta & { customQuestions?: any[]; isCustom?: boolean; isSubjectSet?: boolean })[] = (settings?.customPracticeSets || []).map((cs: any, idx: number) => ({
    id: cs.id,
    setNumber: 100 + idx,
    type: (cs.type === 'ULTRA' ? 'ULTRA' : 'BASIC') as any,
    title: cs.title,
    subtitle: cs.subtitle || `${cs.questions?.length || 0} प्रश्न · ${cs.durationMinutes || (cs.type === 'ULTRA' ? 120 : 60)} मिनट`,
    description: cs.description || `${cs.targetExam || 'प्रतियोगिता परीक्षा'} स्पेशल अभ्यास सेट।`,
    targetExam: cs.targetExam || (cs.type === 'ULTRA' ? 'BSSC Inter Level / SSC' : 'Bihar Police Constable'),
    durationMinutes: cs.durationMinutes || (cs.type === 'ULTRA' ? 120 : 60),
    totalQuestions: cs.questions?.length || (cs.type === 'ULTRA' ? 150 : 100),
    negativeMarking: cs.negativeMarking ?? (cs.type === 'ULTRA'),
    marksPerQuestion: cs.marksPerQuestion || 1,
    negativePenalty: cs.negativePenalty ?? (cs.type === 'ULTRA' ? 0.25 : 0),
    sections: [
      { id: 'gk', name: 'General Knowledge', hindiName: 'सामान्य ज्ञान (GK)', icon: '📖', targetCount: Math.round((cs.questions?.length || 100) * 0.5) },
      { id: 'gs', name: 'General Science', hindiName: 'सामान्य विज्ञान (GS)', icon: '🔬', targetCount: Math.round((cs.questions?.length || 100) * 0.3) },
      { id: 'math', name: 'Mathematics', hindiName: 'गणित (Math)', icon: '🔢', targetCount: Math.round((cs.questions?.length || 100) * 0.2) }
    ],
    customQuestions: cs.questions,
    isCustom: true
  }));

  // 4. Convert subject-wise question pools into practice sets for subject-level training
  const subjectSetsAsMeta: (PracticeSetMeta & { customQuestions?: any[]; isCustom?: boolean; isSubjectSet?: boolean })[] = (settings?.subjectMcqPools || []).map((pool: any, idx: number) => ({
    id: pool.id,
    setNumber: 200 + idx,
    type: 'BASIC' as any,
    title: pool.setName,
    subtitle: `${pool.questions?.length || 0} प्रश्न · 15 मिनट · ${pool.subjectLabel || pool.subject}`,
    description: `${pool.targetExam || 'प्रतियोगिता परीक्षा'} — ${pool.subjectLabel || pool.subject} स्पेशल विषय टेस्ट।`,
    targetExam: pool.targetExam || 'General',
    durationMinutes: Math.max(10, Math.round((pool.questions?.length || 10) * 1.2)),
    totalQuestions: pool.questions?.length || 10,
    negativeMarking: false,
    marksPerQuestion: 1,
    negativePenalty: 0,
    sections: [
      { id: 'gk', name: pool.subjectLabel || 'Subject Practice', hindiName: pool.subjectLabel || 'विषय टेस्ट', icon: '📚', targetCount: pool.questions?.length || 10 }
    ],
    customQuestions: pool.questions,
    isCustom: true,
    isSubjectSet: true
  }));

  // Combine all available sets
  const allAvailableSets = [
    ...PRACTICE_SETS_CONFIG,
    ...customSetsAsMeta,
    ...subjectSetsAsMeta,
    ...class10Sets,
    ...class12Sets
  ];

  // Filtering by active tab
  const filteredSets = allAvailableSets.filter(s => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'CLASS_10') return (s as any).classLevel === '10';
    if (activeTab === 'CLASS_12') return (s as any).classLevel === '12';
    if (activeTab === 'SUBJECTS') return (s as any).isSubjectSet;
    if (activeTab === 'BSEB') {
      const txt = ((s.targetExam || '') + ' ' + (s.title || '') + ' ' + (s.description || '')).toLowerCase();
      return (s as any).isClassSet || txt.includes('bseb') || txt.includes('board') || txt.includes('बिहार बोर्ड');
    }
    if (activeTab === 'BASIC') {
      return s.type === 'BASIC' && !(s as any).isSubjectSet && !(s as any).isClassSet;
    }
    if (activeTab === 'ULTRA') {
      return s.type === 'ULTRA' && !(s as any).isSubjectSet && !(s as any).isClassSet;
    }
    return true;
  });

  const handleStartSet = (meta: PracticeSetMeta) => {
    hapticLight();

    // Class 10 & 12 board sets are open to all students for fair statewide leaderboard participation
    if ((meta as any).isClassSet) {
      setSelectedSet(meta);
      return;
    }

    // Check VIP permission for Competition Mock Sets
    if (meta.type === 'BASIC') {
      if (!isBasicUser) {
        hapticStrong();
        setShowVipLockAlert({
          open: true,
          title: meta.title,
          requiredTier: 'BASIC'
        });
        return;
      }
    } else if (meta.type === 'ULTRA') {
      if (!isUltraUser) {
        hapticStrong();
        setShowVipLockAlert({
          open: true,
          title: meta.title,
          requiredTier: 'ULTRA'
        });
        return;
      }
    }

    // Unlocked -> Launch
    setSelectedSet(meta);
  };

  return (
    <div className="space-y-4">
      {/* ── HEADER BANNER ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/50 to-slate-900/70 border border-indigo-500/30 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                🎯 Exam Practice & Weekly Leaderboard
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Clock size={11} />
                <span>रीसेट: {weekInfo.formattedCountdown}</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              प्रैक्टिस सेट व साप्ताहिक रैंक हब
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              बिहार पुलिस, BSSC तथा <strong>कक्षा 10वीं व 12वीं विषयवार ऑटो-जनरेटेड सेट्स</strong>। सभी विद्यार्थियों के लिए समान प्रश्न पत्र और प्रत्येक सेट का <strong>साप्ताहिक लाइव लीडरबोर्ड</strong>!
            </p>
          </div>
          <div className="text-3xl sm:text-4xl shrink-0 select-none">
            📝
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-indigo-500/20 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            सभी सेट्स ({allAvailableSets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CLASS_10')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'CLASS_10'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <span>🔟 10वीं बोर्ड ({class10Sets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CLASS_12')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'CLASS_12'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <span>🎓 12वीं बोर्ड ({class12Sets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BASIC')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'BASIC'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <span>👮 बिहार पुलिस</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ULTRA')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ULTRA'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <span>🏛️ BSSC / SSC</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BSEB')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'BSEB'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <span>🟠 BSEB बोर्ड</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SUBJECTS')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'SUBJECTS'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <span>📚 सामान्य विषय ({subjectSetsAsMeta.length})</span>
          </button>
        </div>
      </div>

      {/* ── SETS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredSets.map(meta => {
          const isBasic = meta.type === 'BASIC';
          const isClassSet = Boolean((meta as any).isClassSet);
          const isSubject = Boolean((meta as any).isSubjectSet);
          const isLocked = isClassSet ? false : (isBasic ? !isBasicUser : !isUltraUser);

          return (
            <div
              key={meta.id}
              className={`p-4 rounded-2xl border transition-all text-left relative overflow-hidden group shadow-md ${
                isLocked
                  ? 'bg-slate-800/40 border-slate-700/60 opacity-90'
                  : 'bg-slate-800/80 border-slate-700 hover:border-indigo-500/60'
              }`}
            >
              {/* Type Chip & Lock Icon */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isClassSet ? (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles size={10} />
                      <span>कक्षा {(meta as any).classLevel} ऑटो-सेट</span>
                    </span>
                  ) : isSubject ? (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      📚 विषय-वार टेस्ट
                    </span>
                  ) : (meta as any).isCustom ? (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      ✨ फुल मॉक टेस्ट
                    </span>
                  ) : null}

                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    isClassSet
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : isBasic
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {isClassSet
                      ? `${(meta as any).subjectLabel || 'बोर्ड'} स्पेशल`
                      : isBasic
                      ? 'बिहार पुलिस · Basic Set'
                      : 'BSSC / SSC · Ultra Set'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {isLocked ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                      <Lock size={11} />
                      <span>{isBasic ? 'Basic VIP' : 'Ultra VIP'}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                      <Unlock size={11} />
                      <span>Unlocked</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-sm sm:text-base font-black text-white group-hover:text-indigo-300 transition-colors">
                {meta.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {meta.description}
              </p>

              {/* Badges Info */}
              <div className="flex items-center flex-wrap gap-2 mt-3 pt-2.5 border-t border-slate-700/50 text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-700/60">
                  <Clock size={12} className="text-indigo-400" />
                  <span>{meta.durationMinutes} Min</span>
                </span>
                <span className="flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-700/60">
                  <FileText size={12} className="text-indigo-400" />
                  <span>{meta.totalQuestions} Questions</span>
                </span>
                {meta.negativeMarking ? (
                  <span className="bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/20">
                    -0.25 Negative
                  </span>
                ) : (
                  <span className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    No Negative
                  </span>
                )}
                {isClassSet && (
                  <span className="bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-md border border-teal-500/20">
                    सभी का समान सेट
                  </span>
                )}
              </div>

              {/* Distribution Preview */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 font-bold">
                {meta.sections.map(s => (
                  <span key={s.id} className="bg-slate-700/30 px-1.5 py-0.5 rounded">
                    {s.icon} {s.hindiName.split(' ')[0]}: {s.targetCount}Q
                  </span>
                ))}
              </div>

              {/* Action Buttons: Leaderboard & Start Test */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-700/50 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setActiveLeaderboardSet(meta);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Trophy size={13} className="text-amber-400" />
                  <span>लीडरबोर्ड</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartSet(meta)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                    isLocked
                      ? 'bg-slate-700/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                      : isClassSet
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white'
                      : isBasic
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white'
                  }`}
                >
                  {isLocked ? (
                    <>
                      <Lock size={13} />
                      <span>Unlock VIP</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} className="fill-current" />
                      <span>टेस्ट शुरू करें</span>
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── VIP LOCK PROMPT MODAL ── */}
      {showVipLockAlert?.open && (
        <div className="fixed inset-0 z-[1000005] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 sm:p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center mx-auto text-2xl shadow-lg">
              🔒
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                VIP Exclusive Feature
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                प्रैक्टिस सेट लॉक है!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>{showVipLockAlert.title}</strong> को एक्सेस करने के लिए <strong>{showVipLockAlert.requiredTier} VIP</strong> सब्सक्रिप्शन की आवश्यकता है।
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-left text-xs space-y-1.5 text-slate-300">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span>VIP प्रैक्टिस सेट के फायदे:</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Check size={12} className="text-emerald-400" />
                <span>बिहार पुलिस व BSSC के 100/150 प्रश्नों के मॉडल पेपर्स</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Check size={12} className="text-emerald-400" />
                <span>60 मिनट व 120 मिनट का रियल एग्जाम टाइमर</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Check size={12} className="text-emerald-400" />
                <span>साप्ताहिक रैंकिंग व सम्पूर्ण हल व्याख्या सहित</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowVipLockAlert(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-black border border-slate-700"
              >
                Close
              </button>
              {onOpenStore && (
                <button
                  type="button"
                  onClick={() => {
                    setShowVipLockAlert(null);
                    onOpenStore();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md active:scale-95 transition-all"
                >
                  Store / Upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TEST MODAL LAUNCHER ── */}
      {selectedSet && (
        <CompetitionPracticeSetModal
          meta={selectedSet}
          user={user}
          questions={
            (selectedSet as any).customQuestions?.length > 0
              ? (selectedSet as any).customQuestions.map((q: any, i: number) => ({
                  ...q,
                  sectionId: q.sectionId || 'gk',
                  setQuestionNumber: i + 1
                }))
              : buildPracticeSetQuestions(selectedSet, {
                  lucentNotes: settings?.lucentNotes || [],
                  competitionMcqs: settings?.competitionMcqs || [],
                  mcqLessons: compMcqPracticeLessons,
                  customMcqs: user?.customMcqs || []
                })
          }
          isDarkMode={isDarkMode}
          onClose={() => setSelectedSet(null)}
        />
      )}

      {/* ── DEDICATED SET LEADERBOARD MODAL ── */}
      {activeLeaderboardSet && (
        <SetLeaderboardModal
          setId={activeLeaderboardSet.id}
          setTitle={activeLeaderboardSet.title}
          targetExam={activeLeaderboardSet.targetExam}
          maxMarks={activeLeaderboardSet.totalQuestions * (activeLeaderboardSet.marksPerQuestion || 1)}
          user={user}
          isOpen={!!activeLeaderboardSet}
          onClose={() => setActiveLeaderboardSet(null)}
          onStartSet={() => {
            const s = activeLeaderboardSet;
            setActiveLeaderboardSet(null);
            handleStartSet(s);
          }}
        />
      )}
    </div>
  );
};
