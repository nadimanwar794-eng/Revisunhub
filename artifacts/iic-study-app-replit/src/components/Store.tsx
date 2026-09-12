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
  initialTier?: 'FREE' | 'SUBSCRIPTION' | 'CREDITS' | 'DIAMONDS' | 'EXCHANGE' | 'HISTORY';
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

  credit:       '#fbbf24',
  creditBg:     'rgba(251,191,36,0.10)',
  creditBorder: 'rgba(251,191,36,0.28)',
  creditGlow:   'rgba(251,191,36,0.22)',
  creditGrad:   'linear-gradient(135deg,#d97706,#fbbf24)',

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

/* ─── Subscription History Component ─── */
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

/* ─── Helper Functions ─── */
function getCreditPrice(planDuration: string, isUltra: boolean, plan?: any, settings?: SystemSettings): number {
  if (plan) {
    if (isUltra && typeof plan.creditPriceUltra === 'number' && plan.creditPriceUltra > 0) return plan.creditPriceUltra;
    if (!isUltra && typeof plan.creditPriceBasic === 'number' && plan.creditPriceBasic > 0) return plan.creditPriceBasic;
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
  const [tierType, setTierType] = useState<'FREE' | 'SUBSCRIPTION' | 'CREDITS' | 'DIAMONDS' | 'EXCHANGE' | 'HISTORY'>(() =>
    initialTier || (user.isPremium ? 'SUBSCRIPTION' : 'FREE')
  );

  useEffect(() => {
    if (initialTier) setTierType(initialTier);
  }, [initialTier]);

  const [diamondSubTab, setDiamondSubTab] = useState<'PACKS' | 'SUBSCRIPTION'>('SUBSCRIPTION');
  const [selectedDiamondDurations, setSelectedDiamondDurations] = useState<Record<string, string>>({});
  const [exchangeDiamondsCount, setExchangeDiamondsCount] = useState<number>(1);
  const [exchangeMsg, setExchangeMsg] = useState<string | null>(null);
  const [claimingDiamonds, setClaimingDiamonds] = useState(false);
  const [diamondClaimSuccessMsg, setDiamondClaimSuccessMsg] = useState<string | null>(null);

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
  const [openFaqBasic, setOpenFaqBasic] = useState(false);
  const [openFaqUltra, setOpenFaqUltra] = useState(false);
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

  const isFreeTab = tierType === 'FREE';
  const isSubTab = tierType === 'SUBSCRIPTION';
  const isCreditsTab = tierType === 'CREDITS';
  const isDiamondsTab = tierType === 'DIAMONDS';
  const isExchangeTab = tierType === 'EXCHANGE';
  const isHistoryTab = tierType === 'HISTORY';
  const isPro = selectedTierForPurchase === 'BASIC';

  const ac = isFreeTab
    ? { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', glow: 'rgba(148,163,184,0.18)', grad: 'linear-gradient(135deg,#64748b,#94a3b8)', pill: 'rgba(148,163,184,0.14)', label: 'FREE', emoji: '🎯' }
    : isCreditsTab
    ? { color: C.gold, bg: C.goldBg, border: C.goldBorder, glow: 'rgba(251,191,36,0.22)', grad: 'linear-gradient(135deg,#d97706,#fbbf24)', pill: 'rgba(251,191,36,0.14)', label: 'CREDITS', emoji: '🪙' }
    : isDiamondsTab
    ? { color: C.diamond, bg: C.diamondBg, border: C.diamondBorder, glow: C.diamondGlow, grad: 'linear-gradient(135deg,#0284c7,#38bdf8)', pill: 'rgba(56,189,248,0.14)', label: 'DIAMONDS', emoji: '💎' }
    : isExchangeTab
    ? { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', glow: 'rgba(16,185,129,0.18)', grad: 'linear-gradient(135deg,#059669,#10b981)', pill: 'rgba(16,185,129,0.14)', label: 'EXCHANGE', emoji: '🔄' }
    : selectedTierForPurchase === 'BASIC'
    ? { color: C.pro, bg: C.proBg, border: C.proBorder, glow: C.proGlow, grad: C.proGrad, pill: 'rgba(34,211,238,0.14)', label: 'PRO', emoji: '⭐' }
    : { color: C.max, bg: C.maxBg, border: C.maxBorder, glow: C.maxGlow, grad: C.maxGrad, pill: 'rgba(192,132,252,0.14)', label: 'MAX', emoji: '👑' };

  const allTabs = [
    { id: 'FREE'         as const, label: 'Free',         emoji: '🎯', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)',  glow: 'rgba(148,163,184,0.18)' },
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

  const basicSuperPowers = [
    ...(!isGroupStudyHidden ? [{
      title: 'Group Study & Live Classroom',
      desc: 'Friends ke sath real-time live study room join karein aur Live MCQ Battles me compete karein!',
      badge: 'LIVE STUDY',
      icon: '👥',
      highlight: true
    }] : []),
    { title: '+66% Extra Daily XP Limit', desc: 'Daily score limit 1,500 se badhkar 2,500 points ho jati hai — Rank fast badhao!', badge: '+66% XP', icon: '🚀', highlight: true },
    { title: '1.5X Score Multiplier', desc: 'Har test, lesson aur activity par seedha 50% bonus XP point boost!', badge: '1.5X BOOST', icon: '⚡', highlight: true },
    { title: 'Daily 50 Credits Pass', desc: 'Har din 50 credits auto-claim karein (Mahine ke 1,500 Credits bilkul muft)!', badge: '50 CR/DAY', icon: '🪙', highlight: true },
    { title: '20% Off Everywhere (Credits)', desc: 'App me kisi bhi test/mode ke credit cost par flat 20% permanent discount', badge: '20% OFF', icon: '🏷️' },
    { title: 'Projector Mode & PDF Mode', desc: 'Badi screen projector display aur full PDF reading interface unlock', badge: 'UNLOCKED', icon: '📽️' },
    { title: 'Writing & Correction Mode', desc: 'Digital writing notebook aur community question mistake correction power', badge: 'UNLOCKED', icon: '✍️' },
    { title: 'Text Color & Style Customization', desc: 'Apni pasand ke fonts, background text color aur custom contrast lagayein', badge: 'CUSTOM', icon: '🎨' },
    { title: 'All Basic Themes Free', desc: 'Sabhi stylish basic themes bina kisi extra charge ke unlock', badge: 'THEMES FREE', icon: '🎭' },
    { title: 'Offline Download Available', desc: 'Important revision lessons aur study material offline save karein', badge: 'DOWNLOAD', icon: '📥' },
    { title: 'Detailed Score History', desc: 'Har test ka score graph aur deep performance analytics dekhein', badge: 'ANALYTICS', icon: '📊' },
    { title: 'Community MCQ Submission', desc: 'Apne banaye huye sawal community me contribute karein', badge: 'CREATOR', icon: '💬' },
    { title: '+5% Permanent Store Discount', desc: 'Har subscription renewal aur store purchase par extra 5% discount', badge: '5% OFF', icon: '💎' },
  ];

  const ultraSuperPowers = [
    ...(!isGroupStudyHidden ? [{
      title: 'Host Live Classroom & MCQ Battles',
      desc: 'Apna khud ka live room create karein, whiteboard par padhayein aur custom Live MCQ Battles host karein!',
      badge: 'HOST & TEACH',
      icon: '🎓',
      highlight: true
    }] : []),
    { title: '+133% Massive Daily XP Limit', desc: '1,400+ daily score capacity — Leaderboard me #1 rank hasil karne ki power!', badge: '+133% MAX', icon: '👑', highlight: true },
    { title: '2.0X Ultra Score Multiplier', desc: 'Seedha 100% (2X Double) bonus points har activity par (Sabse tez rank boost)!', badge: '2X SPEED', icon: '🔥', highlight: true },
    { title: 'Daily 100 Credits Pass', desc: 'Har din 100 credits muft claim karein (Mahine ke 3,000 Credits)!', badge: '100 CR/DAY', icon: '🪙', highlight: true },
    { title: '40% Off Everywhere (Credits)', desc: 'Poore app me kisi bhi credit transaction par maximum 40% discount!', badge: '40% OFF', icon: '🏷️', highlight: true },
    { title: '3,000 MCQ / Day Practice Limit', desc: 'Huge 3,000 MCQ quota per day — Practice aur self-study ki koi seema nahi!', badge: '3,000 MCQ', icon: '🎯', highlight: true },
    { title: 'Flashcard Memory Revision Mode', desc: 'Super-fast memory cards revision mode se formula aur facts instant yaad karein', badge: 'UNLOCKED', icon: '🗂️' },
    { title: 'Full Video Mode Unlocked', desc: 'High-quality concept video lectures aur video player full access', badge: 'UNLOCKED', icon: '🎬' },
    { title: 'Global Student Community Chat', desc: 'Sabhi serious students ke sath group discussion aur direct doubt sharing', badge: 'COMMUNITY', icon: '🌐' },
    { title: 'Priority Content Suggestions', desc: 'Aapki request par admin naye chapters aur study material add karega', badge: 'VIP RIGHT', icon: '💡' },
    { title: 'All Ultra Premium Themes Free', desc: 'VIP glowing themes, neon dark styles aur dynamic UI layouts permanently free', badge: 'ALL THEMES', icon: '✨' },
    { title: '+10% Store Discount (Pro & Max)', desc: 'Pro aur Max subscription purchase aur renewal par 10% permanent discount', badge: '10% OFF', icon: '💎', highlight: true },
    { title: 'Golden VIP Crown & Glowing Name', desc: 'Leaderboard aur profile par VIP golden badge aur glowing royal effect', badge: 'VIP STATUS', icon: '👑' },
    { title: 'Zero Interruptions & VIP Priority Help', desc: 'Completely distraction-free study aur fastest response priority support', badge: 'VIP SUPPORT', icon: '🛡️' },
  ];

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

  const pageTheme = isFreeTab ? {
    bg: '#080d16',
    bgGrad: 'radial-gradient(ellipse 120% 70% at 50% -10%, rgba(100,116,139,0.22) 0%, #080d16 65%)',
    heroBg: 'linear-gradient(180deg, #111827 0%, #0b1120 100%)',
    heroBorder: 'rgba(148,163,184,0.25)',
    heroGlow1: 'rgba(148,163,184,0.16)',
    heroGlow2: 'rgba(100,116,139,0.10)',
    heroIconBg: 'linear-gradient(135deg,rgba(148,163,184,0.25),rgba(100,116,139,0.10))',
    heroIconBorder: 'rgba(148,163,184,0.45)',
    heroIconShadow: '0 0 16px rgba(148,163,184,0.25)',
    heroIconColor: '#cbd5e1',
    heroTitle: 'Free Plan',
    heroSub: 'Free Starter Tier · Standard Access & Limits',
    cardSurface: '#0f172a',
    cardBorder: 'rgba(148,163,184,0.18)',
  } : isSubTab ? {
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
    cardSurface: '#0f0c22',
    cardBorder: 'rgba(168,85,247,0.20)',
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
    heroSub: 'Instant Coin Packages & Daily Drop Pass',
    cardSurface: '#161106',
    cardBorder: 'rgba(251,191,36,0.18)',
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
    cardSurface: '#081726',
    cardBorder: 'rgba(56,189,248,0.18)',
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
    cardSurface: '#091c13',
    cardBorder: 'rgba(16,185,129,0.18)',
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
    cardSurface: C.surface,
    cardBorder: C.border,
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
                    ℹ️ Sabhi Premium study features unlock honge. Daily Credits claim sirf cash/UPI plans me milta hai.
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
                    {creditConfirmLoading ? 'Saving...' : '🪙 Haan, Kharido!'}
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
            <button
              id="store-header-diamonds-btn"
              onClick={() => setTierType('DIAMONDS')}
              className="flex items-center gap-1.5 px-2.5 rounded-2xl shrink-0 active:scale-95 transition-all group"
              style={{ height: 34, background: C.diamondBg, border: `1.5px solid ${C.diamondBorder}` }}
            >
              <span className="text-sm leading-none">💎</span>
              <span className="font-black text-sm leading-none" style={{ color: C.diamond }}>
                {(user.diamonds ?? 0).toLocaleString('en-IN')}
              </span>
              <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-sky-400 to-cyan-300 text-slate-950 flex items-center justify-center font-black text-[10px] shadow-sm ml-0.5">
                +
              </span>
            </button>
            <button
              id="store-header-credits-btn"
              onClick={() => setTierType('CREDITS')}
              className="flex items-center gap-1.5 px-2.5 rounded-2xl shrink-0 active:scale-95 transition-all group"
              style={{ height: 34, background: C.goldBg, border: `1.5px solid ${C.goldBorder}` }}
            >
              <span className="text-sm leading-none">🪙</span>
              <span className="font-black text-sm leading-none" style={{ color: C.gold }}>
                {userCredits.toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] font-black" style={{ color: 'rgba(251,191,36,0.55)' }}>CR</span>
              <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-[10px] shadow-sm ml-0.5">
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
        {tierType === 'HISTORY' && <SubHistory user={user} onBack={() => setTierType('FREE')} />}

        {/* ── 2. FREE PLAN TAB ── */}
        {tierType === 'FREE' && (
          <div className="animate-in fade-in duration-200 space-y-4">
            <div className="rounded-2xl p-5 border relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(148,163,184,0.12) 0%, rgba(30,41,59,0.7) 100%)',
                border: '1.5px solid rgba(148,163,184,0.25)',
              }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  {(!user.isPremium || user.subscriptionLevel === 'FREE') ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-[11px] font-black mb-2">
                      <BadgeCheck size={14} />
                      <span>AAPKA CURRENT PLAN (ACTIVE)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 text-[11px] font-bold mb-2">
                      <span>ℹ️ BASE TIER (Aapke paas {user.subscriptionLevel === 'ULTRA' ? 'MAX (Ultra)' : 'PRO (Basic)'} active hai)</span>
                    </div>
                  )}
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span>🎯 Free Plan</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">Base Tier</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Standard free access — sabhi basic features bina kisi payment ke hamesha muft available hain.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-slate-100">₹0</span>
                  <span className="text-[10px] block text-slate-400 font-bold uppercase">Free Forever</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
                <div className="p-2.5 rounded-xl bg-black/30 text-center">
                  <span className="text-base block mb-0.5">📅</span>
                  <span className="text-xs font-black text-white block">1,500 XP/Day</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Daily XP Limit</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 text-center">
                  <span className="text-base block mb-0.5">⚡</span>
                  <span className="text-xs font-black text-slate-300 block">1.0X Speed</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Standard Score</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 text-center">
                  <span className="text-base block mb-0.5">❓</span>
                  <span className="text-xs font-black text-slate-300 block">Free Quota</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Daily MCQs</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 text-center">
                  <span className="text-base block mb-0.5">🏷️</span>
                  <span className="text-xs font-black text-slate-400 block">0% OFF</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Store Discount</span>
                </div>
              </div>
            </div>

            {/* Included features list */}
            <div className="rounded-2xl p-4 bg-[#0d1522] border border-emerald-500/25">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-black">
                  ✓
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-400 leading-none">Free Me Kya-Kya Mil Raha Hai</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ye sabhi features aap bina kisi charge ke use kar sakte hain:</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { icon: '❓', title: 'Standard Daily MCQs', desc: 'Har din free quota ke MCQ tests practice karne ki suvidha' },
                  { icon: '📖', title: 'Standard Reading Mode', desc: 'Syllabus chapters aur standard notes padhne ka access' },
                  { icon: '🪙', title: 'Daily Free Coin Claim', desc: 'Rozana login karke muft bonus coins claim karein' },
                  { icon: '🔥', title: 'Login Streak & XP Tracker', desc: 'Consistency banayein aur daily streak points earn karein' },
                  { icon: '📝', title: 'Homework & Syllabus Overview', desc: 'Classes aur daily assignments overview dekhne ka access' },
                  { icon: '🏆', title: 'Public Leaderboard View', desc: 'Overall rankings aur student standing dekhne ki suvidha' },
                  { icon: '🎧', title: 'Basic Voice Audio Reader', desc: 'Normal speed par chapters audio sunne ka access' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-black/25 border border-emerald-500/15">
                    <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-200">{item.title}</span>
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded">FREE</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Table */}
            <div className="rounded-2xl p-4 bg-[#0a0f1d] border border-white/10 overflow-x-auto">
              <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                <span>📊</span> Full Feature Comparison (Free vs Pro vs Max)
              </h3>
              <p className="text-[11px] text-slate-400 mb-3">Sabhi plans ki direct tulna ek nazar me dekhein:</p>
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2 pr-2 font-black">Feature</th>
                    <th className="py-2 px-1 text-center font-black text-slate-300">Free 🎯</th>
                    <th className="py-2 px-1 text-center font-black text-cyan-400">Pro ⭐</th>
                    <th className="py-2 pl-1 text-center font-black text-purple-400">Max ⚡</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-2 pr-2 font-bold text-slate-300">Daily XP Limit</td>
                    <td className="py-2 px-1 text-center text-slate-400">1,500 pts</td>
                    <td className="py-2 px-1 text-center text-cyan-300 font-bold">2,500 pts (+66%)</td>
                    <td className="py-2 pl-1 text-center text-purple-300 font-bold">3,500 pts (+133%)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-bold text-slate-300">XP Multiplier</td>
                    <td className="py-2 px-1 text-center text-slate-400">1.0X</td>
                    <td className="py-2 px-1 text-center text-cyan-300 font-bold">1.5X Boost</td>
                    <td className="py-2 pl-1 text-center text-purple-300 font-bold">2.0X Super Boost</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-bold text-slate-300">Daily Credits Pass</td>
                    <td className="py-2 px-1 text-center text-slate-500">—</td>
                    <td className="py-2 px-1 text-center text-amber-300 font-bold">50 CR / Day</td>
                    <td className="py-2 pl-1 text-center text-amber-300 font-bold">100 CR / Day</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-bold text-slate-300">Credit Cost Off</td>
                    <td className="py-2 px-1 text-center text-slate-500">0%</td>
                    <td className="py-2 px-1 text-center text-emerald-400 font-bold">20% OFF</td>
                    <td className="py-2 pl-1 text-center text-emerald-400 font-bold">40% OFF</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-bold text-slate-300">Projector & PDF Mode</td>
                    <td className="py-2 px-1 text-center text-rose-400 font-bold">✕</td>
                    <td className="py-2 px-1 text-center text-emerald-400 font-bold">✓</td>
                    <td className="py-2 pl-1 text-center text-emerald-400 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-bold text-slate-300">Flashcard Memory Mode</td>
                    <td className="py-2 px-1 text-center text-rose-400 font-bold">✕</td>
                    <td className="py-2 px-1 text-center text-slate-500">—</td>
                    <td className="py-2 pl-1 text-center text-emerald-400 font-bold">✓ Unlocked</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Accordions with complete superpowers */}
            <div className="space-y-3 pt-1">
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
                <button type="button" onClick={() => setOpenFaqBasic(!openFaqBasic)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">⭐</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">Basic Plan Kya Hai?</h4>
                      <p className="text-[11px] text-slate-400">Pro (Basic) plan superpowers aur features</p>
                    </div>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${openFaqBasic ? 'rotate-180 text-cyan-300' : 'text-slate-400'}`} />
                </button>
                {openFaqBasic && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-2">
                    {basicSuperPowers.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black text-slate-100">{item.title}</span>
                          <p className="text-[10px] text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
                <button type="button" onClick={() => setOpenFaqUltra(!openFaqUltra)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">👑</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">Ultra Plan Kya Hai?</h4>
                      <p className="text-[11px] text-slate-400">Max Elite VIP superpowers aur features</p>
                    </div>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${openFaqUltra ? 'rotate-180 text-purple-300' : 'text-slate-400'}`} />
                </button>
                {openFaqUltra && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-2">
                    {ultraSuperPowers.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black text-slate-100">{item.title}</span>
                          <p className="text-[10px] text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 3. VIP SUBSCRIPTIONS (CONSOLIDATED PRO & MAX CARDS) ── */}
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
                        className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg"
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
                          className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border text-amber-400 bg-amber-400/10 border-amber-400/30">
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

        {/* ── 4. CREDITS TAB (PASS & PACKS) ── */}
        {tierType === 'CREDITS' && (() => {
          const creditSubPlans = getCreditSubPlans(settings).filter(p => p.isActive !== false);
          return (
            <div className="space-y-4">
              {passClaimSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-black text-center">
                  {passClaimSuccessMsg}
                </div>
              )}

              {/* Status Header */}
              <div className="rounded-3xl p-5 border border-amber-400/30 bg-amber-950/20">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-400">Study Currency</span>
                    <h2 className="text-xl font-black text-white">{userCredits.toLocaleString('en-IN')} Credits</h2>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center text-xl">🪙</div>
                </div>

                {isCreditSubActive(user) && user.creditSubscription && (
                  <div className="rounded-2xl p-3 bg-black/40 border border-amber-400/30 mt-3">
                    <div className="flex justify-between text-xs font-bold text-amber-300 mb-2">
                      <span>Pass Active ({getCreditSubDaysRemaining(user.creditSubscription)} Din Baki)</span>
                      <span>+{user.creditSubscription.dailyCredits} 🪙/din</span>
                    </div>
                    {canClaimCreditSubToday(user) ? (
                      <button onClick={handleClaimStorePass} disabled={claimingStorePass}
                        className="w-full py-2 bg-amber-400 text-slate-950 rounded-xl font-black text-xs">
                        {claimingStorePass ? 'Claiming...' : `Claim +${user.creditSubscription.dailyCredits} Credits`}
                      </button>
                    ) : (
                      <p className="text-[11px] text-center text-slate-400">✓ Aaj ka claim ho gaya!</p>
                    )}
                  </div>
                )}
              </div>

              {/* Sub-tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/10 rounded-2xl">
                <button onClick={() => setCreditSubTab('PASS')}
                  className={`py-2 text-xs font-black rounded-xl ${creditSubTab === 'PASS' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'}`}>
                  ⚡ Credit Pass (Daily)
                </button>
                <button onClick={() => setCreditSubTab('PACKAGES')}
                  className={`py-2 text-xs font-black rounded-xl ${creditSubTab === 'PACKAGES' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'}`}>
                  📦 Instant Packs
                </button>
              </div>

              {creditSubTab === 'PASS' && (
                <div className="space-y-3">
                  {creditSubPlans.map(plan => {
                    const selectedDurationId = planDurations[plan.id] || '1_MONTH';
                    const durOpt = CREDIT_SUB_DURATIONS.find(d => d.id === selectedDurationId) || CREDIT_SUB_DURATIONS[0];
                    const pricing = calculateCreditSubPrice(plan, durOpt, false, getCreditSubDurationDiscount(durOpt.id));

                    return (
                      <div key={plan.id} className="rounded-2xl p-4 border border-amber-400/30 bg-black/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-sm font-black text-white">{plan.name}</h3>
                            <span className="text-[10px] text-amber-400 font-bold">+{plan.dailyCredits} 🪙/din</span>
                          </div>
                          <span className="text-base font-black text-amber-400">₹{pricing.finalPrice}</span>
                        </div>

                        {/* Validity Buttons */}
                        <div className="grid grid-cols-4 gap-1 my-2">
                          {CREDIT_SUB_DURATIONS.map(dur => (
                            <button key={dur.id} type="button"
                              onClick={() => setPlanDurations(p => ({ ...p, [plan.id]: dur.id }))}
                              className={`py-1 rounded text-[10px] font-bold border ${selectedDurationId === dur.id ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-300 border-white/10'}`}>
                              {dur.label}
                            </button>
                          ))}
                        </div>

                        <button onClick={() => initiatePurchase({ ...plan, price: pricing.finalPrice, isCreditSub: true, durationDays: durOpt.durationDays })}
                          className="w-full py-2 bg-amber-400 text-slate-950 rounded-xl font-black text-xs mt-2">
                          Subscribe — ₹{pricing.finalPrice}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {creditSubTab === 'PACKAGES' && (
                <div className="space-y-3">
                  {packages.map(pkg => (
                    <div key={pkg.id} className="p-4 rounded-2xl border border-white/10 bg-black/40 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-black text-white">{pkg.credits} Credits</h4>
                        <p className="text-[11px] text-slate-400">Instant direct topup</p>
                      </div>
                      <button onClick={() => initiatePurchase(pkg)} className="px-4 py-2 bg-amber-400 text-slate-950 font-black rounded-xl text-xs">
                        ₹{pkg.price}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── 5. DIAMONDS TAB (10 TO 50 💎 / DAY UNIFIED CARDS & INSTANT PACKS) ── */}
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
                        className="w-full py-3 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md mt-3"
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
                      className="px-4 py-2 bg-sky-400 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition-all shadow-md"
                    >
                      ₹{pack.price}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 6. EXCHANGE TAB ── */}
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
                        className="flex-1 py-2 rounded-lg bg-white/5 text-xs font-black text-slate-300 border border-white/5 active:scale-95">
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
                className="w-full py-3.5 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-emerald-500 to-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40">
                <Coins size={16} />
                <span>Exchange Karein ({exchangeDiamondsCount * CREDITS_PER_DIAMOND} 🪙)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

