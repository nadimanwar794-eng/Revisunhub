import { User, UserDiamondSubscription, DiamondPack, DiamondSubscriptionPlan } from '../types';

/**
 * Direct Diamond Packs as requested:
 * 100 rs -> 50 diamonds
 * 200 rs -> 105 diamonds
 * 400 rs -> 250 diamonds
 * 1000 rs -> 650 diamonds
 * 2000 rs -> 1400 diamonds
 * 5000 rs -> 5000 diamonds
 * Fixed pricing (no arbitrary discounts on diamonds)
 */
export const DIAMOND_PACKS: DiamondPack[] = [
  {
    id: 'pack_50_dia',
    name: 'Starter Pouch',
    price: 100,
    diamonds: 50,
    bonusDiamonds: 0,
    popular: false,
  },
  {
    id: 'pack_105_dia',
    name: 'Value Sack',
    price: 200,
    diamonds: 105,
    bonusDiamonds: 5,
    popular: true,
  },
  {
    id: 'pack_250_dia',
    name: 'Pro Treasure',
    price: 400,
    diamonds: 250,
    bonusDiamonds: 50,
    popular: false,
  },
  {
    id: 'pack_650_dia',
    name: 'Royal Chest',
    price: 1000,
    diamonds: 650,
    bonusDiamonds: 150,
    popular: false,
  },
  {
    id: 'pack_1400_dia',
    name: 'Master Vault',
    price: 2000,
    diamonds: 1400,
    bonusDiamonds: 400,
    popular: false,
  },
  {
    id: 'pack_5000_dia',
    name: 'Supreme Hoard',
    price: 5000,
    diamonds: 5000,
    bonusDiamonds: 2500,
    popular: true,
  },
];

/**
 * Diamond Subscriptions:
 * 4 Types of Daily Diamonds (Weekly 7 Days & Monthly 30 Days):
 * Rate is strictly Rs 2 per Diamond (1 Diamond = Rs 2):
 *
 * 1. 10 Diamonds/day:
 *    - Weekly (7 days): 70 💎 -> ₹140
 *    - Monthly (30 days): 300 💎 -> ₹600
 * 2. 25 Diamonds/day:
 *    - Weekly (7 days): 175 💎 -> ₹350
 *    - Monthly (30 days): 750 💎 -> ₹1,500
 * 3. 50 Diamonds/day:
 *    - Weekly (7 days): 350 💎 -> ₹700
 *    - Monthly (30 days): 1500 💎 -> ₹3,000
 * 4. 100 Diamonds/day:
 *    - Weekly (7 days): 700 💎 -> ₹1,400
 *    - Monthly (30 days): 3000 💎 -> ₹6,000
 */
export const PRESET_DIAMOND_SUB_TEMPLATES = [
  {
    id: '10_DIA_BASE',
    name: 'Starter Diamond Pass',
    dailyDiamonds: 10,
    ratePerDiamond: 2,
    badge: '10 💎 / DAY',
    description: 'Basic unlock pass (10 Diamonds / Day)',
  },
  {
    id: '25_DIA_BASE',
    name: 'Popular Diamond Pass',
    dailyDiamonds: 25,
    ratePerDiamond: 2,
    badge: '25 💎 / DAY',
    description: 'Perfect for regular users (25 Diamonds / Day)',
  },
  {
    id: '50_DIA_BASE',
    name: 'Pro Diamond Pass',
    dailyDiamonds: 50,
    ratePerDiamond: 2,
    badge: '50 💎 / DAY',
    description: 'For power users (50 Diamonds / Day)',
  },
  {
    id: '100_DIA_BASE',
    name: 'Ultra Mega Pass',
    dailyDiamonds: 100,
    ratePerDiamond: 2,
    badge: '100 💎 / DAY',
    description: 'Maximum unlocks (100 Diamonds / Day)',
  },
];

export const DIAMOND_SUBSCRIPTION_PLANS: DiamondSubscriptionPlan[] = [
  // ── 10 DIAMONDS / DAY ─────────────────────────────────────────
  {
    id: '10_DIAMONDS_WEEKLY',
    name: 'Starter Weekly Pass (10/Day)',
    price: 140, // 70 diamonds * ₹2
    dailyDiamonds: 10,
    durationDays: 7,
    totalDiamonds: 70,
    badge: '10 💎 / DAY · WEEKLY',
    planType: 'WEEKLY',
    ratePerDiamond: 2,
  },
  {
    id: '10_DIAMONDS_DAILY', // alias for monthly 10/day
    name: 'Starter Monthly Pass (10/Day)',
    price: 600, // 300 diamonds * ₹2
    dailyDiamonds: 10,
    durationDays: 30,
    totalDiamonds: 300,
    badge: '10 💎 / DAY · MONTHLY',
    planType: 'MONTHLY',
    ratePerDiamond: 2,
  },

  // ── 25 DIAMONDS / DAY ─────────────────────────────────────────
  {
    id: '25_DIAMONDS_WEEKLY',
    name: 'Popular Weekly Pass (25/Day)',
    price: 350, // 175 diamonds * ₹2
    dailyDiamonds: 25,
    durationDays: 7,
    totalDiamonds: 175,
    badge: '25 💎 / DAY · POPULAR WEEKLY',
    planType: 'WEEKLY',
    ratePerDiamond: 2,
  },
  {
    id: '25_DIAMONDS_DAILY', // alias for monthly 25/day
    name: 'Popular Monthly Pass (25/Day)',
    price: 1500, // 750 diamonds * ₹2
    dailyDiamonds: 25,
    durationDays: 30,
    totalDiamonds: 750,
    badge: '25 💎 / DAY · POPULAR MONTHLY',
    planType: 'MONTHLY',
    ratePerDiamond: 2,
  },

  // ── 50 DIAMONDS / DAY ─────────────────────────────────────────
  {
    id: '50_DIAMONDS_WEEKLY',
    name: 'Pro Weekly Pass (50/Day)',
    price: 700, // 350 diamonds * ₹2
    dailyDiamonds: 50,
    durationDays: 7,
    totalDiamonds: 350,
    badge: '50 💎 / DAY · BEST VALUE WEEKLY',
    planType: 'WEEKLY',
    ratePerDiamond: 2,
  },
  {
    id: '50_DIAMONDS_DAILY', // alias for monthly 50/day
    name: 'Pro Monthly Pass (50/Day)',
    price: 3000, // 1500 diamonds * ₹2
    dailyDiamonds: 50,
    durationDays: 30,
    totalDiamonds: 1500,
    badge: '50 💎 / DAY · BEST VALUE MONTHLY',
    planType: 'MONTHLY',
    ratePerDiamond: 2,
  },

  // ── 100 DIAMONDS / DAY ────────────────────────────────────────
  {
    id: '100_DIAMONDS_WEEKLY',
    name: 'Ultra Mega Weekly Pass (100/Day)',
    price: 1400, // 700 diamonds * ₹2
    dailyDiamonds: 100,
    durationDays: 7,
    totalDiamonds: 700,
    badge: '100 💎 / DAY · VIP MEGA WEEKLY',
    planType: 'WEEKLY',
    ratePerDiamond: 2,
  },
  {
    id: '100_DIAMONDS_DAILY', // alias for monthly 100/day
    name: 'Ultra Mega Monthly Pass (100/Day)',
    price: 6000, // 3000 diamonds * ₹2
    dailyDiamonds: 100,
    durationDays: 30,
    totalDiamonds: 3000,
    badge: '100 💎 / DAY · VIP MEGA MONTHLY',
    planType: 'MONTHLY',
    ratePerDiamond: 2,
  },
];

/**
 * Exchange Rate: 1 Diamond = 20 Credits (20 CR = 1 💎)
 */
export const DIAMOND_TO_CREDIT_RATE = 20;
export const CREDITS_PER_DIAMOND = 10;

/**
 * Safely get user's diamonds count
 */
export function getUserDiamonds(user?: User | null): number {
  if (!user) return 0;
  return Number(user.diamonds ?? 0);
}

/**
 * Convert Diamonds to Credits:
 * Checks if user has enough diamonds, deducts diamonds and adds credits (numDiamonds * 20)
 */
export function exchangeDiamondsForCredits(
  user: User,
  numDiamonds: number
): { success: boolean; updatedUser: User; creditsAdded: number; creditsEarned: number; error?: string } {
  if (numDiamonds <= 0) {
    return { success: false, updatedUser: user, creditsAdded: 0, creditsEarned: 0, error: 'Diamonds ki sankhya 1 ya usse zyada honi chahiye' };
  }
  const currentDiamonds = getUserDiamonds(user);
  if (currentDiamonds < numDiamonds) {
    return {
      success: false,
      updatedUser: user,
      creditsAdded: 0,
      creditsEarned: 0,
      error: `Aapke paas paryapt Diamonds nahi hain. Chahiye: ${numDiamonds} 💎, Hai: ${currentDiamonds} 💎`,
    };
  }

  const creditsToAdd = numDiamonds * DIAMOND_TO_CREDIT_RATE;
  const updatedUser: User = {
    ...user,
    diamonds: currentDiamonds - numDiamonds,
    credits: (user.credits ?? 0) + creditsToAdd,
  };

  return {
    success: true,
    updatedUser,
    creditsAdded: creditsToAdd,
    creditsEarned: creditsToAdd,
  };
}

/**
 * Convert Credits to Diamonds:
 * CRITICAL RULE: Credits to Diamonds conversion is strictly NOT allowed ("cradit se dimond kabhi na hoga").
 * Only Diamonds -> Credits is supported.
 */
export function exchangeCreditsForDiamonds(
  user: User,
  _numDiamonds: number
): { success: boolean; updatedUser: User; creditsDeducted: number; diamondsAdded: number; error?: string } {
  return {
    success: false,
    updatedUser: user,
    creditsDeducted: 0,
    diamondsAdded: 0,
    error: 'Credits se Diamonds exchange nahi kiya ja sakta. Diamonds sirf purchase ya rewards se mil sakte hain.',
  };
}

/**
 * Check if Diamond Subscription is currently active
 */
export function isDiamondSubActive(user?: User | null): boolean {
  if (!user?.diamondSubscription) return false;
  const sub = user.diamondSubscription;
  if (sub.status === 'EXPIRED') return false;
  const now = new Date().getTime();
  const end = new Date(sub.endDate).getTime();
  return end > now;
}

/**
 * Check if user can claim today's daily diamonds from active subscription
 */
export function canClaimDiamondSubToday(user?: User | null): boolean {
  if (!user || !isDiamondSubActive(user)) return false;
  const today = new Date().toISOString().split('T')[0];
  return user.diamondSubscription?.lastClaimDate !== today;
}

/**
 * Alias for canClaimDiamondSubToday
 */
export const canClaimDailyDiamonds = canClaimDiamondSubToday;

/**
 * Remaining days of active diamond subscription
 */
export function getDiamondSubDaysRemaining(user?: User | null): number {
  if (!user || !isDiamondSubActive(user)) return 0;
  const now = new Date().getTime();
  const end = new Date(user.diamondSubscription!.endDate).getTime();
  const diff = Math.max(0, end - now);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Claim today's daily diamonds from active subscription
 */
export function claimDailyDiamonds(
  user: User
): { success: boolean; earned: number; updatedUser: User } | null {
  if (!canClaimDiamondSubToday(user)) return null;
  const sub = user.diamondSubscription!;
  const today = new Date().toISOString().split('T')[0];
  const dailyAmount = sub.dailyDiamonds;

  const updatedSub: UserDiamondSubscription = {
    ...sub,
    lastClaimDate: today,
    totalClaimedDays: (sub.totalClaimedDays || 0) + 1,
    totalDiamondsClaimed: (sub.totalDiamondsClaimed || 0) + dailyAmount,
  };

  const updatedUser: User = {
    ...user,
    diamonds: getUserDiamonds(user) + dailyAmount,
    diamondSubscription: updatedSub,
  };

  return {
    success: true,
    earned: dailyAmount,
    updatedUser,
  };
}

/**
 * Helper to activate diamond subscription upon purchase
 */
export function activateDiamondSub(
  user: User,
  planId: string
): User {
  const plan = DIAMOND_SUBSCRIPTION_PLANS.find(p => p.id === planId) || DIAMOND_SUBSCRIPTION_PLANS[0];
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const newSub: UserDiamondSubscription = {
    planId: plan.id,
    planName: plan.name,
    dailyDiamonds: plan.dailyDiamonds,
    totalDays: plan.durationDays,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalClaimedDays: 0,
    totalDiamondsClaimed: 0,
    pricePaid: plan.price,
    status: 'ACTIVE',
  };

  return {
    ...user,
    diamondSubscription: newSub,
  };
}

/**
 * Helper to cancel/revoke diamond subscription (Admin action)
 */
export function cancelDiamondSub(user: User): User {
  return {
    ...user,
    diamondSubscription: undefined,
  };
}
