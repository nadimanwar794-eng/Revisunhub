// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { User, CreditPackage, SystemSettings } from '../types';
import {
Sparkles, Check, MessageSquare, Lock, Ticket, ShieldCheck, Star,
ChevronRight, ChevronDown, Flame, BadgeCheck, History, TrendingDown,
Calendar, Clock, Crown, DollarSign, ArrowLeft, Zap, Gift, Coins,
Package, Wallet, X, ArrowLeftRight
} from 'lucide-react';
import { saveUserToLive } from '../firebase';
import { getLevelInfo, getScoreDiscountFromScore, getNextLevelInfo, getLevelProgress, getLevelDailyLimitsWithOverride, UNLIMITED } from '../utils/levelSystem';
import { SCORE_MULTIPLIERS, getDailyScoreLimit, getUserScoreMultiplier } from '../utils/scoreSystem';
import { addSubscription, isSubscriptionFromCoins } from '../utils/subscriptionUtils';
import { applyDeduction, getTotalCredits } from '../utils/creditSystem';
import { recordCreditTx } from '../utils/creditHistory';
import {
loadRoutineData, saveRoutineData, checkAndResetDaily,
getUserSubTier, ensureTodayClaimEntry, claimAllPendingCoins,
getUnclaimedCoins, getDailyClaimAmount, DAILY_CLAIM_PRO, DAILY_CLAIM_MAX_PRO,
type UserSubTier,
} from '../utils/routineStorage';
import {
getCreditSubPlans,
isCreditSubActive,
canClaimCreditSubToday,
getCreditSubDaysRemaining,
claimDailyCreditSub,
CREDIT_SUB_DURATIONS,
type CreditSubDurationId,
calculateCreditSubPrice,
getCreditSubPlanMultiplier,
} from '../utils/creditSubscriptionUtils';
import {
DIAMOND_PACKS,
PRESET_DIAMOND_SUB_TEMPLATES,
CREDITS_PER_DIAMOND,
exchangeDiamondsForCredits,
claimDailyDiamonds,
canClaimDailyDiamonds,
DIAMOND_SUBSCRIPTION_PLANS,
} from '../utils/diamondUtils';
import {
DIAMOND_SUB_DURATIONS,
type DiamondSubDurationId,
calculateDiamondSubPrice,
} from '../utils/diamondSubOptions';

interface Props {
user: User;
settings?: SystemSettings;
onUserUpdate: (user: User) => void;
renderEarnContent?: React.ReactNode;
onBack?: () => void;
themeColor?: string;
tierTheme?: any;
initialTier?: 'FREE' | 'SUBSCRIPTION' | 'CREDITS' | 'DIAMONDS' | 'HISTORY';
}

/* ─── Fixed color palette ─── */
const C = {
bg: '#07070e',
surface: '#0f0f1a',
surfaceHigh: '#181826',
surfaceMid: '#13131f',
border: 'rgba(255,255,255,0.07)',
borderMed: 'rgba(255,255,255,0.13)',
text: '#f1f5f9',
textMuted: '#64748b',
textDim: '#2d3748',

pro: '#22d3ee',
proBg: 'rgba(34,211,238,0.08)',
proBorder: 'rgba(34,211,238,0.30)',
proGlow: 'rgba(34,211,238,0.20)',
proGrad: 'linear-gradient(135deg,#0891b2 0%,#22d3ee 60%,#67e8f9 100%)',

max: '#c084fc',
maxBg: 'rgba(192,132,252,0.08)',
maxBorder: 'rgba(192,132,252,0.30)',
maxGlow: 'rgba(192,132,252,0.20)',
maxGrad: 'linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#e879f9 100%)',

credit: '#10b981',
creditBg: 'rgba(16,185,129,0.10)',
creditBorder: 'rgba(16,185,129,0.32)',
creditGlow: 'rgba(16,185,129,0.22)',
creditGrad: 'linear-gradient(135deg,#059669 0%,#10b981 60%,#34d399 100%)',

gold: '#fbbf24',
goldBg: 'rgba(251,191,36,0.10)',
goldBorder: 'rgba(251,191,36,0.28)',

earn: '#34d399',
earnBg: 'rgba(52,211,153,0.08)',
earnBorder: 'rgba(52,211,153,0.28)',

green: '#34d399',
greenBg: 'rgba(52,211,153,0.09)',
greenBorder: 'rgba(52,211,153,0.30)',

diamond: '#38bdf8',
diamondBg: 'rgba(56,189,248,0.12)',
diamondBorder:'rgba(56,189,248,0.35)',
diamondGlow: 'rgba(56,189,248,0.25)',
};


/* ─── Subscription History ─── */
const SubHistory: React.FC<{ user: User; onBack: () => void }> = ({ user, onBack }) => {
  const history = user.subscriptionHistory || [];
  const sorted = [...history].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  return (
    <div className="animate-in fade-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black text-white">Purchase History</h2>
      </div>
      <div className="space-y-4">
        {sorted.length === 0 ? (
          <p className="text-center text-slate-400 mt-10 text-xs font-medium">No history found.</p>
        ) : (
          sorted.map(tx => (
            <div key={tx.id} className="p-4 rounded-xl border border-white/10 bg-slate-900/50">
              <div className="flex justify-between items-start mb-2">
                <span className="font-black text-white text-sm">{tx.planId}</span>
                <span className="text-xs font-bold text-amber-400">₹{tx.price}</span>
              </div>
              <p className="text-xs text-slate-400">{new Date(tx.startDate).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const Store: React.FC<Props> = ({ user, settings, onUserUpdate, onBack, initialTier = 'FREE' }) => {
  const [tierType, setTierType] = useState(initialTier);
  const [subTierView, setSubTierView] = useState<'PRO' | 'MAX'>('PRO');
  const [diamondSubTab, setDiamondSubTab] = useState<'PACKS' | 'WEEKLY' | 'MONTHLY'>('PACKS');
  const [exchangeMsg, setExchangeMsg] = useState<string | null>(null);
  const [exchangeDiamondsCount, setExchangeDiamondsCount] = useState(1);
  const [showAllTiersModal, setShowAllTiersModal] = useState(false);

  const isFreeTab = tierType === 'FREE';
  const isSubTab = tierType === 'SUBSCRIPTION';
  const isCreditsTab = tierType === 'CREDITS';
  const isDiamondsTab = tierType === 'DIAMONDS';
  const isExchangeTab = tierType === 'EXCHANGE';
  const isHistoryTab = tierType === 'HISTORY';

  const pageTheme = isFreeTab 
    ? { cardSurface: 'rgba(148,163,184,0.05)', cardBorder: 'rgba(148,163,184,0.15)' }
    : { cardSurface: 'rgba(56,189,248,0.05)', cardBorder: 'rgba(56,189,248,0.15)' }; 

  const allTabs = [
    { id: 'FREE'         as const, label: 'Free',         emoji: '🎯', color: '#94a3b8',bg: 'rgba(148,163,184,0.12)',border: 'rgba(148,163,184,0.3)',glow: 'rgba(148,163,184,0.18)' },
    { id: 'SUBSCRIPTION' as const, label: 'VIP Plans',    emoji: '👑', color: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.35)', glow: 'rgba(192,132,252,0.25)' },
    { id: 'CREDITS'      as const, label: 'Credits',      emoji: '🪙', color: C.credit, bg: C.creditBg,                border: C.creditBorder,          glow: C.creditGlow },
    { id: 'DIAMONDS'     as const, label: 'Diamonds',     emoji: '💎', color: C.diamond,bg: C.diamondBg,               border: C.diamondBorder,         glow: C.diamondGlow },
    { id: 'EXCHANGE'     as const, label: 'Exchange',     emoji: '🔄', color: '#10b981',bg: 'rgba(16,185,129,0.12)',border: 'rgba(16,185,129,0.3)',glow: 'rgba(16,185,129,0.18)' },
  ];

  const initiatePurchase = (pack: any) => {
    alert("Proceeding to checkout for " + (pack.name || 'Pack'));
  };

  return (
    <div className="min-h-screen pb-28 animate-in fade-in slide-in-from-right duration-300" style={{ background: C.bg }}>
      <div className="px-4 pt-6 pb-5" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          {onBack && (
             <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white">
               <ArrowLeft size={20}/>
             </button>
          )}
          <h2 className="text-xl font-black text-white">Store & Subscriptions</h2>
        </div>
        
        {/* Horizontal Scrollable Tabs */}
        <div className="mt-6 flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {allTabs.map(tab => (
            <button key={tab.id} onClick={() => setTierType(tab.id as any)} className={`px-4 py-2 rounded-full font-black text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${tierType === tab.id ? 'opacity-100 shadow-md' : 'opacity-60 hover:opacity-100'}`} style={{ background: tierType === tab.id ? tab.bg : 'transparent', border: `1px solid ${tierType === tab.id ? tab.border : 'rgba(255,255,255,0.1)'}`, color: tierType === tab.id ? tab.color : '#94a3b8' }}>
              <span>{tab.emoji}</span> {tab.label}
            </button>
          ))}
          <button onClick={() => setTierType('HISTORY')} className={`px-4 py-2 rounded-full font-black text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${tierType === 'HISTORY' ? 'opacity-100 shadow-md bg-white/10 border-white/20 text-white' : 'opacity-60 hover:opacity-100 bg-transparent border-white/10 text-slate-400'}`} style={{ border: '1px solid' }}>
            <History size={14}/> History
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        {tierType === 'HISTORY' && <SubHistory user={user} onBack={() => setTierType('FREE')} />}
        

        {/* ── FREE TAB ── */}
        {tierType === 'FREE' && (
          <div className="space-y-4 animate-fade-in-up pb-10">
            {/* 1. Free Features List */}
            <div className="rounded-2xl p-4 sm:p-5 border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Check size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-400">Free Me Kya-Kya Mil Raha Hai</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Ye sabhi features aap Free plan me bina kisi charge ke use kar sakte hain:
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { icon: '❓', title: 'Standard Daily MCQs', badge: 'FREE', desc: 'Har din free quota ke MCQ tests practice karne ki suvidha' },
                  { icon: '📖', title: 'Standard Reading Mode', badge: 'FREE', desc: 'Syllabus chapters aur standard notes padhne ka access' },
                  { icon: '🪙', title: 'Daily Free Coin Claim', badge: 'FREE', desc: 'Rozana login karke muft bonus coins claim karein' },
                  { icon: '🔥', title: 'Login Streak & XP Tracker', badge: 'FREE', desc: 'Consistency banayein aur daily streak points earn karein' },
                  { icon: '📝', title: 'Homework & Syllabus Overview', badge: 'FREE', desc: 'Classes aur daily assignments overview dekhne ka access' },
                  { icon: '🏆', title: 'Public Leaderboard View', badge: 'FREE', desc: 'Overall rankings aur student standing dekhne ki suvidha' },
                  { icon: '🎧', title: 'Basic Voice Audio Reader', badge: 'FREE', desc: 'Normal speed par chapters audio sunne ka access' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-bold text-slate-200">{item.title}</span>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 tracking-wider">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Full Feature Comparison Table */}
            <div className="rounded-2xl p-4 sm:p-5 border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
              <div className="mb-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>📊</span> Full Feature Comparison (Free vs Pro vs Max)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Sabhi plans ki direct tulna ek nazar me dekhein:</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-2.5 font-bold text-slate-300">Feature</th>
                      <th className="py-2.5 font-black text-center text-slate-200">Free 🎯</th>
                      <th className="py-2.5 font-black text-center text-cyan-400">Pro ⭐</th>
                      <th className="py-2.5 font-black text-center text-purple-400">Max ⚡</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { f: 'Daily XP Limit', free: '1,500 pts', pro: <><span className="text-cyan-300 font-bold">2,500 pts</span><br/><span className="text-[9px] text-cyan-400/80">(+66%)</span></>, max: <><span className="text-purple-300 font-bold">3,500 pts</span><br/><span className="text-[9px] text-purple-400/80">(+133%)</span></> },
                      { f: 'XP Multiplier', free: '1.0X', pro: <span className="text-cyan-400 font-bold">1.5X Boost</span>, max: <span className="text-purple-400 font-bold">2.0X Super Boost</span> },
                      { f: 'Daily Credits Pass', free: '—', pro: <span className="text-amber-400 font-bold">50 CR / Day</span>, max: <span className="text-amber-400 font-bold">100 CR / Day</span> },
                      { f: 'Credit Cost Off', free: '0%', pro: <span className="text-emerald-400 font-bold">20% OFF</span>, max: <span className="text-emerald-400 font-bold">40% OFF</span> },
                      { f: 'MCQ / Day Practice', free: <span className="text-slate-400">Free<br/>Quota</span>, pro: <span className="text-cyan-300 font-bold">1,500 / Day</span>, max: <span className="text-purple-300 font-bold">3,000 / Day</span> },
                      { f: 'Projector & PDF Mode', free: <span className="text-red-400 font-bold">✕</span>, pro: <span className="text-emerald-400 font-bold">✓</span>, max: <span className="text-emerald-400 font-bold">✓</span> },
                      { f: 'Writing & Correction', free: <span className="text-red-400 font-bold">✕</span>, pro: <span className="text-emerald-400 font-bold">✓</span>, max: <span className="text-emerald-400 font-bold">✓</span> },
                      { f: 'Flashcard Memory Mode', free: <span className="text-red-400 font-bold">✕</span>, pro: '—', max: <span className="text-emerald-400 font-bold">✓ Unlocked</span> },
                      { f: 'Video Player Mode', free: <span className="text-red-400 font-bold">✕</span>, pro: '—', max: <span className="text-emerald-400 font-bold">✓ Full Video</span> },
                      { f: 'Global Student Chat', free: <span className="text-red-400 font-bold">✕</span>, pro: '—', max: <span className="text-emerald-400 font-bold">✓ Live Chat</span> },
                      { f: 'Themes & Styling', free: 'Default', pro: <span className="text-cyan-400 font-bold">Basic Themes</span>, max: <span className="text-purple-400 font-bold">All Ultra Themes</span> },
                      { f: 'Store Extra Discount', free: '0%', pro: <span className="text-emerald-400 font-bold">+5% OFF</span>, max: <span className="text-emerald-400 font-bold">+5% OFF</span> },
                      { f: 'Leaderboard VIP Badge', free: '—', pro: <span className="text-cyan-400 font-bold">PRO Badge</span>, max: <span className="text-amber-400 font-bold">👑 Golden Crown</span> },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 pr-2 font-semibold text-slate-300 w-1/3">{row.f}</td>
                        <td className="py-3 px-1 text-center text-slate-400">{row.free}</td>
                        <td className="py-3 px-1 text-center bg-cyan-950/20">{row.pro}</td>
                        <td className="py-3 px-1 text-center bg-purple-950/20">{row.max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. FAQs Accordions */}
            <div className="space-y-3">
              <details className="group rounded-2xl border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <Star size={16} className="text-cyan-400 fill-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[12px] font-bold text-white">Basic Plan Kya Hai?</h4>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">PRO SUPERPOWERS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Tap karein: Pro (Basic) plan se add hone wale superpowers...</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className="text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-4 pt-0 text-[11px] text-slate-300 border-t border-white/5 mt-2">
                  <p>Pro plan lene se aapke paas daily MCQ limits badh jayengi, credits pass activate ho jayega jisse store discounts milenge, aur PDF/Projector mode jaise premium study tools unlock ho jayenge.</p>
                </div>
              </details>

              <details className="group rounded-2xl border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Crown size={16} className="text-purple-400 fill-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[12px] font-bold text-white">Ultra Plan Kya Hai?</h4>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">ELITE VIP SUPERPOWERS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Tap karein: Ultra (Max) plan se add hone wale superpowers...</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className="text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-4 pt-0 text-[11px] text-slate-300 border-t border-white/5 mt-2">
                  <p>Ultra plan sabse highest tier hai! Isme Pro ke sabhi features ke saath-saath Video Player mode, Flashcard memory mode, Global Student Chat, aur highest XP & Credits boost milta hai. Ye un students ke liye hai jo maximum limits chahte hain.</p>
                </div>
              </details>
            </div>
          </div>
        )}


        {tierType === 'SUBSCRIPTION' && (
          <div className="space-y-4">
            <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/10 mb-4">
               <button onClick={() => setSubTierView('PRO')} className={`flex-1 py-2 rounded-xl font-black text-xs transition-all ${subTierView === 'PRO' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>⭐ PRO Plan</button>
               <button onClick={() => setSubTierView('MAX')} className={`flex-1 py-2 rounded-xl font-black text-xs transition-all ${subTierView === 'MAX' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>👑 MAX Plan</button>
            </div>
            
            {subTierView === 'PRO' && (
               <div className="space-y-4">
                 <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-center">
                    <h3 className="text-xl font-black text-white">Basic (PRO) Plan</h3>
                    <p className="text-xs text-slate-300 mt-2">Unlock amazing features and boost your progress!</p>
                    <button className="mt-4 px-6 py-2 bg-cyan-500 text-slate-950 font-black rounded-full shadow-lg" onClick={() => initiatePurchase({name: 'PRO Plan'})}>Subscribe Now</button>
                 </div>
                 <details className="group rounded-2xl border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <Star size={16} className="text-cyan-400 fill-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[12px] font-bold text-white">Basic Plan Kya Hai?</h4>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">PRO SUPERPOWERS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 group-open:hidden">Tap karein: Pro (Basic) plan se add hone wale superpowers...</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 hidden group-open:block">Tap karke band karein</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className="text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-3 sm:p-4 text-[11px] text-slate-300 border-t border-white/5 mt-2 bg-slate-900/30">
                  <div className="rounded-xl p-4 mb-3 border border-cyan-500/20 bg-cyan-950/30 shadow-lg">
                    <h4 className="text-sm font-black text-cyan-400 mb-1 flex items-center gap-2"><span>⭐</span> PRO UNLOCKED SUPERPOWERS</h4>
                    <p className="text-xs text-slate-300 mb-4">Pro (Basic) Plan Se Add Hone Wale Superpowers</p>
                    <button onClick={() => { setTierType('SUBSCRIPTION'); setSubTierView('PRO'); }} className="px-4 py-2.5 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] w-fit">
                      <Zap size={14} className="fill-slate-950" /> Pro Plan Dekhein
                    </button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: '👥', title: 'Group Study & Live Classroom', badge: 'LIVE STUDY', desc: 'Friends ke sath real-time live study room join karein aur Live MCQ Battles me compete karein!' },
                      { icon: '🚀', title: '+66% Extra Daily XP Limit', badge: '+66% XP', desc: 'Daily score limit 1,500 se badhkar 2,500 points ho jati hai — Rank fast badhao!' },
                      { icon: '⚡', title: '1.5X Score Multiplier', badge: '1.5X BOOST', desc: 'Har test, lesson aur activity par seedha 50% bonus XP point boost!' },
                      { icon: '🪙', title: 'Daily 50 Credits Pass', badge: '50 CR/DAY', desc: 'Har din 50 credits auto-claim karein (Mahine ke 1,500 Credits bilkul muft)!' },
                      { icon: '🏷️', title: '20% Off Everywhere (Credits)', badge: '20% OFF', desc: 'App me kisi bhi test/mode ke credit cost par flat 20% permanent discount' },
                      { icon: '🎥', title: 'Projector Mode & PDF Mode', badge: 'UNLOCKED', desc: 'Badi screen projector display aur full PDF reading interface unlock' },
                      { icon: '✍️', title: 'Writing & Correction Mode', badge: 'UNLOCKED', desc: 'Digital writing notebook aur community question mistake correction power' },
                      { icon: '🎨', title: 'Text Color & Style Customization', badge: 'CUSTOM', desc: 'Apni pasand ke fonts, background text color aur custom contrast lagayein' },
                      { icon: '🎭', title: 'All Basic Themes Free', badge: 'THEMES FREE', desc: 'Sabhi stylish basic themes bina kisi extra charge ke unlock' },
                      { icon: '📥', title: 'Offline Download Available', badge: 'DOWNLOAD', desc: 'Important revision lessons aur study material offline save karein' },
                      { icon: '📊', title: 'Detailed Score History', badge: 'ANALYTICS', desc: 'Har test ka score graph aur deep performance analytics dekhein' },
                      { icon: '💬', title: 'Community MCQ Submission', badge: 'CREATOR', desc: 'Apne banaye huye sawal community me contribute karein' },
                      { icon: '💎', title: '+5% Permanent Store Discount', badge: '5% OFF', desc: 'Har subscription renewal aur store purchase par extra 5% discount' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3.5 hover:bg-white/10 transition-colors">
                        <span className="text-xl shrink-0 drop-shadow-md">{item.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[12px] font-bold text-slate-200 truncate">{item.title}</span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-950/50 text-cyan-400 border border-cyan-500/30 shrink-0 tracking-wider uppercase shadow-sm">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
               </div>
            )}
            
            {subTierView === 'MAX' && (
               <div className="space-y-4">
                 <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 text-center">
                    <h3 className="text-xl font-black text-white">Ultra (MAX) Plan</h3>
                    <p className="text-xs text-slate-300 mt-2">Get the ultimate study experience with all features!</p>
                    <button className="mt-4 px-6 py-2 bg-purple-500 text-white font-black rounded-full shadow-lg" onClick={() => initiatePurchase({name: 'MAX Plan'})}>Subscribe Now</button>
                 </div>
                 
               </div>
            )}
          </div>
        )}

        {tierType === 'CREDITS' && (
          <div className="space-y-4 text-center p-6 border border-emerald-500/30 bg-emerald-500/10 rounded-2xl">
             <h3 className="text-xl font-black text-white">Credit Store</h3>
             <p className="text-slate-300 text-xs">Buy credits to unlock premium content individually.</p>
             <button className="mt-4 px-6 py-2 bg-emerald-500 text-slate-950 font-black rounded-full shadow-lg" onClick={() => initiatePurchase({name: 'Credits'})}>Get Credits</button>
          </div>
        )}

        {tierType === 'DIAMONDS' && (
          <div className="space-y-4">
            <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/10 mb-4">
               <button onClick={() => setDiamondSubTab('PACKS')} className={`flex-1 py-2 rounded-xl font-black text-xs transition-all ${diamondSubTab === 'PACKS' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>💎 Packs</button>
               <button onClick={() => setDiamondSubTab('WEEKLY')} className={`flex-1 py-2 rounded-xl font-black text-xs transition-all ${diamondSubTab === 'WEEKLY' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>⭐ Weekly</button>
               <button onClick={() => setDiamondSubTab('MONTHLY')} className={`flex-1 py-2 rounded-xl font-black text-xs transition-all ${diamondSubTab === 'MONTHLY' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>🌟 Monthly</button>
            </div>
            
            {diamondSubTab === 'PACKS' && (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIAMOND_PACKS.map(pack => (
                    <div key={pack.id} className="rounded-2xl p-4 border border-sky-400/20 bg-slate-900 shadow-md">
                       <h4 className="text-white font-bold">{pack.name}</h4>
                       <p className="text-sky-300 text-xs font-black my-1">{pack.diamonds} 💎</p>
                       <p className="text-slate-400 text-[10px] mb-3">Lifetime diamonds to unlock premium content.</p>
                       <button onClick={() => initiatePurchase(pack)} className="w-full py-2 bg-sky-500 text-slate-950 font-black rounded-xl shadow-md text-xs">Buy for ₹{pack.price}</button>
                    </div>
                  ))}
               </div>
            )}
            
            {diamondSubTab === 'WEEKLY' && (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIAMOND_SUBSCRIPTION_PLANS.filter(p => p.planType === 'WEEKLY').map(plan => (
                    <div key={plan.id} className="rounded-2xl p-4 border border-sky-400/20 bg-slate-900 shadow-md">
                       <h4 className="text-white font-bold">{plan.name}</h4>
                       <p className="text-sky-300 text-xs font-black my-1">{plan.totalDiamonds} 💎 (Over 7 Days)</p>
                       <p className="text-slate-400 text-[10px] mb-3">{plan.dailyDiamonds} 💎 claim daily.</p>
                       <button onClick={() => initiatePurchase(plan)} className="w-full py-2 bg-sky-500 text-slate-950 font-black rounded-xl shadow-md text-xs">Subscribe — ₹{plan.price}</button>
                    </div>
                  ))}
               </div>
            )}
            
            {diamondSubTab === 'MONTHLY' && (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIAMOND_SUBSCRIPTION_PLANS.filter(p => p.planType === 'MONTHLY').map(plan => (
                    <div key={plan.id} className="rounded-2xl p-4 border border-sky-400/20 bg-slate-900 shadow-md">
                       <h4 className="text-white font-bold">{plan.name}</h4>
                       <p className="text-sky-300 text-xs font-black my-1">{plan.totalDiamonds} 💎 (Over 30 Days)</p>
                       <p className="text-slate-400 text-[10px] mb-3">{plan.dailyDiamonds} 💎 claim daily.</p>
                       <button onClick={() => initiatePurchase(plan)} className="w-full py-2 bg-sky-500 text-slate-950 font-black rounded-xl shadow-md text-xs">Subscribe — ₹{plan.price}</button>
                    </div>
                  ))}
               </div>
            )}
          </div>
        )}

        {tierType === 'EXCHANGE' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
                <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">🔄</span> 
                Currency Exchange
              </h2>
              <p className="text-xs text-slate-400">Convert your Diamonds into Credits</p>
            </div>
            
            <div className="rounded-2xl p-5 border border-emerald-500/30 bg-slate-900/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Currency Swap System</span>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span className="text-sky-400">💎 Diamonds</span>
                    <ArrowLeftRight size={16} className="text-emerald-400" />
                    <span>🪙 Credits</span>
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-black">
                  1 💎 = {CREDITS_PER_DIAMOND} 🪙
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Aap apne paas maujood Diamonds ko instant <strong>Credits</strong> me badal sakte hain.
              </p>

              {exchangeMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold text-center ${exchangeMsg.startsWith('✅') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-red-500/20 text-red-300 border border-red-400/40'}`}>
                  {exchangeMsg}
                </div>
              )}

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Exchange karne ke liye Diamonds:</label>
                  <span className="text-xs text-sky-300 font-bold">Aapke paas: {user.diamonds ?? 0} 💎</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={user.diamonds ?? 0}
                    value={exchangeDiamondsCount}
                    onChange={e => setExchangeDiamondsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-28 px-3 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-white font-black text-base text-center focus:outline-none focus:border-sky-400"
                  />
                  <div className="flex-1 flex gap-1.5">
                    {[1, 5, 10, 25].map(cnt => (
                      <button key={cnt} type="button" onClick={() => setExchangeDiamondsCount(cnt)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-black text-slate-300 border border-white/5 active:scale-95">
                        {cnt}💎
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs font-medium text-slate-400">Aapko milenge:</span>
                  <span className="text-lg font-black text-amber-400">
                    +{(exchangeDiamondsCount * CREDITS_PER_DIAMOND).toLocaleString('en-IN')} 🪙 Credits
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if ((user.diamonds ?? 0) < exchangeDiamondsCount) {
                    setExchangeMsg(`⚠️ Diamonds kam hain!`);
                    return;
                  }
                  const res = exchangeDiamondsForCredits(user, exchangeDiamondsCount);
                  if (res) {
                    const ok = await saveUserToLive(res.updatedUser);
                    if (ok) {
                      onUserUpdate(res.updatedUser);
                      setExchangeMsg(`✅ Badhai! ${exchangeDiamondsCount} 💎 exchange ho gaye aur +${res.creditsEarned} 🪙 Credits mil gaye!`);
                      setTimeout(() => setExchangeMsg(null), 5000);
                    }
                  }
                }}
                disabled={(user.diamonds ?? 0) < exchangeDiamondsCount}
                className="w-full py-3.5 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Coins size={16} />
                <span>Exchange Karein: {exchangeDiamondsCount} 💎 ➔ {exchangeDiamondsCount * CREDITS_PER_DIAMOND} 🪙</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
