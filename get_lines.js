const fs = require('fs');
const content = fs.readFileSync('artifacts/iic-study-app-replit/src/components/Store.tsx', 'utf8').split('\n');
const exchangeIdx = content.findIndex(l => l.includes('TOP LEVEL TAB: EXCHANGE'));
console.log(content.slice(exchangeIdx - 15, exchangeIdx + 5).join('\n'));
