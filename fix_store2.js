const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

// The free tab block
const freeTabCode = fs.readFileSync('free_tab.tsx', 'utf8');
const proAccordionCode = fs.readFileSync('pro_accordion.tsx', 'utf8');
const maxAccordionCode = fs.readFileSync('max_accordion.tsx', 'utf8');

const regexFree = /\{tierType === 'FREE' && \([\s\S]*?\}\)/;
content = content.replace(regexFree, freeTabCode);

// There is an extra closing parenthesis around line 335 now, wait, the `restore_store.js` did:
// {tierType === 'FREE' && ( ... )}
// But freeTabCode ALREADY has `{tierType === 'FREE' && ( ... )}` inside it!
// Ah! freeTabCode is EXACTLY:
// `{tierType === 'FREE' && ( ... )}`
// No wait, let's look at insert_free_tab.js line 5!
