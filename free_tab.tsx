
        {/* ── FREE TAB ── */}
        {tierType === 'FREE' && (
          <div className="space-y-4 animate-fade-in-up pb-10">
            {/* 1. Free Features List */}
            <div className="rounded-2xl p-4 sm:p-5 border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Check size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-400">Free Me Kya-Kya Mil Raha Hai</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Ye sabhi features aap Free plan me bina kisi charge ke use kar sakte hain:
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { icon: '❓', title: 'Standard Daily MCQs', badge: 'FREE', desc: 'Har din free quota ke MCQ tests practice karne ki suvidha' },
                  { icon: '📖', title: 'Standard Reading Mode', badge: 'FREE', desc: 'Syllabus chapters aur standard notes padhne ka access' },
                  { icon: '🪙', title: 'Daily Free Coin Claim', badge: 'FREE', desc: 'Rozana login karke muft bonus coins claim karein' },
                  { icon: '🔥', title: 'Login Streak & XP Tracker', badge: 'FREE', desc: 'Consistency banayein aur daily streak points earn karein' },
                  { icon: '📝', title: 'Homework & Syllabus Overview', badge: 'FREE', desc: 'Classes aur daily assignments overview dekhne ka access' },
                  { icon: '🏆', title: 'Public Leaderboard View', badge: 'FREE', desc: 'Overall rankings aur student standing dekhne ki suvidha' },
                  { icon: '🎧', title: 'Basic Voice Audio Reader', badge: 'FREE', desc: 'Normal speed par chapters audio sunne ka access' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-bold text-slate-200">{item.title}</span>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 tracking-wider">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Full Feature Comparison Table */}
            <div className="rounded-2xl p-4 sm:p-5 border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
              <div className="mb-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>📊</span> Full Feature Comparison (Free vs Pro vs Max)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Sabhi plans ki direct tulna ek nazar me dekhein:</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-2.5 font-bold text-slate-300">Feature</th>
                      <th className="py-2.5 font-black text-center text-slate-200">Free 🎯</th>
                      <th className="py-2.5 font-black text-center text-cyan-400">Pro ⭐</th>
                      <th className="py-2.5 font-black text-center text-purple-400">Max ⚡</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { f: 'Daily XP Limit', free: '1,500 pts', pro: <><span className="text-cyan-300 font-bold">2,500 pts</span><br/><span className="text-[9px] text-cyan-400/80">(+66%)</span></>, max: <><span className="text-purple-300 font-bold">3,500 pts</span><br/><span className="text-[9px] text-purple-400/80">(+133%)</span></> },
                      { f: 'XP Multiplier', free: '1.0X', pro: <span className="text-cyan-400 font-bold">1.5X Boost</span>, max: <span className="text-purple-400 font-bold">2.0X Super Boost</span> },
                      { f: 'Daily Credits Pass', free: '—', pro: <span className="text-amber-400 font-bold">50 CR / Day</span>, max: <span className="text-amber-400 font-bold">100 CR / Day</span> },
                      { f: 'Credit Cost Off', free: '0%', pro: <span className="text-emerald-400 font-bold">20% OFF</span>, max: <span className="text-emerald-400 font-bold">40% OFF</span> },
                      { f: 'MCQ / Day Practice', free: <span className="text-slate-400">Free<br/>Quota</span>, pro: <span className="text-cyan-300 font-bold">1,500 / Day</span>, max: <span className="text-purple-300 font-bold">3,000 / Day</span> },
                      { f: 'Projector & PDF Mode', free: <span className="text-red-400 font-bold">✕</span>, pro: <span className="text-emerald-400 font-bold">✓</span>, max: <span className="text-emerald-400 font-bold">✓</span> },
                      { f: 'Writing & Correction', free: <span className="text-red-400 font-bold">✕</span>, pro: <span className="text-emerald-400 font-bold">✓</span>, max: <span className="text-emerald-400 font-bold">✓</span> },
                      { f: 'Flashcard Memory Mode', free: <span className="text-red-400 font-bold">✕</span>, pro: '—', max: <span className="text-emerald-400 font-bold">✓ Unlocked</span> },
                      { f: 'Video Player Mode', free: <span className="text-red-400 font-bold">✕</span>, pro: '—', max: <span className="text-emerald-400 font-bold">✓ Full Video</span> },
                      { f: 'Global Student Chat', free: <span className="text-red-400 font-bold">✕</span>, pro: '—', max: <span className="text-emerald-400 font-bold">✓ Live Chat</span> },
                      { f: 'Themes & Styling', free: 'Default', pro: <span className="text-cyan-400 font-bold">Basic Themes</span>, max: <span className="text-purple-400 font-bold">All Ultra Themes</span> },
                      { f: 'Store Extra Discount', free: '0%', pro: <span className="text-emerald-400 font-bold">+5% OFF</span>, max: <span className="text-emerald-400 font-bold">+5% OFF</span> },
                      { f: 'Leaderboard VIP Badge', free: '—', pro: <span className="text-cyan-400 font-bold">PRO Badge</span>, max: <span className="text-amber-400 font-bold">👑 Golden Crown</span> },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 pr-2 font-semibold text-slate-300 w-1/3">{row.f}</td>
                        <td className="py-3 px-1 text-center text-slate-400">{row.free}</td>
                        <td className="py-3 px-1 text-center bg-cyan-950/20">{row.pro}</td>
                        <td className="py-3 px-1 text-center bg-purple-950/20">{row.max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. FAQs Accordions */}
            <div className="space-y-3">
              <details className="group rounded-2xl border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
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
              </details>

              <details className="group rounded-2xl border" style={{ background: pageTheme.cardSurface, borderColor: pageTheme.cardBorder }}>
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
              </details>
            </div>
          </div>
        )}
