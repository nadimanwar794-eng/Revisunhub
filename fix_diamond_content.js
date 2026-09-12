const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* SUBTAB 2: DIAMOND SUBSCRIPTIONS \*\/\}([\s\S]*?)\{\/\* SUBTAB 3: EXCHANGE 1💎 = 10 CREDITS \*\/\}/;
const match = content.match(regex);

if (match) {
  const newContent = `
            {/* SUBTAB 2: WEEKLY DIAMOND SUBSCRIPTIONS */}
            {diamondSubTab === 'WEEKLY' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>⭐</span> Weekly Diamond Passes
                  </h3>
                  <span className="text-[10px] text-sky-400 font-bold">7-Day Validity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIAMOND_SUBSCRIPTION_PLANS.filter(p => p.planType === 'WEEKLY').map(plan => (
                    <div
                      key={plan.id}
                      className="rounded-2xl p-4 border relative overflow-hidden transition-all hover:scale-[1.01]"
                      style={{
                        background: 'linear-gradient(145deg, rgba(15,23,42,0.9), rgba(15,23,42,0.6))',
                        borderColor: 'rgba(255,255,255,0.08)',
                        boxShadow: 'none'
                      }}
                    >
                      {plan.badge && (
                        <div className="absolute top-0 right-0 px-3 py-0.5 text-[9px] font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-bl-xl uppercase tracking-wider">
                          {plan.badge} ({plan.totalDiamonds} 💎)
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">Weekly Pass</span>
                          <h4 className="text-base font-black text-white">{plan.name}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-white">₹{plan.price}</span>
                          <span className="block text-[9.5px] text-slate-400 font-bold">{plan.durationDays} Din Validity</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 mb-4 text-center">
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block">Daily Drop</span>
                          <span className="text-base font-black text-sky-400 flex items-center justify-center gap-0.5">
                            💎 {plan.dailyDiamonds}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block">Total Diamonds</span>
                          <span className="text-base font-black text-emerald-400 flex items-center justify-center gap-0.5">
                            💎 {plan.totalDiamonds}
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-1.5 mb-4 text-xs text-slate-300">
                        <li className="flex items-center gap-2">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>Har din <strong>{plan.dailyDiamonds} Diamonds</strong> claim karne ka mauka</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>Total <strong>{plan.totalDiamonds} Diamonds</strong> pura pack me milega</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>Permanent chapter unlocks ke liye best deal</span>
                        </li>
                      </ul>
                      <button
                        type="button"
                        onClick={() => initiatePurchase({ ...plan, isDiamondSub: true })}
                        className="w-full py-3 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <span>💎 Subscribe Karein — ₹{plan.price}</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBTAB: MONTHLY DIAMOND SUBSCRIPTIONS */}
            {diamondSubTab === 'MONTHLY' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>🌟</span> Monthly Diamond Passes
                  </h3>
                  <span className="text-[10px] text-sky-400 font-bold">30-Day Validity (Best Value)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIAMOND_SUBSCRIPTION_PLANS.filter(p => p.planType === 'MONTHLY').map(plan => (
                    <div
                      key={plan.id}
                      className="rounded-2xl p-4 border relative overflow-hidden transition-all hover:scale-[1.01]"
                      style={{
                        background: 'linear-gradient(145deg, rgba(15,23,42,0.9), rgba(15,23,42,0.6))',
                        borderColor: 'rgba(56,189,248,0.5)',
                        boxShadow: '0 0 20px rgba(56,189,248,0.2)'
                      }}
                    >
                      {plan.badge && (
                        <div className="absolute top-0 right-0 px-3 py-0.5 text-[9px] font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-bl-xl uppercase tracking-wider">
                          {plan.badge} ({plan.totalDiamonds} 💎)
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">Monthly Pass</span>
                          <h4 className="text-base font-black text-white">{plan.name}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-white">₹{plan.price}</span>
                          <span className="block text-[9.5px] text-slate-400 font-bold">{plan.durationDays} Din Validity</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 mb-4 text-center">
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block">Daily Drop</span>
                          <span className="text-base font-black text-sky-400 flex items-center justify-center gap-0.5">
                            💎 {plan.dailyDiamonds}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block">Total Diamonds</span>
                          <span className="text-base font-black text-emerald-400 flex items-center justify-center gap-0.5">
                            💎 {plan.totalDiamonds}
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-1.5 mb-4 text-xs text-slate-300">
                        <li className="flex items-center gap-2">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>Har din <strong>{plan.dailyDiamonds} Diamonds</strong> claim karne ka mauka</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>Total <strong>{plan.totalDiamonds} Diamonds</strong> pura pack me milega</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={13} className="text-emerald-400 shrink-0" />
                          <span>Permanent chapter unlocks ke liye best deal</span>
                        </li>
                      </ul>
                      <button
                        type="button"
                        onClick={() => initiatePurchase({ ...plan, isDiamondSub: true })}
                        className="w-full py-3 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <span>💎 Subscribe Karein — ₹{plan.price}</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBTAB 3: EXCHANGE 1💎 = 10 CREDITS */}`;
  
  content = content.replace(match[0], newContent);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Successfully replaced diamond subscription tabs!");
} else {
  console.log("Could not find the target section to replace.");
}
