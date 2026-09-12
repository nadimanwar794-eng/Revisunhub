export type DiamondSubDurationId = '1_WEEK' | '1_MONTH' | '3_MONTH' | '6_MONTH' | '1_YEAR';
export interface DiamondSubDurationOption {
  id: DiamondSubDurationId;
  label: string;
  subLabel: string;
  durationDays: number;
  durationDiscountPercent: number;
  badge?: string;
  highlight?: boolean;
}

export const DIAMOND_SUB_DURATIONS: DiamondSubDurationOption[] = [
  {
    id: '1_WEEK',
    label: '1 Week',
    subLabel: '7 Din',
    durationDays: 7,
    durationDiscountPercent: 0,
    badge: 'BASE',
  },
  {
    id: '1_MONTH',
    label: '1 Month',
    subLabel: '30 Din',
    durationDays: 30,
    durationDiscountPercent: 5,
    badge: '5% OFF',
  },
  {
    id: '3_MONTH',
    label: '3 Months',
    subLabel: '90 Din',
    durationDays: 90,
    durationDiscountPercent: 10,
    badge: '10% OFF',
  },
  {
    id: '6_MONTH',
    label: '6 Months',
    subLabel: '180 Din',
    durationDays: 180,
    durationDiscountPercent: 15,
    badge: '15% OFF',
  },
  {
    id: '1_YEAR',
    label: '1 Year',
    subLabel: '365 Din',
    durationDays: 365,
    durationDiscountPercent: 25,
    badge: '25% OFF',
    highlight: true,
  },
];

export function calculateDiamondSubPrice(
  baseDailyDiamonds: number,
  durationOption: DiamondSubDurationOption,
  baseRatePerDiamond: number = 2
) {
  const totalDiamonds = baseDailyDiamonds * durationOption.durationDays;
  const basePrice = totalDiamonds * baseRatePerDiamond;
  const dummyPrice = Math.round(basePrice * 1.5); // Just a dummy display price

  const totalDiscountPercent = durationOption.durationDiscountPercent;
  const finalPrice = totalDiscountPercent > 0
    ? Math.max(1, Math.round(basePrice * (1 - totalDiscountPercent / 100)))
    : basePrice;

  return {
    basePrice,
    dummyPrice,
    totalDiscountPercent,
    finalPrice,
    totalDiamonds,
  };
}
