const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIAMOND_SUBSCRIPTION_PLANS.map(plan => (
                    <div
                      key={plan.id}
                      className="rounded-2xl p-4 border relative overflow-hidden transition-all hover:scale-[1.01]"
                      style={{
                        background: 'linear-gradient(145deg, rgba(15,23,42,0.9), rgba(15,23,42,0.6))',
                        borderColor: plan.durationDays === 30 ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.08)',
                        boxShadow: plan.durationDays === 30 ? '0 0 20px rgba(56,189,248,0.2)' : 'none'
                      }}
                    >
                      {plan.badge && (
                        <div className="absolute top-0 right-0 px-3 py-0.5 text-[9px] font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-bl-xl uppercase tracking-wider">
                          {plan.badge} ({plan.totalDiamonds} 💎)
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">Daily Pass</span>
                          <h4 className="text-base font-black text-white">{plan.name}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-white">₹{plan.price}</span>
                          <span className="block text-[9.5px] text-slate-400 font-bold">{plan.durationDays} Din Validity</span>
                        </div>
                      </div>

                      {/* Diamond stats grid */}
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
                </div>`;

const replacement = `                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRESET_DIAMOND_SUB_TEMPLATES.map(plan => {
                    const selectedDurationId = diamondPlanDurations[plan.id] || '1_MONTH';
                    const selectedDurationOpt = DIAMOND_SUB_DURATIONS.find(d => d.id === selectedDurationId) || DIAMOND_SUB_DURATIONS[1];
                    const pricing = calculateDiamondSubPrice(plan.dailyDiamonds, selectedDurationOpt, plan.ratePerDiamond);

                    return (
                      <div
                        key={plan.id}
                        className="rounded-3xl p-5 border relative overflow-hidden transition-all shadow-lg"
                        style={{
                          background: 'linear-gradient(160deg, rgba(15,23,42,1) 0%, rgba(30,58,138,0.3) 100%)',
                          borderColor: 'rgba(56,189,248,0.4)',
                        }}
                      >
                        {plan.badge && (
                          <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-black text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 rounded-bl-2xl uppercase tracking-wider">
                            {plan.badge}
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 mb-0.5 block">Diamond Pass</span>
                            <h4 className="text-lg font-black text-white">{plan.name}</h4>
                            <p className="text-[11px] text-slate-300 font-bold mt-1 max-w-[200px]">{plan.description}</p>
                          </div>
                        </div>

                        {/* Durations Selector */}
                        <div className="mb-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Duration</p>
                          <div className="grid grid-cols-5 gap-1">
                            {DIAMOND_SUB_DURATIONS.map(dur => {
                              const isSelected = selectedDurationId === dur.id;
                              return (
                                <button
                                  key={dur.id}
                                  onClick={() => setDiamondPlanDurations(prev => ({ ...prev, [plan.id]: dur.id }))}
                                  className={\`relative rounded-lg border-2 p-1.5 flex flex-col items-center justify-center transition-all \${
                                    isSelected
                                      ? 'border-sky-400 bg-sky-400/10 scale-[1.02] shadow-md shadow-sky-400/20'
                                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                                  }\`}
                                >
                                  {dur.badge && (
                                    <div className={\`absolute -top-1.5 -right-1 px-1 py-0.5 rounded text-[8px] font-black uppercase \${
                                      dur.highlight ? 'bg-amber-400 text-amber-950' : 'bg-emerald-400 text-emerald-950'
                                    }\`}>
                                      {dur.badge}
                                    </div>
                                  )}
                                  <span className={\`text-[11px] font-black \${isSelected ? 'text-sky-300' : 'text-slate-300'}\`}>
                                    {dur.label.split(' ')[0]}
                                  </span>
                                  <span className={\`text-[9px] font-bold \${isSelected ? 'text-sky-200' : 'text-slate-500'}\`}>
                                    {dur.label.split(' ')[1]}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-end justify-between bg-black/40 p-3 rounded-xl border border-white/5 mb-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Total Diamonds</span>
                            <span className="text-xl font-black text-sky-400">💎 {pricing.totalDiamonds}</span>
                          </div>
                          <div className="text-right">
                            {pricing.totalDiscountPercent > 0 && (
                              <div className="flex items-center justify-end gap-1.5 mb-0.5">
                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/20 px-1 rounded">-{pricing.totalDiscountPercent}%</span>
                                <span className="text-[11px] text-slate-500 font-bold line-through">₹{pricing.basePrice}</span>
                              </div>
                            )}
                            <div className="flex items-end gap-1">
                              <span className="text-2xl font-black text-white leading-none">₹{pricing.finalPrice}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => initiatePurchase({ 
                            ...plan, 
                            id: \`\${plan.id}_\${selectedDurationOpt.id}\`,
                            price: pricing.finalPrice, 
                            totalDiamonds: pricing.totalDiamonds,
                            durationDays: selectedDurationOpt.durationDays,
                            isDiamondSub: true 
                          })}
                          className="w-full py-3 rounded-xl font-black text-[13px] text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <span>💎 Subscribe Karein — ₹{pricing.finalPrice.toLocaleString('en-IN')}</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
