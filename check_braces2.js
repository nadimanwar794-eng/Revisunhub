const fs = require('fs');
const content = fs.readFileSync('artifacts/iic-study-app-replit/src/components/Store.tsx', 'utf8');

let braceCount = 0;
let parenCount = 0;
let lastParen = 0;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') braceCount++;
  if (content[i] === '}') {
    braceCount--;
    if (braceCount < 0) {
      console.log('Negative brace at', i, content.substring(i-30, i+30));
      // don't reset
    }
  }
  
  if (content[i] === '(') parenCount++;
  if (content[i] === ')') {
    parenCount--;
    if (parenCount < 0) {
      console.log('Negative paren at', i, content.substring(i-30, i+30));
      // don't reset
    }
  }
}

console.log('Final brace:', braceCount);
console.log('Final paren:', parenCount);
