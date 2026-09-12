// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { User, CreditPackage, SystemSettings } from '../types';
import {
  Sparkles, Check, MessageSquare, Lock, Ticket, ShieldCheck, Star,
  ChevronRight, ChevronDown, Flame, BadgeCheck, History, TrendingDown,
  Calendar, Clock, Crown, DollarSign, ArrowLeft, Zap, Gift, Coins,
  Package, Wallet, X, ArrowLeftRight, HelpCircle
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
  DIAMOND_SUBSCRIPTION_PLANS,
  CREDITS_PER_DIAMOND,
  exchangeDiamondsForCredits,
  claimDailyDiamonds,
  canClaimDailyDiamonds,
} from '../utils/diamondUtils';

interface Props {
  user: User;
  settings?: SystemSettings;
  onUserUpdate: (user: User) => void;
  renderEarnContent?: React.ReactNode;
  onBack?: () => void;
  themeColor?: string;
  tierTheme?: any;
  initialTier?: 'SUBSCRIPTION' | 'CREDITS' | 'DIAMONDS' | 'EXCHANGE' | 'HISTORY';
}

/* ─── Fixed color palette ─── */
const C = {
  bg:           '#07070e',
  surface:      '#0f0f1a',
  surfaceHigh:  '#181826',
  surfaceMid:   '#13131f',
  border:       'rgba(255,255,255,0.07)',
  borderMed:    'rgba(255,255,255,0.13)',
  text:         '#f1f5f9',
  textMuted:    '#64748b',
  textDim:      '#2d3748',

  pro:          '#22d3ee',
  proBg:        'rgba(34,211,238,0.08)',
  proBorder:    'rgba(34,211,238,0.30)',
  proGlow:      'rgba(34,211,238,0.20)',
  proGrad:      'linear-gradient(135deg,#0891b2 0%,#22d3ee 60%,#67e8f9 100%)',

  max:          '#c084fc',
  maxBg:        'rgba(192,132,252,0.08)',
  maxBorder:    'rgba(192,132,252,0.30)',
  maxGlow:      'rgba(192,132,252,0.20)',
  maxGrad:      'linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#e879f9 100%)',

  gold:         '#fbbf24',
  goldBg:       'rgba(251,191,36,0.10)',
  goldBorder:   'rgba(251,191,36,0.28)',

  earn:         '#34d399',
  earnBg:       'rgba(52,211,153,0.08)',
  earnBorder:   'rgba(52,211,153,0.28)',

  green:        '#34d399',
  greenBg:      'rgba(52,211,153,0.09)',
  greenBorder:  'rgba(52,211,153,0.30)',

  diamond:      '#38bdf8',
  diamondBg:    'rgba(56,189,248,0.12)',
  diamondBorder:'rgba(56,189,248,0.35)',
  diamondGlow:  'rgba(56,189,248,0.25)',
};

/* ─── Unified Diamond Constants ─── */
const DIAMOND_SUB_DURATIONS_LIST = [
  { id: '7_DAYS', label: '7D', days: 7, ratePerDiamond: 1.80 },
  { id: '30_DAYS', label: '1M', days: 30, ratePerDiamond: 1.50 },
  { id: '90_DAYS', label: '3M', days: 90, ratePerDiamond: 1.30 },
  { id: '180_DAYS', label: '6M', days: 180, ratePerDiamond: 1.15 },
  { id: '365_DAYS', label: '1Y', days: 365, ratePerDiamond: 1.00 },
];

const diamondUnifiedTemplates = [
  {
    id: 'starter_diamond',
    name: 'Starter Diamond Pass',
    icon: '💎',
    dailyDiamonds: 10,
    features: [
      'Daily 10 💎 Drop Claim',
      'Chapters Permanently Unlock',
      'Lifetime Content Access',
      'Instant Credit Swap Ready'
    ]
  },
  {
    id: 'active_diamond',
    name: 'Active Diamond Pass',
    icon: '⚡',
    dailyDiamonds: 20,
    features: [
      'Daily 20 💎 Drop Claim',
      'Tez Chapters Unlocking',
      'Permanent Vault Access',
      '1 💎 = 30 🪙 Auto Swap'
    ]
  },
  {
    id: 'premium_diamond',
    name: 'Premium Diamond Pass',
    icon: '🌟',
    dailyDiamonds: 30,
    features: [
      'Daily 30 💎 Drop Claim',
      'Premium Content Unlocks',
      'Heavy Diamond Reserve',
      'Priority Support Claim'
    ]
  },
  {
    id: 'elite_diamond',
    name: 'Elite Diamond Pass',
    icon: '👑',
    dailyDiamonds: 50,
    features: [
      'Daily 50 💎 Huge Drop',
      'Sabse Tez Unlock Speed',
      'Max Savings per Diamond',
      'VIP Lifetime Diamond Stack'
    ]
  }
];

/* ─── Subscription History ─── */
const SubHistory: React.FC<{ user: User; onBack: () => void }> = ({ user, onBack }) => {
  const history = user.subscriptionHistory || [];
  const totalPaid = history.reduce((s, i) => s + (i.price || 0), 0);
  const totalFree = history.reduce((s, i) => i.isFree ? s + (i.originalPrice || 0) : s, 0);
  const sorted = [...history].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div className="min-h-screen pb-28 animate-in fade-in slide-in-from-right duration-300" style={{ background: C.bg }}>
      <div className="px-4 pt-6 pb-5" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-11 h-11 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: C.surfaceHigh, border: `1px solid ${C.borderMed}` }}>
            <ArrowLeft size={18} color={C.text} />
          </button>
          <div>
            <h2 className="text-lg font-black" style={{ color: C.text }}>Subscription History</h2>
            <p className="text-[11px] font-medium" style={{ color: C.textMuted }}>Aapke sabhi plans ka record</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {history.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4" style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(52,211,153,0.2)' }}>
                <TrendingDown size={16} color={C.green} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-wide mb-1" style={{ color: C.textMuted }}>Total Paid</p>
              <p className="text-2xl font-black" style={{ color: C.text }}>₹{totalPaid}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: C.proBg, border: `1px solid ${C.proBorder}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(34,211,238,0.2)' }}>
                <Gift size={16} color={C.pro} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-wide mb-1" style={{ color: C.textMuted }}>Free Value</p>
              <p className="text-2xl font-black" style={{ color: C.pro }}>₹{totalFree}</p>
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: C.textMuted }}>
            <History size={12} /> Recent Plans
          </p>
          {sorted.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ border: `1.5px dashed ${C.border}` }}>
              <Crown size={38} className="mx-auto mb-3" style={{ color: C.textDim }} />
              <p className="font-bold text-sm mb-1" style={{ color: C.textMuted }}>Abhi tak koi plan nahi</p>
              <p className="text-xs" style={{ color: C.textDim }}>Pehla plan lo — yahan record aayega</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sorted.map((item) => (
                <div key={item.id} className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: item.isFree ? C.greenBg : C.maxBg }}>
                      {item.isFree ? <Gift size={18} color={C.green} /> : <DollarSign size={18} color={C.max} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm" style={{ color: C.text }}>
                        {item.tier === 'LIFETIME' ? 'Lifetime Access' : `${item.durationHours < 24 ? item.durationHours + ' Hours' : Math.ceil(item.durationHours / 24) + ' Days'} Plan`}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>{item.level} · {item.grantSource}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm" style={{ color: item.isFree ? C.green : C.text }}>
                        {item.isFree ? 'FREE' : `₹${item.price}`}
                      </p>
                      {item.isFree && <p className="text-[10px] line-through" style={{ color: C.textDim }}>₹{item.originalPrice}</p>}
                    </div>
                  </div>
                  <div className="flex justify-between rounded-xl px-3 py-2" style={{ background: C.surfaceHigh }}>
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.textMuted }}>
                      <Calendar size={10} />
                      <span>{new Date(item.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.textMuted }}>
                      <Clock size={10} />
                      <span>{item.tier === 'LIFETIME' ? 'Forever' : new Date(item.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Credit Price Helper ─── */
function getCreditPrice(planDuration: string, isUltra: boolean, plan?: any, settings?: SystemSettings): number {
  if (plan) {
    if (isUltra && typeof plan.creditPriceUltra === 'number' && plan.creditPriceUltra > 0) {
      return plan.creditPriceUltra;
    }
    if (!isUltra && typeof plan.creditPriceBasic === 'number' && plan.creditPriceBasic > 0) {
      return plan.creditPriceBasic;
    }
  }

  const d = (planDuration || '').toLowerCase();
  const sp = settings?.subscriptionCreditPrices;

  if (d.includes('year') || d.includes('365') || d.includes('annual') || d.includes('1 yr')) {
    if (isUltra && typeof sp?.yearlyUltra === 'number' && sp.yearlyUltra > 0) return sp.yearlyUltra;
    if (!isUltra && typeof sp?.yearlyBasic === 'number' && sp.yearlyBasic > 0) return sp.yearlyBasic;
    return isUltra ? 100000 : 75000;
  } else if (d.includes('3 month') || d.includes('90') || d.includes('quarter') || d.includes('tri')) {
    if (isUltra && typeof sp?.threeMonthUltra === 'number' && sp.threeMonthUltra > 0) return sp.threeMonthUltra;
    if (!isUltra && typeof sp?.threeMonthBasic === 'number' && sp.threeMonthBasic > 0) return sp.threeMonthBasic;
    return isUltra ? 30000 : 22500;
  } else if (d.includes('month') || d.includes('30')) {
    if (isUltra && typeof sp?.monthlyUltra === 'number' && sp.monthlyUltra > 0) return sp.monthlyUltra;
    if (!isUltra && typeof sp?.monthlyBasic === 'number' && sp.monthlyBasic > 0) return sp.monthlyBasic;
    return isUltra ? 12000 : 9000;
  } else if (d.includes('week') || d.includes('7')) {
    if (isUltra && typeof sp?.weeklyUltra === 'number' && sp.weeklyUltra > 0) return sp.weeklyUltra;
    if (!isUltra && typeof sp?.weeklyBasic === 'number' && sp.weeklyBasic > 0) return sp.weeklyBasic;
    return isUltra ? 4000 : 3000;
  }

  return isUltra ? 3500 : 2625;
}

function isDiscountEventLive(discountEvent?: any): boolean {
  if (!discountEvent?.enabled) return false;
  const now = Date.now();
  const startsAt = discountEvent.startsAt ? new Date(discountEvent.startsAt).getTime() : 0;
  const endsAt = discountEvent.endsAt ? new Date(discountEvent.endsAt).getTime() : Infinity;
  if (Number.isNaN(startsAt) || Number.isNaN(endsAt)) return false;
  return now >= startsAt && now < endsAt;
}

function isDiscountAudienceAllowed(discountEvent: any, isSubscribed: boolean): boolean {
  return isSubscribed
    ? discountEvent?.showToPremiumUsers !== false
    : discountEvent?.showToFreeUsers !== false;
}

/* ─── Tier Daily Subscription Coin Claim Card ─── */
function TierDailyClaimCard({
  targetTier,
  userId,
  user: u,
  settings,
  onUpdateUser,
}: {
  targetTier: 'PRO' | 'MAX_PRO';
  userId: string;
  user: any;
  settings?: SystemSettings;
  onUpdateUser?: (u: any) => void;
}) {
  const subTier: UserSubTier = getUserSubTier(u ?? {});
  const [routineData, setRoutineDataRaw] = useState(() => {
    const d = loadRoutineData(userId);
    const reset = checkAndResetDaily(d);
    return ensureTodayClaimEntry(reset, getUserSubTier(u ?? {}), settings);
  });

  const unclaimed = getUnclaimedCoins(routineData, targetTier);
  const isTargetActive = subTier === targetTier;

  if (!isTargetActive && unclaimed <= 0) return null;

  const dailyAmt = getDailyClaimAmount(targetTier, settings);
  const isMax = targetTier === 'MAX_PRO';
  const grad = isMax ? 'linear-gradient(135deg,#7c3aed,#a855f7,#e879f9)' : 'linear-gradient(135deg,#0891b2,#22d3ee,#67e8f9)';
  const borderC = isMax ? C.maxBorder : C.proBorder;
  const bgC = isMax ? C.maxBg : C.proBg;
  const label = isMax ? 'Max' : 'Pro';

  const handleClaim = async () => {
    const { data: updated, earned } = claimAllPendingCoins(routineData, targetTier);
    if (earned > 0 && onUpdateUser && u) {
      const updatedUser = { ...u, credits: (u.credits || 0) + earned };
      if (!await saveUserToLive(updatedUser)) {
        window.alert("Coins save nahi ho paaye. Internet check karke dobara try karein.");
        return;
      }
      onUpdateUser(updatedUser);
    }
    setRoutineDataRaw(updated);
    saveRoutineData(userId, updated);
  };

  return (
    <div className="rounded-2xl p-4 mb-5 shadow-md" style={{ background: bgC, border: `1.5px solid ${borderC}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: grad }}>
            <Gift size={15} color="#fff" />
          </div>
          <div>
            <p className="text-xs font-black" style={{ color: C.text }}>{label} Daily Reward</p>
            <p className="text-[10px] font-medium" style={{ color: C.textMuted }}>Roz {dailyAmt} 🪙 · Kabhi expire nahi</p>
          </div>
        </div>
        <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: C.goldBg, color: C.gold, border: `1px solid ${C.goldBorder}` }}>
          🪙 {dailyAmt}
        </span>
      </div>
      {unclaimed > 0 ? (
        <>
          {unclaimed > dailyAmt && (
            <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2" style={{ background: 'rgba(251,191,36,0.10)', border: `1px solid ${C.goldBorder}` }}>
              <p className="text-[10px] font-black" style={{ color: C.gold }}>
                {Math.floor(unclaimed / dailyAmt)} din ka stack = {unclaimed} 🪙!
              </p>
            </div>
          )}
          <button onClick={handleClaim}
            className="w-full py-3 rounded-xl font-black text-sm active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg"
            style={{ background: grad, color: '#fff', boxShadow: isMax ? '0 4px 14px rgba(168,85,247,0.35)' : '0 4px 14px rgba(34,211,238,0.25)' }}>
            <Gift size={15} /> Claim {unclaimed} 🪙 Karo
          </button>
        </>
      ) : (
        <div className="py-2.5 rounded-xl flex items-center justify-center gap-2"
          style={{ background: 'rgba(52,211,153,0.10)', border: `1px solid ${C.greenBorder}` }}>
          <Check size={14} color={C.green} />
          <span className="text-xs font-black" style={{ color: C.green }}>Aaj ka {label} Daily Reward claim ho gaya! ({dailyAmt} 🪙) ✅</span>
        </div>
      )}
    </div>
  );
}

/* ─── Main Store Screen ─── */
export const Store: React.FC<Props> = ({ user, settings, onUserUpdate, onBack, initialTier }) => {
  const [tierType, setTierType] = useState<'SUBSCRIPTION' | 'CREDITS' | 'DIAMONDS' | 'EXCHANGE' | 'HISTORY'>(() =>
    initialTier || 'SUBSCRIPTION'
  );

  useEffect(() => {
    if (initialTier) setTierType(initialTier);
  }, [initialTier]);

  /* Free Plan Ad/Comparison Modal State */
  const [showFreeAdModal, setShowFreeAdModal] = useState(false);

  // Check 1st time user visit for Free Plan Ad
  useEffect(() => {
    const key = `free_plan_ad_seen_${user.id}`;
    const alreadySeen = localStorage.getItem(key);
    if (!alreadySeen) {
      setShowFreeAdModal(true);
    }
  }, [user.id]);

  const handleDismissFreeAd = () => {
    const key = `free_plan_ad_seen_${user.id}`;
    localStorage.setItem(key, 'true');
    setShowFreeAdModal(false);
  };

  /* Diamond State */
  const [diamondSubTab, setDiamondSubTab] = useState<'PACKS' | 'SUBSCRIPTION'>('SUBSCRIPTION');
  const [selectedDiamondDurations, setSelectedDiamondDurations] = useState<Record<string, string>>({});
  const [exchangeDiamondsCount, setExchangeDiamondsCount] = useState<number>(1);
  const [exchangeMsg, setExchangeMsg] = useState<string | null>(null);
  const [claimingDiamonds, setClaimingDiamonds] = useState(false);
  const [diamondClaimSuccessMsg, setDiamondClaimSuccessMsg] = useState<string | null>(null);

  /* Plan Select State */
  const [selectedProPlanId, setSelectedProPlanId] = useState<string | null>(null);
  const [selectedMaxPlanId, setSelectedMaxPlanId] = useState<string | null>(null);
  const [selectedTierForPurchase, setSelectedTierForPurchase] = useState<'BASIC' | 'ULTRA'>('BASIC');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const packages = settings?.packages || [];
  const subscriptionPlans = settings?.subscriptionPlans || [];
  const isCreditSubAllowed = settings?.allowCreditSubscription !== false;
  const [creditSubTab, setCreditSubTab] = useState<'PASS' | 'PACKAGES'>('PASS');
  const [planDurations, setPlanDurations] = useState<Record<string, CreditSubDurationId>>({});
  const [showAllTiersModal, setShowAllTiersModal] = useState(false);
  const [claimingStorePass, setClaimingStorePass] = useState(false);
  const [passClaimSuccessMsg, setPassClaimSuccessMsg] = useState<string | null>(null);

  const handleClaimStorePass = async () => {
    if (!user || claimingStorePass) return;
    setClaimingStorePass(true);
    try {
      const res = claimDailyCreditSub(user);
      if (res) {
        const ok = await saveUserToLive(res.updatedUser);
        if (ok) {
          onUserUpdate(res.updatedUser);
          setPassClaimSuccessMsg(`🎉 +${res.earned} Daily Credits Claim Ho Gaye! Naya Balance: ${(res.updatedUser.credits || 0).toLocaleString('en-IN')} CR 🪙`);
          setTimeout(() => setPassClaimSuccessMsg(null), 6000);
        }
      }
    } finally {
      setClaimingStorePass(false);
    }
  };

  const totalScore = user.totalScore || 0;
  const scoreDiscount = getScoreDiscountFromScore(totalScore);
  const scoreTier = getLevelInfo(totalScore);

  const activeStoreDiscount =
    (user.storeDiscount && user.storeDiscount > 0 && scoreTier.level <= 4 && totalScore >= 100)
      ? user.storeDiscount : 0;

  const [visitCount, setVisitCount] = useState<number>(0);
  const visitDiscountRules = settings?.storeVisitDiscountRules || [];
  const visitDiscountEnabled = !!(settings?.storeVisitDiscountEnabled && visitDiscountRules.length > 0);
  const userSubTier: 'FREE' | 'BASIC' | 'ULTRA' =
    (user as any).subscriptionLevel === 'ULTRA' ? 'ULTRA'
    : (user as any).subscriptionLevel === 'BASIC' ? 'BASIC' : 'FREE';
  const eligibleTiers: ('FREE' | 'BASIC' | 'ULTRA')[] = settings?.storeVisitDiscountTiers || ['FREE'];
  const isEligibleForVisitDiscount = visitDiscountEnabled && eligibleTiers.includes(userSubTier);
  const visitDiscount = isEligibleForVisitDiscount
    ? (visitDiscountRules.filter(r => visitCount >= r.visits).sort((a, b) => b.discountPercent - a.discountPercent)[0]?.discountPercent || 0)
    : 0;

  useEffect(() => {
    if (!visitDiscountEnabled) return;
    const key = `store_visit_total_${user.id}`;
    const prev = parseInt(localStorage.getItem(key) || '0', 10);
    localStorage.setItem(key, String(prev + 1));
    setVisitCount(prev + 1);
  }, [user.id, visitDiscountEnabled]);

  useEffect(() => {
    if (subscriptionPlans.length > 0) {
      const defaultPlan = subscriptionPlans.find(p => p.name.includes('Monthly')) || subscriptionPlans[0];
      if (!selectedProPlanId) setSelectedProPlanId(defaultPlan.id);
      if (!selectedMaxPlanId) setSelectedMaxPlanId(defaultPlan.id);
      if (!selectedPlanId) setSelectedPlanId(defaultPlan.id);
    }
  }, [subscriptionPlans, selectedProPlanId, selectedMaxPlanId, selectedPlanId]);

  const selectedPlan = subscriptionPlans.find(p => p.id === selectedPlanId);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState<any>(null);

  const event = settings?.specialDiscountEvent;
  const isSubscribed = user.isPremium && user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();

  const [creditPurchaseMsg, setCreditPurchaseMsg] = useState<string | null>(null);
  const [showPaymentChooser, setShowPaymentChooser] = useState(false);
  const [showCreditConfirm, setShowCreditConfirm] = useState(false);
  const [creditConfirmLoading, setCreditConfirmLoading] = useState(false);

  const handleCreditPurchase = async (plan: any) => {
    if (!isCreditSubAllowed) {
      setCreditPurchaseMsg('❌ Admin ne credits se subscription khareedna band kiya hua hai.');
      setTimeout(() => setCreditPurchaseMsg(null), 4000);
      return;
    }
    const isUltra = selectedTierForPurchase === 'ULTRA';
    const dur = (plan.duration || '').toLowerCase();
    const pName = (plan.name || '').toLowerCase();
    if (pName.includes('lifetime') || dur.includes('lifetime') || plan.tier === 'LIFETIME') {
      setCreditPurchaseMsg('❌ Lifetime plan credits se nahi kharida ja sakta.');
      setTimeout(() => setCreditPurchaseMsg(null), 4000);
      return;
    }
    const creditCost = getPlanCreditCost(plan, isUltra);
    const userCredits = getTotalCredits(user);
    if (userCredits < creditCost) {
      setCreditPurchaseMsg(`Credits kam hain! Chahiye: ${creditCost.toLocaleString('en-IN')} CR`);
      setTimeout(() => setCreditPurchaseMsg(null), 4000);
      return;
    }

    const now = new Date();
    let days = 30;
    if (dur.includes('year') || dur.includes('365') || dur.includes('annual')) days = 365;
    else if (dur.includes('3 month') || dur.includes('90') || dur.includes('quarter')) days = 90;
    else if (dur.includes('month') || dur.includes('30')) days = 30;
    else if (dur.includes('week') || dur.includes('7')) days = 7;

    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const subTier = days <= 7 ? 'WEEKLY' : days <= 30 ? 'MONTHLY' : days <= 90 ? '3_MONTHLY' : 'YEARLY';
    const subLevel = isUltra ? 'ULTRA' : 'BASIC';
    const newSub = { id: `sub_${Date.now()}`, tier: subTier, level: subLevel, startDate: now.toISOString(), endDate: endDate.toISOString(), source: 'CREDITS' };
    const histEntry = {
      id: `hist-${Date.now()}`, tier: subTier, level: subLevel,
      startDate: now.toISOString(), endDate: endDate.toISOString(),
      durationHours: days * 24, price: 0, originalPrice: creditCost, isFree: false, grantSource: 'CREDITS'
    };
    const deductedUser = applyDeduction(user, creditCost);
    if (!deductedUser) {
      setCreditPurchaseMsg(`Credits kam hain! Chahiye: ${creditCost.toLocaleString('en-IN')} CR`);
      setTimeout(() => setCreditPurchaseMsg(null), 4000);
      return;
    }

    const baseUser = {
      ...deductedUser,
      isPremium: true,
      subscriptionSource: 'CREDITS',
      grantedByAdmin: false,
      subscriptionHistory: [histEntry, ...(user.subscriptionHistory || [])],
    };
    const updatedUser = addSubscription(baseUser, newSub as any);

    try {
      setCreditConfirmLoading(true);
      if (!await saveUserToLive(updatedUser)) throw new Error('Subscription purchase failed');
      onUserUpdate(updatedUser);
      try {
        const planLabel = isUltra ? 'MAX (Ultra)' : 'PRO (Basic)';
        const durLabel = days === 365 ? '1 Saal' : days === 90 ? '3 Mahine' : days === 30 ? '1 Mahina' : `${days} Din`;
        recordCreditTx(
          user.id,
          -creditCost,
          'SPEND_SUBSCRIPTION',
          `Subscription Kharida: ${planLabel} — ${durLabel}`,
          updatedUser.credits,
        );
      } catch {}
      setShowCreditConfirm(false);
      setShowPaymentChooser(false);
      setCreditPurchaseMsg(`✅ ${isUltra ? 'MAX' : 'PRO'} Plan activate! ${days} din ke liye. (${creditCost.toLocaleString('en-IN')} CR kata)`);
      setTimeout(() => setCreditPurchaseMsg(null), 5000);
    } catch {
      setCreditPurchaseMsg('❌ Kuch galat hua. Dobara try karo.');
      setTimeout(() => setCreditPurchaseMsg(null), 4000);
    } finally {
      setCreditConfirmLoading(false);
    }
  };

  const handleSupportClick = (numEntry: any) => {
    if (!purchaseItem) return;
    if (purchaseItem.isDiamondPack) {
      const msg = `Hello Admin, I want to buy Diamond Pack:\n\nPack: ${purchaseItem.name}\nPrice: ₹${purchaseItem.price}\nDiamonds: 💎 ${purchaseItem.diamonds}\nUser ID: ${user.id}\nNote: Permanent Premium Content Unlocks\n\nPlease share payment details / QR code.`;
      window.open(`https://wa.me/91${numEntry.number}?text=${encodeURIComponent(msg)}`, '_blank');
      setShowSupportModal(false);
      return;
    }
    if (purchaseItem.isDiamondSub) {
      const msg = `Hello Admin, I want to buy Diamond Subscription:\n\nPlan: ${purchaseItem.name}\nPrice: ₹${purchaseItem.price}\nDaily Diamonds: 💎 ${purchaseItem.dailyDiamonds}/day\nDuration: ${purchaseItem.durationDays} Days (Total 💎 ${purchaseItem.totalDiamonds})\nUser ID: ${user.id}\n\nPlease share payment details / activate my diamond subscription.`;
      window.open(`https://wa.me/91${numEntry.number}?text=${encodeURIComponent(msg)}`, '_blank');
      setShowSupportModal(false);
      return;
    }
    if (purchaseItem.isCreditSub || purchaseItem.dailyCredits !== undefined) {
      const price = purchaseItem.finalPrice !== undefined ? purchaseItem.finalPrice : purchaseItem.price;
      const totalCreds = (purchaseItem.dailyCredits || 0) * (purchaseItem.durationDays || 30);
      const discountDetails = purchaseItem.discountPercent > 0
        ? `\nDiscount Applied: ${purchaseItem.discountPercent}% OFF`
        : '';
      const durationText = purchaseItem.durationLabel
        ? `${purchaseItem.durationLabel} (${purchaseItem.durationDays || 30} Days)`
        : `${purchaseItem.durationDays || 30} Days`;
      const msg = `Hello Admin, I want to subscribe to Daily Credit Pass:\n\nPlan: ${purchaseItem.name}\nPrice: ₹${price}${discountDetails}\nDaily Credits: ${purchaseItem.dailyCredits} CR/day\nValidity: ${durationText} (Total ${totalCreds.toLocaleString('en-IN')} Credits)\nUser ID: ${user.id}\nNote: Daily Credits Subscription (No Premium Content Unlock)\n\nPlease share payment details / activate my pass.`;
      window.open(`https://wa.me/91${numEntry.number}?text=${encodeURIComponent(msg)}`, '_blank');
      setShowSupportModal(false);
      return;
    }
    const isSub = purchaseItem.duration !== undefined;
    const isUltraPurchase = selectedTierForPurchase === 'ULTRA';
    const price = isSub
      ? (purchaseItem.finalPrice !== undefined ? purchaseItem.finalPrice : (isUltraPurchase ? purchaseItem.ultraPrice : purchaseItem.basicPrice))
      : purchaseItem.price;
    const features = isSub ? (isUltraPurchase ? 'PDF + Videos + AI Studio (Max)' : 'MCQ + Notes (Pro)') : `${purchaseItem.credits} Credits`;
    const effectiveDisc = purchaseItem.discountPercent !== undefined ? purchaseItem.discountPercent : totalDiscount;
    const discountNote = isSub && effectiveDisc > 0
      ? `\nDiscount Applied: ${effectiveDisc}% OFF${purchaseItem.durDiscount !== undefined ? ` (Duration Discount: ${purchaseItem.durDiscount}% OFF)` : ''}`
      : '';
    const msg = `Hello Admin, I want to buy:\n\nItem: ${purchaseItem.name} ${isSub ? `(${isUltraPurchase ? 'MAX VIP' : 'PRO'})` : ''}\nPrice: ₹${price}${discountNote}\nUser ID: ${user.id}\nDetails: ${features}\n\nPlease share payment details.`;
    window.open(`https://wa.me/91${numEntry.number}?text=${encodeURIComponent(msg)}`, '_blank');
    setShowSupportModal(false);
  };

  const initiatePurchase = (item: any) => { setPurchaseItem(item); setShowSupportModal(true); };

  const isCreditsTab = tierType === 'CREDITS';
  const isDiamondsTab = tierType === 'DIAMONDS';
  const isExchangeTab = tierType === 'EXCHANGE';
  const isPro = selectedTierForPurchase === 'BASIC';

  const ac = isCreditsTab
    ? { color: C.gold, bg: C.goldBg, border: C.goldBorder, glow: 'rgba(251,191,36,0.22)', grad: 'linear-gradient(135deg,#d97706,#fbbf24)', pill: 'rgba(251,191,36,0.14)', label: 'CREDITS', emoji: '🪙' }
    : isDiamondsTab
    ? { color: C.diamond, bg: C.diamondBg, border: C.diamondBorder, glow: C.diamondGlow, grad: 'linear-gradient(135deg,#0284c7,#38bdf8)', pill: 'rgba(56,189,248,0.14)', label: 'DIAMONDS', emoji: '💎' }
    : isExchangeTab
    ? { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', glow: 'rgba(16,185,129,0.18)', grad: 'linear-gradient(135deg,#059669,#10b981)', pill: 'rgba(16,185,129,0.14)', label: 'EXCHANGE', emoji: '🔄' }
    : selectedTierForPurchase === 'BASIC'
    ? { color: C.pro, bg: C.proBg, border: C.proBorder, glow: C.proGlow, grad: C.proGrad, pill: 'rgba(34,211,238,0.14)', label: 'PRO', emoji: '⭐' }
    : { color: C.max, bg: C.maxBg, border: C.maxBorder, glow: C.maxGlow, grad: C.maxGrad, pill: 'rgba(192,132,252,0.14)', label: 'MAX', emoji: '👑' };

  const allTabs = [
    { id: 'SUBSCRIPTION' as const, label: 'VIP Plans',    emoji: '👑', color: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.35)', glow: 'rgba(192,132,252,0.25)' },
    { id: 'CREDITS'      as const, label: 'Credits',      emoji: '🪙', color: C.gold,   bg: C.goldBg,                  border: C.goldBorder,            glow: 'rgba(251,191,36,0.22)' },
    { id: 'DIAMONDS'     as const, label: 'Diamonds',     emoji: '💎', color: C.diamond,bg: C.diamondBg,               border: C.diamondBorder,         glow: C.diamondGlow },
    { id: 'EXCHANGE'     as const, label: 'Exchange',     emoji: '🔄', color: '#10b981',bg: 'rgba(16,185,129,0.12)',border: 'rgba(16,185,129,0.3)',glow: 'rgba(16,185,129,0.18)' },
  ];

  const isUltraUser = user.isPremium && (user.subscriptionLevel === 'ULTRA' || (user.subscriptionLevel as any) === 'PRO');
  const isBasicUser = user.isPremium && user.subscriptionLevel === 'BASIC';

  const subDiscount = isSubscribed ? (isUltraUser ? 10 : 5) : 0;
  const userBonusDiscount = (activeStoreDiscount > 0 ? activeStoreDiscount : 0) +
    (scoreDiscount > 0 ? scoreDiscount : 0) +
    (visitDiscount > 0 ? visitDiscount : 0);
  const baseAccountDiscount = subDiscount + userBonusDiscount;
  const eventDiscountPercent = (isDiscountEventLive(event) && event?.discountPercent) ? Number(event.discountPercent) : 0;

  const validityEvent = settings?.validityDiscountEvent;
  const isValidityDiscountActive = (() => {
    if (validityEvent) {
      if (validityEvent.enabled === false) return false;
      if (!isDiscountEventLive(validityEvent)) return false;
      if (!isDiscountAudienceAllowed(validityEvent, !!isSubscribed)) return false;
      return true;
    }
    return true;
  })();

  const getCreditSubDurationDiscount = (durationId: CreditSubDurationId): number => {
    if (!isValidityDiscountActive) return 0;
    const monthlyPct = validityEvent?.monthlyPercent ?? 5;
    const threeMonthlyPct = validityEvent?.threeMonthlyPercent ?? 10;
    const sixMonthlyPct = validityEvent?.sixMonthlyPercent ?? 15;
    const yearlyPct = validityEvent?.yearlyPercent ?? 20;

    if (durationId === '1_MONTH') return monthlyPct;
    if (durationId === '3_MONTH') return threeMonthlyPct;
    if (durationId === '6_MONTH') return sixMonthlyPct;
    if (durationId === '1_YEAR') return yearlyPct;
    return 0;
  };

  const getPlanDurationDiscount = (plan: any): number => {
    if (!plan) return 0;
    if (!isValidityDiscountActive) return 0;

    const monthlyPct = validityEvent?.monthlyPercent ?? 5;
    const threeMonthlyPct = validityEvent?.threeMonthlyPercent ?? 10;
    const sixMonthlyPct = validityEvent?.sixMonthlyPercent ?? 15;
    const yearlyPct = validityEvent?.yearlyPercent ?? 20;

    const id = (plan.id || '').toLowerCase();
    const name = (plan.name || '').toLowerCase();
    const dur = (plan.duration || '').toLowerCase();

    if (id.includes('weekly') || name.includes('weekly') || dur.includes('7') || dur.includes('week')) return 0;
    if (id.includes('monthly') || name.includes('monthly') || dur.includes('30') || dur.includes('1 month') || dur === '30 days') return monthlyPct;
    if (id.includes('quarterly') || id.includes('3month') || id.includes('3-month') || name.includes('quarterly') || name.includes('3 month') || dur.includes('3 month') || dur.includes('90')) return threeMonthlyPct;
    if (id.includes('6month') || id.includes('6-month') || id.includes('half') || name.includes('6 month') || name.includes('half') || dur.includes('6 month') || dur.includes('180')) return sixMonthlyPct;
    if (id.includes('yearly') || id.includes('annual') || name.includes('yearly') || name.includes('annual') || dur.includes('year') || dur.includes('365') || dur.includes('12 month')) return yearlyPct;
    return 0;
  };

  const calculatePlanDiscount = (plan: any, isProTier: boolean) => {
    if (!plan) {
      return {
        durDiscount: 0, subDiscount, userBonusDiscount, baseDiscount: 0,
        eventDiscount: eventDiscountPercent, eventEffectiveDiscount: 0, totalEffectiveDiscount: 0,
        basePrice: 0, finalPrice: 0, isLifetimePlan: false,
      };
    }
    const planNameL2 = (plan.name || '').toLowerCase();
    const planDurL2 = (plan.duration || '').toLowerCase();
    const isLifetimePlan = planNameL2.includes('lifetime') || planDurL2.includes('lifetime') || (plan as any).tier === 'LIFETIME';

    const basePrice = isProTier ? plan.basicPrice : plan.ultraPrice;
    if (isLifetimePlan) {
      const lifetimePrice = isProTier ? 9999 : 19999;
      return {
        durDiscount: 0, subDiscount: 0, userBonusDiscount: 0, baseDiscount: 0, eventDiscount: 0,
        eventEffectiveDiscount: 0, totalEffectiveDiscount: 0, basePrice: lifetimePrice, finalPrice: lifetimePrice,
        isLifetimePlan: true,
      };
    }

    const durDiscount = getPlanDurationDiscount(plan);
    const baseDiscount = Math.min(100, durDiscount + baseAccountDiscount);

    let eventEffectiveDiscount = 0;
    if (eventDiscountPercent > 0 && baseDiscount < 100) {
      const remainingBalance = 100 - baseDiscount;
      eventEffectiveDiscount = Math.round((remainingBalance * eventDiscountPercent) / 100);
    }

    const totalEffectiveDiscount = Math.min(100, baseDiscount + eventEffectiveDiscount);
    const finalPrice = Math.max(0, Math.round(basePrice * (1 - totalEffectiveDiscount / 100)));

    return {
      durDiscount, subDiscount, userBonusDiscount, baseDiscount, eventDiscount: eventDiscountPercent,
      eventEffectiveDiscount, totalEffectiveDiscount, basePrice, finalPrice, isLifetimePlan: false,
    };
  };

  const totalDiscount = (() => {
    const base = baseAccountDiscount;
    if (eventDiscountPercent > 0 && base < 100) {
      const rem = 100 - base;
      return Math.min(100, Math.round(base + (rem * eventDiscountPercent) / 100));
    }
    return Math.min(100, base);
  })();

  const creditDiscountPercent = (() => {
    const creditEvent = settings?.creditSubDiscountEvent;
    const discountEvent = creditEvent || event;
    let disc = 0;
    if (isDiscountEventLive(discountEvent) && isDiscountAudienceAllowed(discountEvent, !!isSubscribed)) {
      disc = Number(discountEvent?.discountPercent) || 0;
    }
    if (isUltraUser) disc = Math.max(disc, 40);
    else if (isBasicUser || isSubscribed) disc = Math.max(disc, 20);
    return Math.min(100, Math.max(0, disc));
  })();

  const getPlanCreditCost = (plan: any, ultra: boolean) => {
    const baseCost = getCreditPrice(plan.duration || plan.name || '', ultra, plan, settings);
    return creditDiscountPercent > 0
      ? Math.max(0, Math.round(baseCost * (1 - creditDiscountPercent / 100)))
      : baseCost;
  };

  const isGroupStudyHidden =
    settings?.isGroupStudyEnabled === false ||
    (settings?.hiddenFeatures || []).includes('GROUP_STUDY') ||
    (settings?.hiddenHomeButtons || []).includes('GROUP_STUDY');

  const filterGroupStudy = (list: string[]) => {
    if (!isGroupStudyHidden) return list;
    return (list || []).filter(f => {
      const lower = (f || '').toLowerCase();
      return !lower.includes('group study') &&
             !lower.includes('live classroom') &&
             !lower.includes('mcq battle') &&
             !lower.includes('live room');
    });
  };

  const defaultBasicFeatures = [
    ...(!isGroupStudyHidden ? ['Group Study: Join Live Rooms & Battles'] : []),
    'Daily Claim: 50 Credits / Day',
    'Daily XP Limit: +66%',
    'XP Multiplier: 1.5X Boost',
    'Credit Off Anywhere: 20%',
    'Store Discount: +5%',
    'Projector & PDF Mode',
    'Writing & Correction Mode',
    'Text Color & Fonts Custom',
    'All Basic Themes Free',
    'Offline Download Available',
    'Detailed Score History',
    'Community MCQ Submission',
  ];

  const defaultUltraFeatures = [
    ...(!isGroupStudyHidden ? ['👑 Group Study Pro: Host Live Classroom & Battles'] : []),
    'Daily Claim: 100 Credits / Day',
    'All Basic Features Included',
    '⚡ Ultra Mode (Reading Notes)',
    'Store Discount: +10% (Pro & Max)',
    'Daily XP Limit: +133%',
    'XP Multiplier: 2.0X Super Boost',
    'Credit Off Anywhere: 40%',
    'Global Student Chat',
    'All Ultra Themes Free',
    'Priority Content Requests',
    'Flashcard Memory Mode',
    'Concept Video Mode',
    '3,000 MCQ / Day Limit',
    'VIP Golden Crown & Glow',
  ];

  const pageTheme = tierType === 'SUBSCRIPTION' ? {
    bg: '#080a18',
    bgGrad: 'radial-gradient(ellipse 120% 70% at 50% -10%, rgba(124,58,237,0.18) 0%, #080a18 65%)',
    heroBg: 'linear-gradient(180deg, #130e26 0%, #090615 100%)',
    heroBorder: 'rgba(168,85,247,0.30)',
    heroGlow1: 'rgba(34,211,238,0.16)',
    heroGlow2: 'rgba(168,85,247,0.16)',
    heroIconBg: 'linear-gradient(135deg,rgba(34,211,238,0.25),rgba(168,85,247,0.25))',
    heroIconBorder: 'rgba(168,85,247,0.45)',
    heroIconShadow: '0 0 16px rgba(168,85,247,0.30)',
    heroIconColor: '#c084fc',
    heroTitle: 'VIP Subscriptions',
    heroSub: 'Pro & Max Elite Plans · Superpowers & Multipliers',
  } : isCreditsTab ? {
    bg: '#0d0a04',
    bgGrad: 'radial-gradient(ellipse 120% 70% at 50% -10%, rgba(251,191,36,0.16) 0%, #0d0a04 65%)',
    heroBg: 'linear-gradient(180deg, #1c1507 0%, #0d0903 100%)',
    heroBorder: 'rgba(251,191,36,0.25)',
    heroGlow1: 'rgba(251,191,36,0.15)',
    heroGlow2: 'rgba(217,119,6,0.10)',
    heroIconBg: 'linear-gradient(135deg,rgba(251,191,36,0.25),rgba(251,191,36,0.10))',
    heroIconBorder: 'rgba(251,191,36,0.45)',
    heroIconShadow: '0 0 16px rgba(251,191,36,0.25)',
    heroIconColor: '#fbbf24',
    heroTitle: 'Credits Store',
    heroSub: 'Instant Coin Packages & Top-ups',
  } : isDiamondsTab ? {
    bg: '#030d1a',
    bgGrad: 'radial-gradient(ellipse 120% 70% at 50% -10%, rgba(56,189,248,0.18) 0%, #030d1a 65%)',
    heroBg: 'linear-gradient(180deg, #081d33 0%, #020912 100%)',
    heroBorder: 'rgba(56,189,248,0.25)',
    heroGlow1: 'rgba(56,189,248,0.15)',
    heroGlow2: 'rgba(2,132,199,0.10)',
    heroIconBg: 'linear-gradient(135deg,rgba(56,189,248,0.25),rgba(56,189,248,0.10))',
    heroIconBorder: 'rgba(56,189,248,0.45)',
    heroIconShadow: '0 0 16px rgba(56,189,248,0.25)',
    heroIconColor: '#38bdf8',
    heroTitle: 'Diamonds Store',
    heroSub: 'Exclusive Lifetime Currency & Daily Drops',
  } : isExchangeTab ? {
    bg: '#04140e',
    bgGrad: 'radial-gradient(ellipse 120% 70% at 50% -10%, rgba(16,185,129,0.18) 0%, #04140e 65%)',
    heroBg: 'linear-gradient(180deg, #09261a 0%, #020d09 100%)',
    heroBorder: 'rgba(16,185,129,0.25)',
    heroGlow1: 'rgba(16,185,129,0.15)',
    heroGlow2: 'rgba(5,150,105,0.10)',
    heroIconBg: 'linear-gradient(135deg,rgba(16,185,129,0.25),rgba(16,185,129,0.10))',
    heroIconBorder: 'rgba(16,185,129,0.45)',
    heroIconShadow: '0 0 16px rgba(16,185,129,0.25)',
    heroIconColor: '#10b981',
    heroTitle: 'Currency Exchange',
    heroSub: 'Diamonds ko Instant Credits mein Swap Karein',
  } : {
    bg: C.bg,
    bgGrad: 'none',
    heroBg: C.surface,
    heroBorder: C.border,
    heroGlow1: 'rgba(34,211,238,0.07)',
    heroGlow2: C.goldBg,
    heroIconBg: 'linear-gradient(135deg,rgba(251,191,36,0.22),rgba(251,191,36,0.08))',
    heroIconBorder: C.goldBorder,
    heroIconShadow: '0 0 14px rgba(251,191,36,0.2)',
    heroIconColor: C.gold,
    heroTitle: 'Plan History',
    heroSub: 'Pichle sabhi plans aur invoices',
  };

  const userCredits = getTotalCredits(user);

  if (settings?.isPaymentEnabled === false) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6" style={{ background: C.bg }}>
        <div className="rounded-3xl p-10 text-center max-w-sm w-full" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: C.surfaceHigh }}>
            <Lock size={30} color={C.textMuted} />
          </div>
          <h3 className="text-xl font-black mb-2" style={{ color: C.text }}>Store Band Hai</h3>
          <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
            {settings.paymentDisabledMessage || 'Purchases are currently disabled by the Admin.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-32 animate-in fade-in duration-300" style={{ background: pageTheme.bg, backgroundImage: pageTheme.bgGrad }}>

      {/* ── 1ST TIME POPUP / AD BANNER: FREE VS BASIC & ULTRA MODAL ── */}
      {showFreeAdModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div
            className="w-full max-w-lg max-h-[90dvh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl relative"
            style={{
              background: '#090b14',
              borderColor: 'rgba(255,255,255,0.18)',
              boxShadow: '0 0 50px rgba(56,189,248,0.2)'
            }}
          >
            {/* Header with Close (X) */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/10 bg-slate-900/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">📢</span>
                <div>
                  <h3 className="font-black text-sm text-white">Compare Plans & Unlocks</h3>
                  <p className="text-[10px] text-slate-400">Free vs Basic (Sky) & Free vs Ultra (Purple)</p>
                </div>
              </div>
              <button
                onClick={handleDismissFreeAd}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
              {/* SECTION 1: FREE VS BASIC (SKY BLUE) */}
              <div
                className="rounded-2xl p-4 border relative overflow-hidden shadow-lg"
                style={{
                  background: 'linear-gradient(145deg, rgba(8,30,52,0.7) 0%, rgba(3,15,28,0.95) 100%)',
                  borderColor: 'rgba(56,189,248,0.4)',
                }}
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⭐</span>
                    <h4 className="font-black text-sm text-white">Free vs Basic (Pro)</h4>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/35">
                    PRO SKY UPGRADE
                  </span>
                </div>

                <div className="space-y-1.5">
                  {[
                    ...(!isGroupStudyHidden ? [{ title: 'Group Study: Join Live Rooms & Battles', isNew: true }] : []),
                    { title: 'Daily XP Limit: +66% (2,500 pts vs 1,500 pts)', isNew: true },
                    { title: 'Credit Off Anywhere: 20% Permanent Discount', isNew: true },
                    { title: 'Projector & PDF Mode Unlocked', isNew: true },
                    { title: 'Text Color & Fonts Custom Styling', isNew: true },
                    { title: 'Offline Download Available', isNew: true },
                    { title: 'Community MCQ Submission Access', isNew: true },
                    { title: 'Daily Claim: 50 Credits / Day (1,500 CR/Month)', isNew: true },
                    { title: 'XP Multiplier: 1.5X Boost', isNew: true },
                    { title: 'Store Discount: +5% on all subscriptions', isNew: true },
                    { title: 'Writing & Correction Mode', isNew: true },
                    { title: 'All Basic Themes Free Unlocked', isNew: true },
                    { title: 'Detailed Score History & Analytics', isNew: true },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-sky-400/15">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sky-400 text-xs shrink-0">✓</span>
                        <span className="text-[11px] font-bold text-sky-200 truncate">{feat.title}</span>
                      </div>
                      <span className="text-[8px] font-black text-sky-300 bg-sky-500/15 px-1.5 py-0.5 rounded border border-sky-400/30 shrink-0">
                        BASIC
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: FREE VS ULTRA (PURPLE) */}
              <div
                className="rounded-2xl p-4 border relative overflow-hidden shadow-lg"
                style={{
                  background: 'linear-gradient(145deg, rgba(46,16,101,0.65) 0%, rgba(15,5,32,0.95) 100%)',
                  borderColor: 'rgba(192,132,252,0.4)',
                }}
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👑</span>
                    <h4 className="font-black text-sm text-white">Free vs Ultra (Max Elite)</h4>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/35">
                    ULTRA PURPLE UPGRADE
                  </span>
                </div>

                <div className="space-y-1.5">
                  {[
                    ...(!isGroupStudyHidden ? [{ title: 'Group Study Pro: Host Live Classroom & Battles', isNew: true }] : []),
                    { title: 'Daily Claim: 100 Credits / Day (3,000 CR/Month)', isNew: true },
                    { title: 'All Basic Features Included', isNew: true },
                    { title: 'Ultra Mode (Reading Notes & Premium)', isNew: true },
                    { title: 'Store Discount: +10% (Pro & Max)', isNew: true },
                    { title: 'Daily XP Limit: +133% (3,500 pts)', isNew: true },
                    { title: 'XP Multiplier: 2.0X Super Boost (Double XP)', isNew: true },
                    { title: 'Global Student Chat Access', isNew: true },
                    { title: 'Priority Content Requests', isNew: true },
                    { title: 'Full Concept Video Mode Unlocked', isNew: true },
                    { title: 'VIP Golden Crown & Glow Profile', isNew: true },
                    { title: 'Credit Off Anywhere: 40% Maximum Discount', isNew: true },
                    { title: 'All Ultra Themes Free permanently', isNew: true },
                    { title: 'Flashcard Memory Revision Mode', isNew: true },
                    { title: 'Huge 3,000 MCQ / Day Limit', isNew: true },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-purple-400/15">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-purple-400 text-xs shrink-0">✓</span>
                        <span className="text-[11px] font-bold text-purple-200 truncate">{feat.title}</span>
                      </div>
                      <span className="text-[8px] font-black text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded border border-purple-400/30 shrink-0">
                        ULTRA
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Sticky Action Button */}
            <div className="p-4 border-t border-white/10 bg-slate-900/90 backdrop-blur-sm shrink-0">
              <button
                type="button"
                onClick={handleDismissFreeAd}
                className="w-full py-3.5 rounded-xl font-black text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-sky-400 via-cyan-300 to-purple-400 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Continue to Store</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUPPORT / WHATSAPP CHECKOUT MODAL ── */}
      {showSupportModal && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm" onClick={() => setShowSupportModal(false)} />
          <div className="fixed inset-0 z-[201] flex items-end justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto rounded-3xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
              style={{ background: C.surface, border: `1px solid ${C.borderMed}` }}>
              <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: ac.bg, border: `1px solid ${ac.border}` }}>
                    <MessageSquare size={19} color={ac.color} />
                  </div>
                  <div>
                    <h3 className="font-black text-base" style={{ color: C.text }}>Payment Channel</h3>
                    <p className="text-[11px]" style={{ color: C.textMuted }}>Ek number select karo</p>
                  </div>
                </div>
                <button onClick={() => setShowSupportModal(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: C.surfaceHigh }}>
                  <X size={14} color={C.textMuted} />
                </button>
              </div>
              <div className="px-4 py-3 space-y-2">
                {(settings?.paymentNumbers || [{ id: 'def', name: 'Main Support', number: '8227070298', dailyClicks: 0 }]).map((num) => {
                  const totalClicks = settings?.paymentNumbers?.reduce((acc, curr) => acc + (curr.dailyClicks || 0), 0) || 1;
                  const traffic = Math.round(((num.dailyClicks || 0) / totalClicks) * 100);
                  const isFast = traffic < 30;
                  return (
                    <button key={num.id} onClick={() => handleSupportClick(num)}
                      className="w-full p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98]"
                      style={{ background: C.surfaceHigh, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm"
                          style={{ background: isFast ? C.greenBg : 'rgba(251,146,60,0.12)', color: isFast ? C.green : '#fb923c' }}>
                          {num.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm" style={{ color: C.text }}>{num.name}</p>
                          <p className="text-[10px]" style={{ color: C.textMuted }}>{isFast ? '✅ Fast Response' : '⚠️ High Traffic'}</p>
                        </div>
                      </div>
                      <ChevronRight size={15} color={C.textDim} />
                    </button>
                  );
                })}
              </div>
              <div className="px-4 pb-5">
                <button onClick={() => setShowSupportModal(false)}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold transition-colors"
                  style={{ color: C.textMuted, background: C.surfaceHigh }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── PAYMENT CHOOSER POPUP ── */}
      {showPaymentChooser && selectedPlan && (() => {
        const isProTarget = selectedTierForPurchase === 'BASIC';
        const discInfo = calculatePlanDiscount(selectedPlan, isProTarget);
        const basePrice = discInfo.basePrice;
        const finalPrice = discInfo.finalPrice;
        const effectiveDiscount = discInfo.totalEffectiveDiscount;
        const durDiscount = discInfo.durDiscount;
        const isLifetimePlan = discInfo.isLifetimePlan;
        const creditCost = getPlanCreditCost(selectedPlan, !isProTarget);
        const hasEnoughCredits = userCredits >= creditCost;
        return (
          <>
            <div className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-sm" onClick={() => setShowPaymentChooser(false)} />
            <div className="fixed inset-0 z-[301] flex items-center justify-center p-5 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-sm rounded-3xl overflow-hidden animate-in zoom-in-95 fade-in duration-300"
                style={{ background: C.surface, border: `1px solid ${C.borderMed}` }}>
                <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: C.textMuted }}>Payment Method</p>
                    <p className="font-black text-base" style={{ color: C.text }}>{selectedPlan.name}</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: ac.bg, color: ac.color, border: `1px solid ${ac.border}` }}>
                      {ac.emoji} {ac.label}
                    </span>
                  </div>
                  <button onClick={() => setShowPaymentChooser(false)}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: C.surfaceHigh }}>
                    <X size={14} color={C.textMuted} />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <button
                    onClick={() => { setShowPaymentChooser(false); initiatePurchase({ ...selectedPlan, finalPrice, discountPercent: effectiveDiscount, durDiscount }); }}
                    className="w-full p-4 rounded-2xl text-left transition-all active:scale-[0.98] flex items-center gap-3"
                    style={{ background: ac.bg, border: `1.5px solid ${ac.border}` }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl font-black"
                      style={{ background: ac.pill, color: ac.color }}>₹</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-sm" style={{ color: C.text }}>₹{finalPrice.toLocaleString('en-IN')} se Kharido</p>
                        {effectiveDiscount > 0 && (
                          <>
                            <span className="text-[10px] line-through" style={{ color: C.textDim }}>₹{basePrice.toLocaleString('en-IN')}</span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.18)', color: C.gold, border: `1px solid ${C.goldBorder}` }}>
                              {effectiveDiscount}% OFF
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>WhatsApp par payment karo — Instant activate</p>
                    </div>
                    <ChevronRight size={16} color={C.textDim} />
                  </button>
                  {!isLifetimePlan && (
                    isCreditSubAllowed ? (
                      <button
                        onClick={() => { setShowPaymentChooser(false); setShowCreditConfirm(true); }}
                        disabled={!hasEnoughCredits}
                        className="w-full p-4 rounded-2xl text-left transition-all active:scale-[0.98] disabled:opacity-40 flex items-center gap-3"
                        style={{
                          background: hasEnoughCredits ? C.goldBg : C.surfaceHigh,
                          border: `1.5px solid ${hasEnoughCredits ? C.goldBorder : C.border}`,
                        }}>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl"
                          style={{ background: hasEnoughCredits ? 'rgba(251,191,36,0.2)' : C.surfaceHigh }}>🪙</div>
                        <div className="flex-1">
                          <p className="font-black text-sm" style={{ color: hasEnoughCredits ? C.gold : C.textMuted }}>
                            {creditCost.toLocaleString('en-IN')} Credits se Kharido
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
                            {hasEnoughCredits
                              ? `Balance: ${userCredits.toLocaleString('en-IN')} CR → ${(userCredits - creditCost).toLocaleString('en-IN')} CR`
                              : `Kum hai — Chahiye: ${creditCost.toLocaleString('en-IN')} CR, Hai: ${userCredits.toLocaleString('en-IN')} CR`}
                          </p>
                        </div>
                        {hasEnoughCredits && <ChevronRight size={16} color={C.gold} />}
                      </button>
                    ) : (
                      <div className="w-full p-3 rounded-2xl flex items-center gap-2.5 opacity-75 border border-slate-700 bg-slate-900/50">
                        <span className="text-base">🔒</span>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Admin ne credits dwara subscription purchase off kar rakha hai.
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── CREDIT CONFIRM POPUP ── */}
      {showCreditConfirm && selectedPlan && (() => {
        const creditCost = getPlanCreditCost(selectedPlan, !isPro);
        const afterBalance = userCredits - creditCost;
        return (
          <>
            <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm"
              onClick={() => !creditConfirmLoading && setShowCreditConfirm(false)} />
            <div className="fixed inset-0 z-[401] flex items-center justify-center p-5 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-xs rounded-3xl overflow-hidden animate-in zoom-in-95 fade-in duration-300"
                style={{ background: C.surface, border: `1.5px solid ${C.goldBorder}` }}>
                <div className="pt-7 pb-3 flex flex-col items-center px-5">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
                    style={{ background: C.goldBg, border: `1.5px solid ${C.goldBorder}` }}>🪙</div>
                  <p className="text-lg font-black text-center mb-1" style={{ color: C.text }}>Confirm Purchase</p>
                  <p className="text-[12px] text-center leading-relaxed" style={{ color: C.textMuted }}>
                    Credits se {isPro ? 'PRO' : 'MAX'} plan khareedne wale ho
                  </p>
                  <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[10.5px] text-amber-300 text-center font-medium leading-tight">
                    ℹ️ Sabhi Premium study features (MCQs, Notes, XP Boost) unlock honge. Daily Credits claim sirf cash/UPI plans me milta hai.
                  </div>
                </div>
                <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.goldBorder}` }}>
                  {[
                    { label: 'Plan', value: `${selectedPlan.name} · ${isPro ? 'PRO' : 'MAX'}`, color: C.text },
                    { label: 'Credit Cost', value: `${creditCost.toLocaleString('en-IN')} CR`, color: C.gold },
                    { label: 'Aapka Balance', value: `${userCredits.toLocaleString('en-IN')} CR`, color: C.textMuted },
                    { label: 'Baad Bachega', value: `${afterBalance.toLocaleString('en-IN')} CR`, color: afterBalance >= 0 ? C.green : '#f87171' },
                  ].map((row, i, arr) => (
                    <div key={row.label}
                      className="flex justify-between items-center px-4 py-3"
                      style={{ background: i % 2 === 0 ? C.surfaceHigh : C.surface, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <span className="text-[11px] font-bold" style={{ color: C.textMuted }}>{row.label}</span>
                      <span className="text-[12px] font-black" style={{ color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-5 flex gap-3">
                  <button onClick={() => setShowCreditConfirm(false)} disabled={creditConfirmLoading}
                    className="flex-1 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95"
                    style={{ background: C.surfaceHigh, color: C.textMuted, border: `1px solid ${C.border}` }}>
                    Cancel
                  </button>
                  <button onClick={() => handleCreditPurchase(selectedPlan)} disabled={creditConfirmLoading}
                    className="flex-1 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{ background: creditConfirmLoading ? 'rgba(251,191,36,0.5)' : C.gold, color: '#000' }}>
                    {creditConfirmLoading ? (
                      <>
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                        </svg>
                        Saving...
                      </>
                    ) : <>🪙 Haan, Kharido!</>}
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* ══════════ HERO HEADER ══════════ */}
      <div className="relative overflow-hidden" style={{ background: pageTheme.heroBg, borderBottom: `1px solid ${pageTheme.heroBorder}` }}>
        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: pageTheme.heroGlow1, filter: 'blur(40px)' }} />
        <div className="absolute -bottom-10 right-0 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: pageTheme.heroGlow2, filter: 'blur(30px)' }} />

        <div className="relative px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5 mb-4">
            {onBack && (
              <button onClick={onBack}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform bg-white/5 border border-white/10">
                <ArrowLeft size={16} color={C.textMuted} />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: pageTheme.heroIconBg, border: `1.5px solid ${pageTheme.heroIconBorder}`, boxShadow: pageTheme.heroIconShadow }}>
              <Crown size={18} color={pageTheme.heroIconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black leading-none" style={{ color: C.text }}>{pageTheme.heroTitle}</h1>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: C.textMuted }}>{pageTheme.heroSub}</p>
            </div>

            {/* Persistent Button to Re-open Free vs VIP Comparison */}
            <button
              onClick={() => setShowFreeAdModal(true)}
              className="flex items-center gap-1 px-2.5 rounded-2xl shrink-0 active:scale-95 transition-all"
              style={{
                height: 34,
                background: 'rgba(56,189,248,0.12)',
                border: '1.5px solid rgba(56,189,248,0.35)',
              }}
              title="Free Plan vs VIP Unlocks Dekhein"
            >
              <span className="text-xs">🎯</span>
              <span className="font-black text-[10.5px] text-sky-400">Free vs VIP</span>
            </button>

            <button
              id="store-header-diamonds-btn"
              onClick={() => setTierType('DIAMONDS')}
              className="flex items-center gap-1.5 px-2.5 rounded-2xl shrink-0 active:scale-95 transition-all group"
              style={{ height: 34, background: C.diamondBg, border: `1.5px solid ${C.diamondBorder}`, boxShadow: `0 0 10px rgba(56,189,248,0.15)` }}
              title="Diamonds Pack Kharidein"
            >
              <span className="text-sm leading-none">💎</span>
              <span className="font-black text-sm leading-none" style={{ color: C.diamond }}>
                {(user.diamonds ?? 0).toLocaleString('en-IN')}
              </span>
              <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-sky-400 to-cyan-300 text-slate-950 flex items-center justify-center font-black text-[10px] shadow-sm ml-0.5 group-hover:scale-110 transition-transform">
                +
              </span>
            </button>
            <button
              id="store-header-credits-btn"
              onClick={() => setTierType('CREDITS')}
              className="flex items-center gap-1.5 px-2.5 rounded-2xl shrink-0 active:scale-95 transition-all group"
              style={{ height: 34, background: C.goldBg, border: `1.5px solid ${C.goldBorder}`, boxShadow: `0 0 10px rgba(251,191,36,0.12)` }}
              title="Credits Pack Kharidein"
            >
              <span className="text-sm leading-none">🪙</span>
              <span className="font-black text-sm leading-none" style={{ color: C.gold }}>
                {userCredits.toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] font-black" style={{ color: 'rgba(251,191,36,0.55)' }}>CR</span>
              <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-[10px] shadow-sm ml-0.5 group-hover:scale-110 transition-transform">
                +
              </span>
            </button>
          </div>

          {/* Horizontal Scrollable Tabs */}
          <div className="flex overflow-x-auto gap-1.5 sm:gap-2 pb-1 scrollbar-hide">
            {allTabs.map(tab => {
              const isActive = tierType === tab.id;
              return (
                <button key={tab.id} onClick={() => setTierType(tab.id as any)}
                  className="py-1.5 px-3 rounded-xl font-black transition-all flex items-center gap-1.5 shrink-0"
                  style={isActive
                    ? { background: tab.bg, border: `2px solid ${tab.border}`, boxShadow: `0 0 14px ${tab.glow}`, color: tab.color }
                    : { background: 'rgba(255,255,255,0.05)', border: `1.5px solid rgba(255,255,255,0.1)`, color: C.textMuted }}>
                  <span className="text-xs sm:text-sm">{tab.emoji}</span>
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              );
            })}
            <button onClick={() => setTierType('HISTORY')}
              className="py-1.5 px-3 rounded-xl font-black transition-all flex items-center gap-1 shrink-0"
              style={tierType === 'HISTORY'
                ? { background: 'rgba(251,191,36,0.10)', border: `2px solid rgba(251,191,36,0.35)`, color: C.gold }
                : { background: 'rgba(255,255,255,0.05)', border: `1.5px solid rgba(255,255,255,0.1)`, color: C.textMuted }}>
              <History size={12} />
              <span className="text-[10px]">History</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════ BODY CONTENT ══════════ */}
      <div className="px-4 pt-5">

        {/* ── 1. HISTORY TAB ── */}
        {tierType === 'HISTORY' && <SubHistory user={user} onBack={() => setTierType('SUBSCRIPTION')} />}

        {/* ── 2. VIP SUBSCRIPTIONS (CONSOLIDATED PRO & MAX CARDS) ── */}
        {tierType === 'SUBSCRIPTION' && (
          <div className="space-y-4">
            {user.isPremium && !isSubscriptionFromCoins(user) && (
              <TierDailyClaimCard
                targetTier={user.subscriptionLevel === 'BASIC' ? 'PRO' : 'MAX_PRO'}
                userId={user.id}
                user={user}
                settings={settings}
                onUpdateUser={onUserUpdate}
              />
            )}

            {(() => {
              const renderVipCard = (tierTarget: 'BASIC' | 'ULTRA') => {
                const isProTier = tierTarget === 'BASIC';
                const activePlanId = isProTier ? selectedProPlanId : selectedMaxPlanId;
                const setActivePlanId = (id: string) => isProTier ? setSelectedProPlanId(id) : setSelectedMaxPlanId(id);

                const subActive = user.isPremium && (
                  (isProTier && user.subscriptionLevel === 'BASIC') ||
                  (!isProTier && (user.subscriptionLevel === 'ULTRA' || (user.subscriptionLevel as any) === 'PRO'))
                ) && user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();

                const daysLeft = subActive && user.subscriptionEndDate
                  ? Math.max(0, Math.ceil((new Date(user.subscriptionEndDate).getTime() - Date.now()) / 86400000))
                  : 0;

                const activePlan = subscriptionPlans.find(p => p.id === activePlanId) || subscriptionPlans[0];
                if (!activePlan) return null;

                const discInfo = calculatePlanDiscount(activePlan, isProTier);
                const creditCost = getPlanCreditCost(activePlan, !isProTier);
                const cardFeatures = filterGroupStudy(isProTier ? defaultBasicFeatures : defaultUltraFeatures);

                return (
                  <div key={tierTarget} className="mb-4 rounded-2xl p-4 border relative overflow-hidden shadow-xl"
                    style={{
                      background: isProTier
                        ? 'linear-gradient(145deg, rgba(8,51,68,0.75) 0%, rgba(3,15,28,0.98) 100%)'
                        : 'linear-gradient(145deg, rgba(59,7,100,0.7) 0%, rgba(15,5,32,0.98) 100%)',
                      borderColor: isProTier ? '#22d3ee55' : '#c084fc55'
                    }}>
                    <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{isProTier ? '⭐' : '👑'}</span>
                          <h2 className="text-base font-black text-white">
                            {isProTier ? 'Pro Learner Pass' : 'Max Elite VIP Pass'}
                          </h2>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300">
                            🪙 +{isProTier ? 50 : 100}/din
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-1">
                          {subActive ? `Active Plan · ${daysLeft} din baaki` : 'Sabhi features instantly unlock honge'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-black ${isProTier ? 'text-cyan-300' : 'text-purple-300'}`}>
                          ₹{discInfo.finalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Validity Selector */}
                    <div className="p-2 rounded-xl bg-black/35 border border-white/5 my-2.5">
                      <div className="grid grid-cols-4 gap-1.5">
                        {subscriptionPlans.map(plan => {
                          const isSel = activePlan.id === plan.id;
                          return (
                            <button key={plan.id} type="button" onClick={() => setActivePlanId(plan.id)}
                              className={`py-1.5 px-1 rounded-lg text-center transition-all border text-xs ${
                                isSel
                                  ? (isProTier ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-purple-400 text-slate-950 font-black')
                                  : 'bg-white/5 text-slate-300 border-white/10'
                              }`}>
                              {plan.duration || plan.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="my-2 p-2.5 rounded-xl bg-black/35 border border-white/10">
                      <div className="grid grid-cols-2 gap-1.5">
                        {cardFeatures.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-1 text-[10.5px] text-slate-200">
                            <span className={isProTier ? 'text-cyan-400' : 'text-purple-400'}>✓</span>
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2 mt-3">
                      <button type="button"
                        onClick={() => {
                          setSelectedPlanId(activePlan.id);
                          setSelectedTierForPurchase(isProTier ? 'BASIC' : 'ULTRA');
                          setShowPaymentChooser(true);
                        }}
                        className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                        style={{
                          background: isProTier ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'linear-gradient(135deg, #a855f7, #7c3aed)'
                        }}>
                        <Zap size={16} /> Subscribe Karein — ₹{discInfo.finalPrice.toLocaleString('en-IN')}
                      </button>

                      {isCreditSubAllowed && !discInfo.isLifetimePlan && (
                        <button type="button"
                          onClick={() => {
                            setSelectedPlanId(activePlan.id);
                            setSelectedTierForPurchase(isProTier ? 'BASIC' : 'ULTRA');
                            if (userCredits < creditCost) {
                              setCreditPurchaseMsg(`Credits kam hain! Chahiye: ${creditCost.toLocaleString('en-IN')} CR`);
                              setTimeout(() => setCreditPurchaseMsg(null), 4000);
                              return;
                            }
                            setShowCreditConfirm(true);
                          }}
                          className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border text-amber-400 bg-amber-400/10 border-amber-400/30 cursor-pointer">
                          🪙 {creditCost.toLocaleString('en-IN')} Credits Se Kharido
                        </button>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {renderVipCard('BASIC')}
                  {renderVipCard('ULTRA')}
                </>
              );
            })()}

            {creditPurchaseMsg && (
              <div className="p-3 rounded-xl text-center text-xs font-bold bg-white/10 text-white border border-white/20">
                {creditPurchaseMsg}
              </div>
            )}
          </div>
        )}

        {/* ── 3. CREDITS TAB (PASS & PACKS) ── */}
        {tierType === 'CREDITS' && (() => {
          const creditSubPlans = getCreditSubPlans(settings).filter(p => p.isActive !== false);

          const renderCreditPassContent = () => {
            if (creditSubPlans.length === 0) {
              return (
                <div className="rounded-2xl p-10 text-center border border-dashed border-amber-400/20 bg-amber-950/20">
                  <span className="text-3xl block mb-2">⚡</span>
                  <p className="font-black text-sm text-white mb-1">Credit Pass Coming Soon</p>
                  <p className="text-xs text-slate-400">Admin jald hi naye Daily Credit Pass plans live karega.</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>⚡</span> Daily Credit Pass Subscriptions
                  </h3>
                  <span className="text-[10px] text-amber-400 font-bold">Daily Drop Pass</span>
                </div>

                {creditSubPlans.map(plan => {
                  const selectedDurationId = planDurations[plan.id] || '1_MONTH';
                  const selectedDurationOpt = CREDIT_SUB_DURATIONS.find(d => d.id === selectedDurationId) || CREDIT_SUB_DURATIONS[0];
                  const durDisc = getCreditSubDurationDiscount(selectedDurationOpt.id);
                  const pricing = calculateCreditSubPrice(plan, selectedDurationOpt, false, durDisc);
                  const planMult = plan.scoreMultiplier || getCreditSubPlanMultiplier(plan);
                  const userTier = user.isPremium ? (user.subscriptionLevel || 'FREE') : 'FREE';
                  const baseMult = userTier === 'ULTRA' ? 2.0 : userTier === 'BASIC' ? 1.5 : 1.0;
                  const effectiveCombinedMult = Math.round((baseMult + (planMult - 1.0)) * 10) / 10;
                  const extraBoostPct = Math.round((planMult - 1.0) * 100);

                  return (
                    <div
                      key={plan.id}
                      className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border relative overflow-hidden transition-all shadow-xl"
                      style={{
                        background: 'linear-gradient(145deg, rgba(35,20,5,0.75) 0%, rgba(18,11,3,0.92) 50%, rgba(10,7,2,0.98) 100%)',
                        borderColor: 'rgba(251,191,36,0.35)',
                        boxShadow: '0 4px 20px rgba(251,191,36,0.08)',
                      }}
                    >
                      <div
                        className="absolute top-0 right-0 text-[8px] font-black px-2.5 py-0.5 rounded-bl-xl tracking-wider uppercase"
                        style={{ background: C.gold, color: '#000' }}
                      >
                        {plan.badge || 'CREDIT PASS'}
                      </div>

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-base">⚡</span>
                            <h2 className="text-sm sm:text-base font-black text-white truncate tracking-tight">
                              {plan.name}
                            </h2>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                              🪙 +{plan.dailyCredits}/din
                            </span>
                            <span
                              className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                              style={{
                                background: 'rgba(251,191,36,0.18)',
                                color: '#fde047',
                                border: '1px solid rgba(251,191,36,0.35)',
                              }}
                            >
                              ⚡ +{extraBoostPct}% XP
                            </span>
                            {pricing.totalDiscountPercent > 0 && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 shrink-0">
                                {pricing.totalDiscountPercent}% OFF
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 text-[10px] text-slate-300 truncate">
                            Guaranteed daily credit deposits · Har roz claim karein
                          </p>
                        </div>

                        <div className="text-right shrink-0 pt-0.5">
                          <div className="flex items-baseline justify-end gap-1">
                            {pricing.totalDiscountPercent > 0 && (
                              <span className="text-[11px] line-through text-slate-400 font-bold">
                                ₹{pricing.basePrice.toLocaleString('en-IN')}
                              </span>
                            )}
                            <span className="text-base sm:text-lg font-black text-amber-400">
                              ₹{pricing.finalPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium">
                            ₹{pricing.perDayCost}/din · ₹{pricing.perCreditCost}/credit
                          </div>
                        </div>
                      </div>

                      {/* Validity Selector in 1-line Grid */}
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10 my-2">
                        <div className="flex items-center justify-between mb-1 px-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                            <Clock size={11} /> Validity Chunein:
                          </span>
                          <span className="text-[9px] font-medium text-slate-400">
                            Total <strong className="text-amber-300">{pricing.totalCredits.toLocaleString('en-IN')} 🪙</strong>
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                          {CREDIT_SUB_DURATIONS.map(dur => {
                            const isSelected = selectedDurationId === dur.id;
                            return (
                              <button
                                key={dur.id}
                                type="button"
                                onClick={() => setPlanDurations(prev => ({ ...prev, [plan.id]: dur.id }))}
                                className={`py-1.5 px-1 rounded-lg text-center transition-all border relative flex flex-col items-center justify-center cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                                }`}
                              >
                                {(() => {
                                  const durPillDisc = getCreditSubDurationDiscount(dur.id);
                                  if (durPillDisc <= 0) return null;
                                  return (
                                    <span className={`text-[8px] font-black px-1 rounded leading-tight -mt-0.5 mb-0.5 ${
                                      isSelected ? 'bg-slate-950 text-amber-300' : 'bg-emerald-500 text-slate-950'
                                    }`}>
                                      {durPillDisc}% OFF
                                    </span>
                                  );
                                })()}
                                <span className="text-[10px] sm:text-[11px] font-black leading-tight">
                                  {dur.label}
                                </span>
                                <span className={`text-[8px] sm:text-[9px] leading-tight ${isSelected ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                                  {dur.durationDays}D
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Multiplier strip */}
                      <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/25 my-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs shrink-0">⚡</span>
                          <p className="text-[10px] text-slate-300 truncate">
                            <strong className="text-amber-300">{planMult}x XP Pass Boost (+{extraBoostPct}%)</strong> · Total Effective XP: <strong className="text-emerald-400">{effectiveCombinedMult}x</strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAllTiersModal(true)}
                          className="shrink-0 text-[9px] font-bold text-amber-300 hover:text-amber-200 underline decoration-dotted cursor-pointer"
                        >
                          Tiers Info
                        </button>
                      </div>

                      {/* Quick Perks */}
                      <div className="grid grid-cols-2 gap-1 my-2 text-[10px] text-slate-300">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400">✓</span>
                          <span>No Expiry (Credits Safe)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400">✓</span>
                          <span>Har Raat 12 AM Reset</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400">✓</span>
                          <span>Stacks with Pro & Max VIP</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400">✓</span>
                          <span>Instant Activation</span>
                        </div>
                      </div>

                      {/* Subscribe Button */}
                      <button
                        type="button"
                        onClick={() => initiatePurchase({
                          ...plan,
                          id: `${plan.id}_${selectedDurationOpt.id}`,
                          basePlanId: plan.id,
                          name: `${plan.name} (${selectedDurationOpt.label})`,
                          price: pricing.finalPrice,
                          finalPrice: pricing.finalPrice,
                          basePrice: pricing.basePrice,
                          dummyPrice: pricing.dummyPrice,
                          dailyCredits: plan.dailyCredits,
                          durationDays: selectedDurationOpt.durationDays,
                          durationMonths: selectedDurationOpt.months,
                          durationLabel: selectedDurationOpt.label,
                          isCreditSub: true,
                          discountPercent: pricing.totalDiscountPercent,
                          durationDiscountPercent: pricing.durationDiscountPercent,
                          scoreMultiplier: planMult,
                        })}
                        className="w-full py-2.5 rounded-xl font-black text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md cursor-pointer mt-1"
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#000',
                          boxShadow: '0 4px 18px rgba(245,158,11,0.3)',
                        }}
                      >
                        <Zap size={14} />
                        <span>
                          {plan.name} ({selectedDurationOpt.label}) Subscribe Karein — ₹{pricing.finalPrice.toLocaleString('en-IN')}
                        </span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          };

          return (
            <div className="animate-in fade-in duration-200 space-y-4">
              {passClaimSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎉</span>
                    <span>{passClaimSuccessMsg}</span>
                  </div>
                  <button
                    onClick={() => setPassClaimSuccessMsg(null)}
                    className="w-6 h-6 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {creditPurchaseMsg && (
                <div className="p-4 rounded-2xl text-sm font-bold text-center"
                  style={{
                    background: creditPurchaseMsg.startsWith('✅') ? C.greenBg : 'rgba(248,113,113,0.1)',
                    color: creditPurchaseMsg.startsWith('✅') ? C.green : '#f87171',
                    border: `1px solid ${creditPurchaseMsg.startsWith('✅') ? C.greenBorder : 'rgba(248,113,113,0.3)'}`,
                  }}>
                  {creditPurchaseMsg}
                </div>
              )}

              <div className="rounded-3xl p-5 relative overflow-hidden border"
                style={{
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.06) 100%)',
                  borderColor: C.goldBorder,
                  boxShadow: '0 8px 32px -4px rgba(251,191,36,0.22)'
                }}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0"
                      style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}>
                      🪙
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Study Currency</span>
                      <h2 className="text-xl font-black text-white flex items-center gap-2">
                        {userCredits.toLocaleString('en-IN')} <span className="text-xs text-amber-300 font-bold">Credits</span>
                      </h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Fast Top-up</span>
                    <span className="text-xs font-black text-amber-400">Instant AI & Tests</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  🪙 <strong>Credits</strong> se mock tests, AI doubts, notes aur interactive study tools instantly use kiye ja sakte hain.
                </p>

                {(() => {
                  const hasPass = isCreditSubActive(user);
                  const sub = user.creditSubscription;
                  if (!hasPass || !sub) return null;
                  const daysLeft = getCreditSubDaysRemaining(sub);
                  const canClaim = canClaimCreditSubToday(user);

                  return (
                    <div className="rounded-2xl p-4 bg-amber-950/70 border border-amber-400/35 mt-3 shadow-inner">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                            ACTIVE CREDIT PASS
                          </span>
                          <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            ⏳ {daysLeft} Din Baki
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          🪙 +{sub.dailyCredits}/din
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-white mb-2">{sub.planName || 'Daily Credit Pass'}</h4>

                      {canClaim ? (
                        <button
                          type="button"
                          onClick={handleClaimStorePass}
                          disabled={claimingStorePass}
                          className="w-full py-2.5 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:opacity-95 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Gift size={14} />
                          {claimingStorePass ? 'Claim Ho Raha Hai...' : `Aaj Ke +${sub.dailyCredits} Credits Claim Karein 🪙`}
                        </button>
                      ) : (
                        <div className="py-2 px-3 rounded-xl bg-amber-900/40 border border-amber-400/20 text-center text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                          <Check size={14} />
                          ✓ Aaj ka claim ho gaya (+{sub.dailyCredits} 🪙) · Agle credits kal raat 12:00 AM par milenge
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => setCreditSubTab('PASS')}
                  className={`py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                    creditSubTab === 'PASS'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>⚡</span>
                  <span>Credit Pass (Daily Drop)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreditSubTab('PACKAGES')}
                  className={`py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                    creditSubTab === 'PACKAGES'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📦</span>
                  <span>Credit Packs (Instant)</span>
                </button>
              </div>

              {creditSubTab === 'PASS' && renderCreditPassContent()}

              {creditSubTab === 'PACKAGES' && (
                packages.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>📦</span> Instant One-Time Packages
                      </h3>
                      <span className="text-[10px] text-amber-400 font-bold">Direct Top-up</span>
                    </div>

                    {packages.map((pkg) => {
                      let finalPrice = pkg.price;
                      if (totalDiscount > 0) finalPrice = Math.round(finalPrice * (1 - totalDiscount / 100));
                      const perCredit = finalPrice > 0 ? (finalPrice / pkg.credits).toFixed(2) : '0';
                      const isPopular = pkg.credits === 500;
                      return (
                        <button key={pkg.id} onClick={() => initiatePurchase(pkg)}
                          className="w-full p-4 sm:p-5 rounded-2xl text-left transition-all active:scale-[0.99] relative overflow-hidden"
                          style={isPopular
                            ? { background: C.goldBg, border: `2px solid ${C.goldBorder}`, boxShadow: `0 0 20px rgba(251,191,36,0.12)` }
                            : { background: C.surface, border: `1.5px solid ${C.border}` }}>
                          {isPopular && (
                            <div className="absolute top-0 right-0 text-[9px] font-black px-3 py-1.5 rounded-bl-xl rounded-tr-xl"
                              style={{ background: C.gold, color: '#000' }}>POPULAR</div>
                          )}
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                              style={{ background: C.goldBg, border: `1.5px solid ${C.goldBorder}` }}>🪙</div>
                            <div className="flex-1">
                              <p className="text-base font-black" style={{ color: C.text }}>{pkg.credits.toLocaleString('en-IN')} Credits</p>
                              <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>₹{perCredit} per credit</p>
                            </div>
                            <div className="text-right shrink-0">
                              {totalDiscount > 0 && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full block mb-1.5"
                                  style={{ background: C.goldBg, color: C.gold, border: `1px solid ${C.goldBorder}` }}>
                                  {totalDiscount}% OFF
                                </span>
                              )}
                              <p className="text-xl font-black" style={{ color: C.text }}>₹{finalPrice.toLocaleString('en-IN')}</p>
                              {totalDiscount > 0 && <p className="text-[10px] line-through mt-0.5" style={{ color: C.textDim }}>₹{pkg.price.toLocaleString('en-IN')}</p>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    <div className="flex justify-center gap-8 pt-2">
                      {[{icon:<ShieldCheck size={13}/>,text:'Secure'},{icon:<Zap size={13}/>,text:'Instant'},{icon:<Star size={13}/>,text:'No Expiry'}].map(b=>(
                        <div key={b.text} className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: C.textDim }}>{b.icon}<span>{b.text}</span></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl p-10 text-center border border-dashed border-amber-400/20 bg-amber-950/20">
                    <p className="font-black text-sm text-white mb-1">No Packages Available</p>
                    <p className="text-xs text-slate-400">Packages jald hi add honge.</p>
                  </div>
                )
              )}
            </div>
          );
        })()}

        {/* ── 4. DIAMONDS TAB (10 TO 50 💎 / DAY UNIFIED CARDS & INSTANT PACKS) ── */}
        {tierType === 'DIAMONDS' && (
          <div className="space-y-4">
            {/* Balance & Active Daily Drop Card */}
            <div className="rounded-3xl p-5 border border-sky-400/30 bg-sky-950/20">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-sky-400">Permanent Currency</span>
                  <h2 className="text-xl font-black text-white">{(user.diamonds ?? 0).toLocaleString('en-IN')} Diamonds</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Chapters hamesha ke liye unlock karein (Lifetime Access)</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-400/20 flex items-center justify-center text-xl">💎</div>
              </div>

              {user.diamondSubscription && new Date(user.diamondSubscription.endDate) > new Date() && (
                <div className="rounded-2xl p-3 bg-black/40 border border-sky-400/30 mt-3">
                  <div className="flex justify-between text-xs font-bold text-sky-300 mb-2">
                    <span>{user.diamondSubscription.planName}</span>
                    <span>+{user.diamondSubscription.dailyDiamonds} 💎/din</span>
                  </div>
                  {canClaimDailyDiamonds(user) ? (
                    <button
                      onClick={async () => {
                        setClaimingDiamonds(true);
                        const res = claimDailyDiamonds(user);
                        if (res && await saveUserToLive(res.updatedUser)) {
                          onUserUpdate(res.updatedUser);
                          setDiamondClaimSuccessMsg('Diamonds Claimed!');
                          setTimeout(() => setDiamondClaimSuccessMsg(null), 5000);
                        }
                        setClaimingDiamonds(false);
                      }}
                      disabled={claimingDiamonds}
                      className="w-full py-2 bg-sky-400 text-slate-950 rounded-xl font-black text-xs active:scale-95 transition-all shadow-md"
                    >
                      {claimingDiamonds ? 'Claiming...' : `Aaj Ke +${user.diamondSubscription.dailyDiamonds} 💎 Claim Karein`}
                    </button>
                  ) : (
                    <p className="text-[11px] text-center text-slate-400">✓ Aaj ka claim ho gaya!</p>
                  )}
                </div>
              )}
            </div>

            {/* Sub-navigation: Daily Passes vs Instant Packs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/10 rounded-2xl">
              <button
                type="button"
                onClick={() => setDiamondSubTab('SUBSCRIPTION')}
                className={`py-2 text-xs font-black rounded-xl transition-all ${
                  diamondSubTab === 'SUBSCRIPTION' ? 'bg-sky-400 text-slate-950 shadow-md' : 'text-slate-400'
                }`}
              >
                ⭐ Daily Pass (7D to 365D)
              </button>
              <button
                type="button"
                onClick={() => setDiamondSubTab('PACKS')}
                className={`py-2 text-xs font-black rounded-xl transition-all ${
                  diamondSubTab === 'PACKS' ? 'bg-sky-400 text-slate-950 shadow-md' : 'text-slate-400'
                }`}
              >
                📦 Instant Diamond Packs
              </button>
            </div>

            {/* SUB-SECTION 1: UNIFIED DIAMOND PASSES (10 to 50 💎 / Day) */}
            {diamondSubTab === 'SUBSCRIPTION' && (
              <div className="space-y-4">
                {diamondUnifiedTemplates.map(template => {
                  const selectedDurId = selectedDiamondDurations[template.id] || '30_DAYS';
                  const currentDur = DIAMOND_SUB_DURATIONS_LIST.find(d => d.id === selectedDurId) || DIAMOND_SUB_DURATIONS_LIST[1];
                  
                  const totalDiamonds = template.dailyDiamonds * currentDur.days;
                  const baseStandardPrice = totalDiamonds * 2.00;
                  const finalPrice = Math.round(totalDiamonds * currentDur.ratePerDiamond);
                  const discountPct = Math.round(((baseStandardPrice - finalPrice) / baseStandardPrice) * 100);

                  return (
                    <div
                      key={template.id}
                      className="rounded-2xl p-4 border shadow-xl relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(145deg, rgba(8,30,52,0.85) 0%, rgba(3,15,28,0.98) 100%)',
                        borderColor: '#38bdf855',
                        boxShadow: '0 8px 30px rgba(56,189,248,0.12)'
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-white/10">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-base">{template.icon}</span>
                            <h2 className="text-base font-black text-white">{template.name}</h2>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30">
                              💎 +{template.dailyDiamonds}/din
                            </span>
                            {discountPct > 0 && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950">
                                {discountPct}% OFF
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-300 mt-1">
                            Total: <strong className="text-sky-300">{totalDiamonds.toLocaleString('en-IN')} Diamonds</strong> (₹{currentDur.ratePerDiamond.toFixed(2)}/💎)
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1">
                            {discountPct > 0 && (
                              <span className="text-[11px] line-through text-slate-400">₹{baseStandardPrice}</span>
                            )}
                            <span className="text-2xl font-black text-sky-300">₹{finalPrice.toLocaleString('en-IN')}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 block font-medium">₹{(finalPrice / currentDur.days).toFixed(1)}/din</span>
                        </div>
                      </div>

                      {/* 5 Validity Selectors (7D, 30D, 90D, 180D, 365D) */}
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5 my-2.5">
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1">
                            <Clock size={11} /> VALIDITY CHUNEIN:
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">{currentDur.days} Din Active</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {DIAMOND_SUB_DURATIONS_LIST.map(dur => {
                            const isSel = dur.id === selectedDurId;
                            return (
                              <button
                                key={dur.id}
                                type="button"
                                onClick={() => setSelectedDiamondDurations(prev => ({ ...prev, [template.id]: dur.id }))}
                                className={`py-1.5 px-0.5 rounded-lg text-center border text-xs transition-all ${
                                  isSel
                                    ? 'bg-sky-400 text-slate-950 font-black shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                                }`}
                              >
                                <span className="block font-black text-[10px] leading-tight">{dur.label}</span>
                                <span className={`text-[8px] block ${isSel ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                                  ₹{dur.ratePerDiamond}/💎
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="my-2 p-2.5 rounded-xl bg-black/35 border border-white/10">
                        <div className="grid grid-cols-2 gap-1.5">
                          {template.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-1 text-[10.5px] text-slate-200">
                              <span className="text-sky-400 font-bold">✓</span>
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Subscribe CTA Button */}
                      <button
                        type="button"
                        onClick={() => initiatePurchase({
                          ...template,
                          isDiamondSub: true,
                          durationDays: currentDur.days,
                          durationLabel: currentDur.label,
                          price: finalPrice,
                          totalDiamonds: totalDiamonds,
                          ratePerDiamond: currentDur.ratePerDiamond
                        })}
                        className="w-full py-3 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md mt-3 cursor-pointer"
                      >
                        <Zap size={14} /> Subscribe {template.name} ({currentDur.label}) — ₹{finalPrice.toLocaleString('en-IN')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SUB-SECTION 2: INSTANT DIAMOND PACKS */}
            {diamondSubTab === 'PACKS' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DIAMOND_PACKS.map(pack => (
                  <div key={pack.id} className="p-4 rounded-2xl border border-sky-400/20 bg-black/40 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-black text-white">{pack.diamonds} 💎</h4>
                      <p className="text-[11px] text-slate-400">{pack.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => initiatePurchase({ ...pack, isDiamondPack: true })}
                      className="px-4 py-2 bg-sky-400 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      ₹{pack.price}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 5. EXCHANGE TAB ── */}
        {tierType === 'EXCHANGE' && (
          <div className="space-y-4">
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
                    type="number" min={1} max={user.diamonds ?? 0} value={exchangeDiamondsCount}
                    onChange={e => setExchangeDiamondsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-28 px-3 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-white font-black text-base text-center"
                  />
                  <div className="flex-1 flex gap-1.5">
                    {[1, 5, 10, 25].map(cnt => (
                      <button key={cnt} type="button" onClick={() => setExchangeDiamondsCount(cnt)}
                        className="flex-1 py-2 rounded-lg bg-white/5 text-xs font-black text-slate-300 border border-white/5 active:scale-95 cursor-pointer">
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
                  if (res && await saveUserToLive(res.updatedUser)) {
                    onUserUpdate(res.updatedUser);
                    setExchangeMsg(`✅ Badhai! +${res.creditsEarned} 🪙 Credits mil gaye!`);
                    setTimeout(() => setExchangeMsg(null), 5000);
                  }
                }}
                disabled={(user.diamonds ?? 0) < exchangeDiamondsCount}
                className="w-full py-3.5 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-emerald-500 to-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 cursor-pointer">
                <Coins size={16} />
                <span>Exchange Karein ({exchangeDiamondsCount * CREDITS_PER_DIAMOND} 🪙)</span>
              </button>
            </div>
          </div>
        )}

        {/* All Tiers Stacking Modal for Credit Pass reference */}
        {showAllTiersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 relative shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h3 className="text-base font-black text-white">Subscription & Pass XP Stacking</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllTiersModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg text-lg leading-none cursor-pointer">
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2">
                <p>
                  Agar aapke paas already koi subscription (Basic ya Ultra) hai, to Credit Pass ka bonus multiplier usme jud jata hai:
                </p>
                <div className="space-y-1.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-black text-white">Free Plan User (1.0x Base)</span>
                      <p className="text-[10px] text-slate-400">Pass se jitna multiplier hai wahi milega (e.g. 1.1x / 1.5x)</p>
                    </div>
                    <span className="text-xs font-bold text-amber-300">1.0x + Boost</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-black text-white">Basic Plan User (1.5x Base)</span>
                      <p className="text-[10px] text-slate-400">1.5x Base + Pass Multiplier Boost jud kar milta hai</p>
                    </div>
                    <span className="text-xs font-bold text-amber-300">1.5x + Boost</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-black text-white">Ultra Plan User (2.0x Base)</span>
                      <p className="text-[10px] text-slate-400">2.0x Base + Pass Multiplier Boost jud kar milta hai</p>
                    </div>
                    <span className="text-xs font-bold text-amber-300">2.0x + Boost</span>
                  </div>
                </div>
              </div>

              
              <button
                type="button"
                onClick={() => setShowAllTiersModal(false)}
                className="w-full py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 transition-colors cursor-pointer">
                Samajh Gaya
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
