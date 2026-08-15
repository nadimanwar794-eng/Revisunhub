const fs = require('fs');
const file = 'artifacts/iic-study-app/src/components/MyRoutine.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldSubjectsView = `        {/* SUBJECTS */}
        {activeView === 'subjects' && (
          <div className="mx-4 mt-4 space-y-3">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{subjects.length} Subjects</p>
            {subjects.length === 0 ? (
              <div className="bg-[#f5f2eb] rounded-3xl border border-[#e8e4db] p-6 text-center">
                <p className="text-sm text-slate-400">Daily Hub mein categories add karo pehle</p>
              </div>
            ) : subjects.map(sub => (
              <SubjectCard key={sub.id} sub={sub} lessons={subjectGroups[sub.id] || []} mcqHistory={mcqHistory}
                coins={userCredits} onToggleApply={() => handleToggleApply(sub.id)}
                onChangeStart={(idx) => handleChangeStart(sub.id, idx)}
                onCoinFlash={(msg) => showToast(msg, msg.includes('kam') ? 'error' : msg.includes('−') ? 'coin' : 'success')} />
            ))}
          </div>
        )}`;

const newSubjectsView = `        {/* SUBJECTS */}
        {activeView === 'subjects' && (
          <div className="mx-4 mt-4 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{categories.length} Categories</p>
            </div>

            {categories.length === 0 ? (
              <div className="bg-[#f5f2eb] rounded-3xl border border-[#e8e4db] p-6 text-center">
                <p className="text-sm text-slate-400">Daily Hub mein categories add karo pehle</p>
              </div>
            ) : categories.map(cat => (
              <div key={cat.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-3 shadow-sm space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xl">{cat.emoji}</span>
                  <h3 className="font-black text-slate-800 text-sm">{cat.categoryName}</h3>
                </div>
                <div className="space-y-3">
                  {cat.subjects.map(sub => (
                    <CatSubjectCard
                      key={\`\${cat.id}-\${sub.subjectId}\`}
                      catId={cat.id}
                      sub={sub}
                      lessons={getNotesForSubject(sub, routineNotes)}
                      mcqHistory={mcqHistory}
                      coins={userCredits}
                      onChangeStart={handleCatChangeStart}
                      onCoinFlash={(msg) => showToast(msg, msg.includes('kam') ? 'error' : msg.includes('−') ? 'coin' : 'success')}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}`;

if (code.includes(oldSubjectsView)) {
  code = code.replace(oldSubjectsView, newSubjectsView);
  fs.writeFileSync(file, code);
  console.log("Successfully replaced subjects view.");
} else {
  console.log("Could not find the old subjects view to replace.");
}
