const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

const t1 = `    { title: 'Daily 100 Credits Pass', desc: 'Har din 100 credits muft claim karein (Mahine ke 3,000 Credits)!', badge: '100 CR/DAY', icon: '🪙', highlight: true },`;
const r1 = `    { title: 'Daily 5 Diamonds Pass', desc: 'Har din 5 diamonds muft claim karein (Mahine ke 150 Diamonds)!', badge: '5 💎/DAY', icon: '💎', highlight: true },`;

const t2 = `    'Daily Claim: 100 Credits / Day',`;
const r2 = `    'Daily Claim: 5 Diamonds / Day',`;

const t3 = `                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                                🪙 +{isProTier ? 50 : 100}/din
                              </span>`;
const r3 = `                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                                {isProTier ? '🪙 +50/din' : '💎 +5/din'}
                              </span>`;

content = content.replace(t1, r1).replace(t2, r2).replace(t3, r3);
fs.writeFileSync(file, content);
