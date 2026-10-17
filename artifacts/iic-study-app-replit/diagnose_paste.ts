import { parseMCQText } from './src/utils/mcqParser';
import * as fs from 'fs';

const raw = fs.readFileSync('./raw_user_paste.txt', 'utf8');
const res = parseMCQText(raw);

console.log('Total questions parsed:', res.questions.length);

res.questions.forEach((q, idx) => {
  const optCount = q.options.filter(o => o && o.trim()).length;
  if (optCount < 4 || q.options.length < 4) {
    console.log(`Q${idx + 1} has only ${optCount} options:`, q.options, 'question:', q.question.substring(0, 50));
  }
});
