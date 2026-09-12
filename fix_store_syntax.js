const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

// The regex I used earlier to remove the block was: 
// /\{\/\*\s*SUBTAB 3: EXCHANGE 1💎 = 10 CREDITS\s*\*\/\}\s*\{diamondSubTab === 'EXCHANGE' && \(([\s\S]*?)\)\}/
// This matched until the first `)`.
// We need to find where the `isDiamondsTab` actually was. Wait, let me just replace the broken chunk at the end of the file.

const brokenTabRegex = /\{\/\* TOP LEVEL TAB: EXCHANGE \*\/\}[\s\S]*?\};\s*$/;
const endOfFile = `
      </div>
    </div>
  );
};
`;

content = content.replace(brokenTabRegex, endOfFile);

// Remove the broken remains of SUBTAB 3
// Let's find the `diamondSubTab === 'EXCHANGE'` remnants.
// Wait, when I did `content.replace(exchangeBlockRegex, '')`, I removed up to `)`.
// Let's just fix it manually. Let's see the context around line 2959.
fs.writeFileSync(file, content, 'utf8');
