const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

const proOld = `<details className="group rounded-2xl border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <Star size={16} className="text-cyan-400 fill-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[12px] font-bold text-white">Basic Plan Kya Hai?</h4>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">PRO SUPERPOWERS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Tap karein: Pro (Basic) plan se add hone wale superpowers...</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className="text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-4 pt-0 text-[11px] text-slate-300 border-t border-white/5 mt-2">
                  <p>Pro plan lene se aapke paas daily MCQ limits badh jayengi, credits pass activate ho jayega jisse store discounts milenge, aur PDF/Projector mode jaise premium study tools unlock ho jayenge.</p>
                </div>
              </details>`;

const proNew = `<details className="group rounded-2xl border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <Star size={16} className="text-cyan-400 fill-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[12px] font-bold text-white">Basic Plan Kya Hai?</h4>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">PRO SUPERPOWERS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 group-open:hidden">Tap karein: Pro (Basic) plan se add hone wale superpowers...</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 hidden group-open:block">Tap karke band karein</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className="text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-3 sm:p-4 text-[11px] text-slate-300 border-t border-white/5 mt-2 bg-slate-900/30">
                  <div className="rounded-xl p-4 mb-3 border border-cyan-500/20 bg-cyan-950/30 shadow-lg">
                    <h4 className="text-sm font-black text-cyan-400 mb-1 flex items-center gap-2"><span>⭐</span> PRO UNLOCKED SUPERPOWERS</h4>
                    <p className="text-xs text-slate-300 mb-4">Pro (Basic) Plan Se Add Hone Wale Superpowers</p>
                    <button onClick={() => { setTierType('SUBSCRIPTION'); setSubTierView('PRO'); }} className="px-4 py-2.5 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] w-fit">
                      <Zap size={14} className="fill-slate-950" /> Pro Plan Dekhein
                    </button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: '👥', title: 'Group Study & Live Classroom', badge: 'LIVE STUDY', desc: 'Friends ke sath real-time live study room join karein aur Live MCQ Battles me compete karein!' },
                      { icon: '🚀', title: '+66% Extra Daily XP Limit', badge: '+66% XP', desc: 'Daily score limit 1,500 se badhkar 2,500 points ho jati hai — Rank fast badhao!' },
                      { icon: '⚡', title: '1.5X Score Multiplier', badge: '1.5X BOOST', desc: 'Har test, lesson aur activity par seedha 50% bonus XP point boost!' },
                      { icon: '🪙', title: 'Daily 50 Credits Pass', badge: '50 CR/DAY', desc: 'Har din 50 credits auto-claim karein (Mahine ke 1,500 Credits bilkul muft)!' },
                      { icon: '🏷️', title: '20% Off Everywhere (Credits)', badge: '20% OFF', desc: 'App me kisi bhi test/mode ke credit cost par flat 20% permanent discount' },
                      { icon: '🎥', title: 'Projector Mode & PDF Mode', badge: 'UNLOCKED', desc: 'Badi screen projector display aur full PDF reading interface unlock' },
                      { icon: '✍️', title: 'Writing & Correction Mode', badge: 'UNLOCKED', desc: 'Digital writing notebook aur community question mistake correction power' },
                      { icon: '🎨', title: 'Text Color & Style Customization', badge: 'CUSTOM', desc: 'Apni pasand ke fonts, background text color aur custom contrast lagayein' },
                      { icon: '🎭', title: 'All Basic Themes Free', badge: 'THEMES FREE', desc: 'Sabhi stylish basic themes bina kisi extra charge ke unlock' },
                      { icon: '📥', title: 'Offline Download Available', badge: 'DOWNLOAD', desc: 'Important revision lessons aur study material offline save karein' },
                      { icon: '📊', title: 'Detailed Score History', badge: 'ANALYTICS', desc: 'Har test ka score graph aur deep performance analytics dekhein' },
                      { icon: '💬', title: 'Community MCQ Submission', badge: 'CREATOR', desc: 'Apne banaye huye sawal community me contribute karein' },
                      { icon: '💎', title: '+5% Permanent Store Discount', badge: '5% OFF', desc: 'Har subscription renewal aur store purchase par extra 5% discount' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3.5 hover:bg-white/10 transition-colors">
                        <span className="text-xl shrink-0 drop-shadow-md">{item.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[12px] font-bold text-slate-200 truncate">{item.title}</span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-950/50 text-cyan-400 border border-cyan-500/30 shrink-0 tracking-wider uppercase shadow-sm">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </details>`;

const ultraOld = `<details className="group rounded-2xl border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Crown size={16} className="text-purple-400 fill-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[12px] font-bold text-white">Ultra Plan Kya Hai?</h4>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">ELITE VIP SUPERPOWERS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Tap karein: Ultra (Max) plan se add hone wale superpowers...</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className="text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-4 pt-0 text-[11px] text-slate-300 border-t border-white/5 mt-2">
                  <p>Ultra plan sabse highest tier hai! Isme Pro ke sabhi features ke saath-saath Video Player mode, Flashcard memory mode, Global Student Chat, aur highest XP & Credits boost milta hai. Ye un students ke liye hai jo maximum limits chahte hain.</p>
                </div>
              </details>`;

const ultraNew = `<details className="group rounded-2xl border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
                <summary className="p-4 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Crown size={16} className="text-purple-400 fill-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[12px] font-bold text-white">Ultra Plan Kya Hai?</h4>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">ELITE VIP SUPERPOWERS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 group-open:hidden">Tap karein: Ultra (Max) plan se add hone wale superpowers...</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 hidden group-open:block">Tap karke band karein</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className="text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-3 sm:p-4 text-[11px] text-slate-300 border-t border-white/5 mt-2 bg-slate-900/30">
                  <div className="rounded-xl p-4 mb-3 border border-purple-500/20 bg-purple-950/30 shadow-lg">
                    <h4 className="text-sm font-black text-purple-400 mb-1 flex items-center gap-2"><span>👑</span> ELITE VIP SUPERPOWERS</h4>
                    <p className="text-xs text-slate-300 mb-4">Ultra (Max) Plan Se Add Hone Wale Superpowers</p>
                    <button onClick={() => { setTierType('SUBSCRIPTION'); setSubTierView('MAX'); }} className="px-4 py-2.5 rounded-full bg-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 hover:bg-purple-400 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)] w-fit">
                      <Zap size={14} className="fill-white" /> Ultra Plan Dekhein
                    </button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: '🎓', title: 'Host Live Classroom & MCQ Battles', badge: 'HOST & TEACH', desc: 'Apna khud ka live room create karein, whiteboard par padhayein aur custom Live MCQ Battles host karein!' },
                      { icon: '👑', title: '+133% Massive Daily XP Limit', badge: '+133% MAX', desc: '1,400+ daily score capacity — Leaderboard me #1 rank hasil karne ki power!' },
                      { icon: '🔥', title: '2.0X Ultra Score Multiplier', badge: '2X SPEED', desc: 'Seedha 100% (2X Double) bonus points har activity par (Sabse tez rank boost)!' },
                      { icon: '🪙', title: 'Daily 100 Credits Pass', badge: '100 CR/DAY', desc: 'Har din 100 credits muft claim karein (Mahine ke 3,000 Credits)!' },
                      { icon: '🏷️', title: '40% Off Everywhere (Credits)', badge: '40% OFF', desc: 'Poore app me kisi bhi credit transaction par maximum 40% discount!' },
                      { icon: '🎯', title: '3,000 MCQ / Day Practice Limit', badge: '3,000 MCQ', desc: 'Huge 3,000 MCQ quota per day — Practice aur self-study ki koi seema nahi!' },
                      { icon: '🗂️', title: 'Flashcard Memory Revision Mode', badge: 'UNLOCKED', desc: 'Super-fast memory cards revision mode se formula aur facts instant yaad karein' },
                      { icon: '🎬', title: 'Full Video Mode Unlocked', badge: 'UNLOCKED', desc: 'High-quality concept video lectures aur video player full access' },
                      { icon: '🌐', title: 'Global Student Community Chat', badge: 'COMMUNITY', desc: 'Sabhi serious students ke sath group discussion aur direct doubt sharing' },
                      { icon: '💡', title: 'Priority Content Suggestions', badge: 'VIP RIGHT', desc: 'Aapki request par admin naye chapters aur study material add karega' },
                      { icon: '✨', title: 'All Ultra Premium Themes Free', badge: 'ALL THEMES', desc: 'VIP glowing themes, neon dark styles aur dynamic UI layouts permanently free' },
                      { icon: '💎', title: '+10% Store Discount (Pro & Max)', badge: '10% OFF', desc: 'Pro aur Max subscription purchase aur renewal par 10% permanent discount' },
                      { icon: '👑', title: 'Golden VIP Crown & Glowing Name', badge: 'VIP STATUS', desc: 'Leaderboard aur profile par VIP golden badge aur glowing royal effect' },
                      { icon: '🛡️', title: 'Zero Interruptions & VIP Priority Help', badge: 'VIP SUPPORT', desc: 'Completely distraction-free study aur fastest response priority support' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3.5 hover:bg-white/10 transition-colors">
                        <span className="text-xl shrink-0 drop-shadow-md">{item.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[12px] font-bold text-slate-200 truncate">{item.title}</span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-950/50 text-purple-400 border border-purple-500/30 shrink-0 tracking-wider uppercase shadow-sm">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </details>`;

let hasChanges = false;
if (content.includes(proOld)) {
  content = content.replace(proOld, proNew);
  hasChanges = true;
  console.log("Successfully replaced PRO accordion content");
} else {
  console.log("Failed to match PRO accordion block");
}

if (content.includes(ultraOld)) {
  content = content.replace(ultraOld, ultraNew);
  hasChanges = true;
  console.log("Successfully replaced ULTRA accordion content");
} else {
  console.log("Failed to match ULTRA accordion block");
}

if (hasChanges) {
  fs.writeFileSync(file, content, 'utf8');
}
