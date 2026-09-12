const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `            {/* ════════ VIP TIERS CARDS ════════ */}`;
const replacement = `            {/* ════════ FREE TIER CARD ════════ */}
            {!user.isPremium && (
              <div className="rounded-3xl p-5 sm:p-6 border relative overflow-hidden transition-all shadow-lg"
                style={{
                  background: 'linear-gradient(145deg, rgba(15,23,42,0.9), rgba(15,23,42,0.6))',
                  borderColor: 'rgba(148,163,184,0.18)',
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-white flex items-center gap-2">
                      <span className="text-slate-400">🎯</span> Free Plan
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">Base Tier</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 font-medium max-w-sm">
                      Standard free access — sabhi basic features bina kisi payment ke hamesha muft available hain.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-3xl font-black text-white block leading-none">₹0</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">FREE FOREVER</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5 mt-4">
                  <div className="rounded-2xl p-3 bg-black/40 border border-white/5 text-center flex flex-col items-center justify-center">
                    <span className="text-lg mb-1">📅</span>
                    <span className="text-sm font-black text-white">1,500 XP/Day</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mt-0.5">DAILY XP LIMIT</span>
                  </div>
                  <div className="rounded-2xl p-3 bg-black/40 border border-white/5 text-center flex flex-col items-center justify-center">
                    <span className="text-lg mb-1">⚡</span>
                    <span className="text-sm font-black text-white">1.0X Speed</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mt-0.5">STANDARD SCORE</span>
                  </div>
                  <div className="rounded-2xl p-3 bg-black/40 border border-white/5 text-center flex flex-col items-center justify-center">
                    <span className="text-lg mb-1 text-rose-400">❓</span>
                    <span className="text-sm font-black text-white">Free Quota</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mt-0.5">DAILY MCQS</span>
                  </div>
                  <div className="rounded-2xl p-3 bg-black/40 border border-white/5 text-center flex flex-col items-center justify-center">
                    <span className="text-lg mb-1">🏷️</span>
                    <span className="text-sm font-black text-white">0% OFF</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mt-0.5">STORE DISCOUNT</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  <p className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                    <Check size={14} /> Free Me Kya-Kya Mil Raha Hai
                  </p>
                  {[
                    { t: 'Standard Daily MCQs', d: 'Har din free quota ke MCQ tests practice karne ki suvidha', i: '❓' },
                    { t: 'Standard Reading Mode', d: 'Syllabus chapters aur standard notes padhne ka access', i: '📖' },
                    { t: 'Daily Free Coin Claim', d: 'Rozana login karke muft bonus coins claim karein', i: '🪙' },
                    { t: 'Login Streak & XP Tracker', d: 'Consistency banayein aur daily streak points earn karein', i: '🔥' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5">
                      <span className="text-base leading-none mt-0.5 shrink-0 opacity-80">{f.i}</span>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">{f.t} <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded uppercase ml-1">FREE</span></span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{f.d}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════ VIP TIERS CARDS ════════ */}`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
