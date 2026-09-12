const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Free tab comment
content = content.replace(/{tierType === 'FREE' && \(\s*\{\/\* ── FREE TAB ── \*\/\}\s*(<div className="space-y-4 animate-fade-in-up pb-10">)/, "{tierType === 'FREE' && ($1");

// Fix 2: Extra closing braces near line 335
// We inserted free tab, which ends with </div></div></div></div>.
// Let's check free_tab.tsx!
