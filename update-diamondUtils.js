const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/utils/diamondUtils.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `export const DIAMOND_SUBSCRIPTION_PLANS: DiamondSubscriptionPlan[] = [`;
const replacement = `export const PRESET_DIAMOND_SUB_TEMPLATES = [
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

export const DIAMOND_SUBSCRIPTION_PLANS: DiamondSubscriptionPlan[] = [`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
