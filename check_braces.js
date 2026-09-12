const fs = require('fs');
const content = fs.readFileSync('artifacts/iic-study-app-replit/src/components/Store.tsx', 'utf8');

let braceCount = 0;
let parenCount = 0;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') braceCount++;
  if (content[i] === '}') {
    braceCount--;
    if (braceCount < 0) {
      console.log('Extra closing brace at index', i, content.substring(i-50, i+50));
      braceCount = 0;
    }
  }
  
  if (content[i] === '(') parenCount++;
  if (content[i] === ')') {
    parenCount--;
    if (parenCount < 0) {
      console.log('Extra closing paren at index', i, content.substring(i-50, i+50));
      parenCount = 0;
    }
  }
}

console.log('Final brace balance:', braceCount);
console.log('Final paren balance:', parenCount);
