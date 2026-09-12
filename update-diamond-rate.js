const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/utils/diamondUtils.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `export const CREDITS_PER_DIAMOND = 20;`;
const replacement = `export const CREDITS_PER_DIAMOND = 10;`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
