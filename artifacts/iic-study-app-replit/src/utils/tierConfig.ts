export interface TierFeature {
  id: string;
  sn: string;
  name: string;
  free: string;
  basic: string;
  ultra: string;
  category: 'Main' | 'Revision Slate' | 'Nsta Messenger';
  isSubItem?: boolean;
}

export const DEFAULT_TIER_FEATURES: TierFeature[] = [
  // Main Features
  { id: 'f1', sn: '1', name: 'Leader Board', free: '✓ Level 2', basic: '✓ Level 2', ultra: '✓ Level 2', category: 'Main' },
  { id: 'f2', sn: '2', name: 'Reading mode', free: '20 cr / 5 diamond', basic: '20 cr / 5 diamond', ultra: '20 cr / 5 diamond', category: 'Main' },
  { id: 'f3', sn: '3', name: 'Writing mode', free: '20 cr / 5 diamond', basic: '20 cr / 5 diamond', ultra: '20 cr / 5 diamond', category: 'Main' },
  { id: 'f4', sn: '4', name: 'MCQ mode', free: '20 cr / 5 diamond', basic: '20 cr / 5 diamond', ultra: '20 cr / 5 diamond', category: 'Main' },
  { id: 'f5', sn: '5', name: 'Projector mode', free: '20 cr / 5 diamond', basic: '20 cr / 5 diamond', ultra: '20 cr / 5 diamond', category: 'Main' },
  { id: 'f6', sn: '6', name: 'Flashcard', free: '5 diamond', basic: '5 diamond', ultra: '✓', category: 'Main' },
  { id: 'f7', sn: '7', name: 'PDF', free: '5 diamond', basic: 'Free', ultra: 'Free', category: 'Main' },
  { id: 'f8', sn: '8', name: 'Video', free: '5 diamond', basic: '5 diamond', ultra: 'Free', category: 'Main' },
  { id: 'f9', sn: '9', name: 'Solution (MCQ)', free: '✓', basic: '✓', ultra: '✓', category: 'Main' },
  { id: 'f10', sn: '10', name: 'Official Marksheet', free: '✓', basic: '✓', ultra: '✓', category: 'Main' },
  { id: 'f11', sn: '11', name: 'Full Analysis', free: '20 cr / 5 diamond', basic: '20 cr / 5 diamond', ultra: '20 cr / 5 diamond', category: 'Main' },
  { id: 'f12', sn: '12', name: 'Revision Hub', free: '100 cr / 20 diamond', basic: '100 cr / 20 diamond', ultra: '100 cr / 20 diamond', category: 'Main' },
  { id: 'f13', sn: '13', name: 'Community', free: '—', basic: '—', ultra: '—', category: 'Main' },
  { id: 'f14_1', sn: '14.1', name: '↳ Global message', free: '✗', basic: '✗', ultra: '✓', category: 'Main', isSubItem: true },
  { id: 'f14_2', sn: '14.2', name: '↳ MCQ', free: '✓', basic: '✓', ultra: '✓', category: 'Main', isSubItem: true },
  { id: 'f14_3', sn: '14.3', name: '↳ Help (Admin Support)', free: '✓', basic: '✓', ultra: '✓', category: 'Main', isSubItem: true },
  { id: 'f15', sn: '15', name: 'Theme Studio', free: '✓', basic: '✓', ultra: '✓', category: 'Main' },
  { id: 'f16', sn: '16', name: 'Score History', free: '✓', basic: '✓', ultra: '✓', category: 'Main' },
  { id: 'f17', sn: '17', name: 'Revision multiple Books compilation', free: '✗', basic: '✗', ultra: '✓', category: 'Main' },
  { id: 'f18', sn: '18', name: 'Revision Hub (Unlock/Limit)', free: 'Unlock', basic: '✓', ultra: '✓', category: 'Main' },
  { id: 'f19', sn: '19', name: 'Nsta Messenger', free: '✓', basic: '✓', ultra: '✓', category: 'Main' },
  { id: 'f20', sn: '20', name: 'Daily Limit', free: '1500', basic: '2500', ultra: '3500', category: 'Main' },
  { id: 'f21', sn: '21', name: 'XP multiplier', free: '1x', basic: '1.5x', ultra: '2.0x', category: 'Main' },
  { id: 'f22', sn: '22', name: 'Ad discount', free: '0%', basic: '10%', ultra: '20%', category: 'Main' },
  { id: 'f23', sn: '23', name: 'Text & Style color', free: '✗', basic: '✓', ultra: '✓', category: 'Main' },
  { id: 'f24', sn: '24', name: 'Offline Download', free: '✗', basic: '✓', ultra: '✓', category: 'Main' },
  { id: 'f25', sn: '25', name: 'Daily claim', free: '50 cr', basic: '5 diamond', ultra: '5 diamond', category: 'Main' },
  { id: 'f26', sn: '26', name: 'Store discount', free: '0%', basic: '5%', ultra: '10%', category: 'Main' },
  { id: 'f27', sn: '27', name: 'Writing & Correction mode', free: 'Free', basic: 'Basic', ultra: 'Ultra', category: 'Main' },
  { id: 'f28', sn: '28', name: 'Basic theme', free: '✗', basic: '✓', ultra: '✓', category: 'Main' },
  { id: 'f29', sn: '29', name: 'Ultra theme', free: '✗', basic: '✗', ultra: '✓', category: 'Main' },
  { id: 'f30', sn: '30', name: 'MCQ Limit', free: '300 / day', basic: '1500 / day', ultra: '3000 / day', category: 'Main' },
  { id: 'f31', sn: '31', name: 'Name change', free: '100 cr / 20 diamond', basic: 'Same', ultra: 'Same', category: 'Main' },

  // Revision Slate Features
  { id: 'rs1', sn: '-', name: 'Free Slates', free: '2 free', basic: '3 free', ultra: '4 free', category: 'Revision Slate' },
  { id: 'rs2', sn: '-', name: '100 cr buy 1 slate', free: '100 cr buy 1 slate', basic: 'Same', ultra: 'Same', category: 'Revision Slate' },
  { id: 'rs3', sn: '-', name: 'Level 5 reward', free: 'Lev 5 - 1 slate', basic: 'Same', ultra: 'Same', category: 'Revision Slate' },
  { id: 'rs4', sn: '-', name: 'Level 8 reward', free: 'Lev 8 - 1 slate', basic: 'Same', ultra: 'Same', category: 'Revision Slate' },

  // Nsta Messenger Features
  { id: 'nm1', sn: '-', name: 'Friend Message (Limit)', free: '10 / 20', basic: '20 / 50', ultra: '30 / 50', category: 'Nsta Messenger' },
  { id: 'nm2', sn: '-', name: 'Messages per day', free: '50 / day', basic: '100 / day', ultra: '300 / day', category: 'Nsta Messenger' },
  { id: 'nm3', sn: '-', name: 'Chat Lock', free: '✓', basic: '✓', ultra: '✓', category: 'Nsta Messenger' },
  { id: 'nm4', sn: '-', name: 'Change Password', free: '✓', basic: '✓', ultra: '✓', category: 'Nsta Messenger' },
];
