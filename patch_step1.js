const fs = require('fs');
const file = 'artifacts/iic-study-app/src/components/MyRoutine.tsx';
let code = fs.readFileSync(file, 'utf8');

const newFunction = `  const handleCatChangeStart = (catId: string, subjectId: string, newIdx: number) => {
    setData(prev => {
      const cats = [...(prev.routineCategories || [])];
      const ci = cats.findIndex(c => c.id === catId);
      if (ci === -1) return prev;

      const cat = { ...cats[ci] };
      const subjects = [...cat.subjects];
      const si = subjects.findIndex(s => s.subjectId === subjectId);
      if (si === -1) return prev;

      const sub = subjects[si];
      const cost = getSkipCost(sub.currentLessonIndex, newIdx);
      const userCredits = (user.credits || 0) + (user.bonusCredits || 0);

      if (cost > userCredits) {
        showToast(\`Coins kam hain! Chahiye: \${cost}🪙\`, 'error');
        return prev;
      }

      if (cost > 0 && onUserUpdate) {
        const u = { ...user, credits: Math.max(0, (user.credits || 0) - cost) };
        onUserUpdate(u);
        try { saveUserToLive(u); } catch (_) {}
      }

      subjects[si] = { ...sub, currentLessonIndex: newIdx };
      cat.subjects = subjects;
      cats[ci] = cat;

      const next = { ...prev, routineCategories: cats };
      syncRoutineNow(userId, next);
      return next;
    });
  };

`;

code = code.replace(
  "  const handleChangeStart = (subId: string, newIdx: number) => {",
  newFunction + "  const handleChangeStart = (subId: string, newIdx: number) => {"
);

fs.writeFileSync(file, code);
