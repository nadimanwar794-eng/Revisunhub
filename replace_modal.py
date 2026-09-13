import re

with open('artifacts/iic-study-app-replit/src/components/Store.tsx', 'r') as f:
    content = f.read()

modal_start = content.find('{showFreeAdModal && (')
if modal_start == -1:
    print("Could not find {showFreeAdModal && (")
    exit(1)

# Find the matching closing brace/parenthesis for the modal
open_braces = 0
open_parens = 0
modal_end = -1
for i in range(modal_start, len(content)):
    if content[i] == '{': open_braces += 1
    elif content[i] == '}': open_braces -= 1
    elif content[i] == '(': open_parens += 1
    elif content[i] == ')': open_parens -= 1
    
    if open_braces == 0 and open_parens == 0 and i > modal_start + 20:
        modal_end = i + 1
        break

if modal_end == -1:
    print("Could not find end of modal")
    exit(1)

replacement = """{showFreeAdModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-4xl max-h-[95dvh] flex flex-col rounded-3xl overflow-hidden shadow-2xl relative bg-slate-900 border border-white/15">
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
              <h3 className="font-black text-sm text-white">Full Feature List</h3>
              <button onClick={handleDismissFreeAd} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1 scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="bg-slate-950/50 sticky top-0 z-10">
                  <tr>
                    <th className="p-2 sm:p-3 border-b border-white/10 font-bold text-slate-300">Feature</th>
                    <th className="p-2 sm:p-3 border-b border-white/10 font-bold text-slate-400 text-center">Free</th>
                    <th className="p-2 sm:p-3 border-b border-emerald-500/30 font-bold text-emerald-400 text-center bg-emerald-950/20">Basic</th>
                    <th className="p-2 sm:p-3 border-b border-purple-500/30 font-bold text-purple-400 text-center bg-purple-950/20">Ultra</th>
                  </tr>
                </thead>
                <tbody>
                  {['Main', 'Revision Slate', 'Nsta Messenger'].map(cat => (
                    <React.Fragment key={cat}>
                      <tr>
                        <td colSpan={4} className="bg-slate-800/80 p-2 sm:p-3 font-black text-slate-300 uppercase tracking-wider text-[10px] sm:text-xs">
                          {cat}
                        </td>
                      </tr>
                      {(settings.tierFeatures || []).filter(f => f.category === cat).map((f, i) => (
                        <tr key={f.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-2 sm:p-3 font-medium text-slate-200">
                            <div className="flex gap-2">
                              {f.sn !== '-' && <span className="text-slate-500 w-4 sm:w-5">{f.sn}.</span>}
                              <span className={f.isSubItem ? 'ml-2 sm:ml-4 text-slate-400' : ''}>{f.name}</span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 text-slate-400 text-center">{f.free}</td>
                          <td className="p-2 sm:p-3 text-emerald-300 font-medium text-center bg-emerald-950/10">{f.basic}</td>
                          <td className="p-2 sm:p-3 text-purple-300 font-medium text-center bg-purple-950/10">{f.ultra}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}"""

new_content = content[:modal_start] + replacement + content[modal_end:]

with open('artifacts/iic-study-app-replit/src/components/Store.tsx', 'w') as f:
    f.write(new_content)
print("Modal replaced successfully")
