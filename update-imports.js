const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

const importRegex = /import \{\s*DIAMOND_PACKS[^}]*\} from '\.\.\/utils\/diamondUtils';/;
const importReplacement = `import {
  DIAMOND_PACKS,
  PRESET_DIAMOND_SUB_TEMPLATES,
  CREDITS_PER_DIAMOND,
  exchangeDiamondsForCredits,
  claimDailyDiamonds,
  canClaimDailyDiamonds,
} from '../utils/diamondUtils';
import {
  DIAMOND_SUB_DURATIONS,
  type DiamondSubDurationId,
  calculateDiamondSubPrice,
} from '../utils/diamondSubOptions';`;

content = content.replace(importRegex, importReplacement);
fs.writeFileSync(file, content);
