const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldSubTab = `<button
                type="button"
                onClick={() => setDiamondSubTab('SUBSCRIPTION')}
                className={\`py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 \${
                  diamondSubTab === 'SUBSCRIPTION'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }\`}
              >
                <span>⭐</span>
                <span>Subscriptions</span>
              </button>`;

const newSubTabs = `<button
                type="button"
                onClick={() => setDiamondSubTab('WEEKLY')}
                className={\`py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 \${
                  diamondSubTab === 'WEEKLY'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }\`}
              >
                <span>⭐</span>
                <span>Weekly</span>
              </button>
              <button
                type="button"
                onClick={() => setDiamondSubTab('MONTHLY')}
                className={\`py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 \${
                  diamondSubTab === 'MONTHLY'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }\`}
              >
                <span>🌟</span>
                <span>Monthly</span>
              </button>`;

if (content.includes(oldSubTab)) {
  content = content.replace(oldSubTab, newSubTabs);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Successfully replaced diamond sub tab buttons!");
} else {
  console.log("Could not match old diamond sub tab buttons!");
}
