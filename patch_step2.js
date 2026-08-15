const fs = require('fs');
const file = 'artifacts/iic-study-app/src/components/MyRoutine.tsx';
let code = fs.readFileSync(file, 'utf8');

const catSubjectCard = `
// ── Category Subject Card (Subjects tab) ──────────────────────────────────────
function CatSubjectCard({
  catId, sub, lessons, mcqHistory, coins, onChangeStart, onCoinFlash,
}: {
  catId: string; sub: RoutineCategorySubject; lessons: LucentEntry[]; mcqHistory: any[];
  coins: number; onChangeStart: (catId: string, subjectId: string, idx: number) => void;
  onCoinFlash: (msg: string) => void;
}) {
  const [targetStart, setTargetStart] = useState(sub.currentLessonIndex);

  // Sync if external updates happen
  useEffect(() => { setTargetStart(sub.currentLessonIndex); }, [sub.currentLessonIndex]);

  const meta = SUBJECT_META[sub.subjectId] || DEFAULT_META;
  const skipCost = getSkipCost(sub.currentLessonIndex, targetStart);

  return (
    <div className={\`rounded-2xl border overflow-hidden transition-all shadow-sm \${meta.border} bg-white\`}>
      {/* Header: subject name */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50">
        <div className={\`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 \${meta.bg} \${meta.color}\`}>
          {sub.emoji || meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-800 text-sm truncate">{sub.displayName || capitalise(sub.subjectId)}</p>
          <p className="text-[10px] text-slate-500 font-medium">{sub.bookName || (\`Class \${sub.classLevel}\`)}</p>
        </div>
      </div>

      {/* Lesson navigator */}
      <div className="border-t border-slate-100 px-4 pb-3.5 pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = Math.max(0, targetStart - 1);
              setTargetStart(next);
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center active:bg-slate-200 transition shrink-0"
          >
            <Minus size={14} className="text-slate-600" />
          </button>

          <div className="flex-1 text-center bg-slate-50 rounded-xl border border-slate-100 py-2 px-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-0.5">Lesson {targetStart + 1}</p>
            <p className="text-[13px] font-bold text-slate-800 leading-tight truncate">
              {lessons[targetStart]?.lessonTitle || \`Lesson \${targetStart + 1}\`}
            </p>
            {skipCost > 0 && <p className="text-[9px] text-amber-600 font-black mt-0.5">−{skipCost}🪙</p>}
            {skipCost === 0 && targetStart !== sub.currentLessonIndex && <p className="text-[9px] text-emerald-600 font-black mt-0.5">Free!</p>}
          </div>

          <button
            onClick={() => {
              const next = Math.min(lessons.length - 1, targetStart + 1);
              setTargetStart(next);
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center active:bg-slate-200 transition shrink-0"
          >
            <Plus size={14} className="text-slate-600" />
          </button>
        </div>

        {targetStart !== sub.currentLessonIndex && (
          <button
            onClick={() => {
              if (skipCost > coins) { onCoinFlash(\`Coins kam hain! Chahiye: \${skipCost}🪙\`); return; }
              onChangeStart(catId, sub.subjectId, targetStart);
              onCoinFlash(skipCost > 0 ? \`Start changed! −\${skipCost}🪙\` : 'Start point changed! Free 🎉');
            }}
            className="mt-2.5 w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-black active:scale-95 transition shadow-sm"
          >
            {skipCost > 0 ? \`✓ Apply (−\${skipCost}🪙 deduct hoga)\` : '✓ Apply (Free)'}
          </button>
        )}
      </div>
    </div>
  );
}
`;

code = code.replace(
  "// ── Subject Card (Subjects tab) — simplified ──────────────────────────────────",
  catSubjectCard + "\n// ── Subject Card (Subjects tab) — simplified ──────────────────────────────────"
);

fs.writeFileSync(file, code);
