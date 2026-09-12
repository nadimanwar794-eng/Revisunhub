const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update useState
content = content.replace(
  /useState<'FREE' \| 'SUBSCRIPTION' \| 'CREDITS' \| 'DIAMONDS' \| 'HISTORY'>/,
  "useState<'FREE' | 'SUBSCRIPTION' | 'CREDITS' | 'DIAMONDS' | 'EXCHANGE' | 'HISTORY'>"
);

// 2. Add EXCHANGE to allTabs
const oldTabs = `    { id: 'DIAMONDS'     as const, label: 'Diamonds',     emoji: '💎', color: C.diamond,bg: C.diamondBg,               border: C.diamondBorder,         glow: C.diamondGlow },`;
const newTabs = `    { id: 'DIAMONDS'     as const, label: 'Diamonds',     emoji: '💎', color: C.diamond,bg: C.diamondBg,               border: C.diamondBorder,         glow: C.diamondGlow },
    { id: 'EXCHANGE'     as const, label: 'Exchange',     emoji: '🔄', color: '#10b981',bg: 'rgba(16,185,129,0.12)',border: 'rgba(16,185,129,0.3)',glow: 'rgba(16,185,129,0.18)' },`;
content = content.replace(oldTabs, newTabs);

// 3. Update isDiamondsTab etc logic to handle EXCHANGE
const oldIsDiamonds = `    : isDiamondsTab
    ? { color: C.diamond, bg: C.diamondBg, border: C.diamondBorder, glow: C.diamondGlow, grad: 'linear-gradient(135deg,#0284c7,#38bdf8)', pill: 'rgba(56,189,248,0.14)', label: 'DIAMONDS', emoji: '💎' }`;
const newIsDiamonds = `    : isDiamondsTab
    ? { color: C.diamond, bg: C.diamondBg, border: C.diamondBorder, glow: C.diamondGlow, grad: 'linear-gradient(135deg,#0284c7,#38bdf8)', pill: 'rgba(56,189,248,0.14)', label: 'DIAMONDS', emoji: '💎' }
    : tierType === 'EXCHANGE'
    ? { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', glow: 'rgba(16,185,129,0.18)', grad: 'linear-gradient(135deg,#059669,#10b981)', pill: 'rgba(16,185,129,0.14)', label: 'EXCHANGE', emoji: '🔄' }`;
content = content.replace(oldIsDiamonds, newIsDiamonds);

// 4. Remove Exchange button from Diamond page
const exchangeBtnRegex = /<button[\s\S]*?onClick=\{\(\) => setDiamondSubTab\('EXCHANGE'\)\}[\s\S]*?<\/button>/;
content = content.replace(exchangeBtnRegex, '');

// 5. Find SUBTAB 3: EXCHANGE ... block, extract it, and remove it from diamonds tab
const exchangeBlockRegex = /\{\/\*\s*SUBTAB 3: EXCHANGE 1💎 = 10 CREDITS\s*\*\/\}\s*\{diamondSubTab === 'EXCHANGE' && \(([\s\S]*?)\)\}/;
let exchangeContent = '';
const match = content.match(exchangeBlockRegex);
if (match) {
  exchangeContent = match[1];
  content = content.replace(exchangeBlockRegex, '');
} else {
  console.log("Could not find SUBTAB 3 block!");
}

// 6. Append it to the main switch block
if (exchangeContent) {
  const newMainExchangeTab = `
        {/* TOP LEVEL TAB: EXCHANGE */}
        {tierType === 'EXCHANGE' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
                <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">🔄</span> 
                Currency Exchange
              </h2>
              <p className="text-xs text-slate-400">Convert your Diamonds into Credits</p>
            </div>
            ${exchangeContent}
          </div>
        )}
  `;
  
  // Find where the DIAMONDS tierType ends
  const diamondTabRegex = /\{tierType === 'DIAMONDS' && \([\s\S]*?\}\) \/\* END DIAMONDS \*\/\}/;
  // Let's insert before the closing </div> of the main scrollable area
  const mainScrollableEnd = '      </div>\n    </div>\n  );\n}';
  content = content.replace(mainScrollableEnd, newMainExchangeTab + '\n' + mainScrollableEnd);
  console.log("Added new EXCHANGE top level tab");
}

fs.writeFileSync(file, content, 'utf8');
console.log("Modifications done");
