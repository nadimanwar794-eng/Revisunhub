const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const startIndex = lines.findIndex(l => l.includes('<div className="flex-1 flex gap-1.5">'));

const correctTail = `                    <div className="flex-1 flex gap-1.5">
                      {[1, 5, 10, 25].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setExchangeDiamondsCount(cnt)}
                          className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-black text-slate-300 border border-white/5 active:scale-95"
                        >
                          {cnt}💎
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-xs font-medium text-slate-400">Aapko milenge:</span>
                    <span className="text-lg font-black text-amber-400">
                      +{(exchangeDiamondsCount * CREDITS_PER_DIAMOND).toLocaleString('en-IN')} 🪙 Credits
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if ((user.diamonds ?? 0) < exchangeDiamondsCount) {
                      setExchangeMsg(\`⚠️ Diamonds kam hain! Aapke paas sirf \${user.diamonds ?? 0} 💎 hain.\`);
                      return;
                    }
                    const res = exchangeDiamondsForCredits(user, exchangeDiamondsCount);
                    if (res) {
                      const ok = await saveUserToLive(res.updatedUser);
                      if (ok) {
                        onUserUpdate(res.updatedUser);
                        setExchangeMsg(\`✅ Badhai! \${exchangeDiamondsCount} 💎 exchange ho gaye aur +\${res.creditsEarned} 🪙 Credits mil gaye!\`);
                        setTimeout(() => setExchangeMsg(null), 5000);
                      }
                    }
                  }}
                  disabled={(user.diamonds ?? 0) < exchangeDiamondsCount}
                  className="w-full py-3.5 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Coins size={16} />
                  <span>Exchange Karein: {exchangeDiamondsCount} 💎 ➔ {exchangeDiamondsCount * CREDITS_PER_DIAMOND} 🪙</span>
                </button>
              </div>
            
          </div>
        )}

        {/* All Tiers Stacking Modal for Credit Pass reference */}
        {showAllTiersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 relative shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h3 className="text-base font-black text-white">Subscription & Pass XP Stacking</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllTiersModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg text-lg leading-none cursor-pointer">
                  ✕
                </button>
              </div>
              <div className="text-xs text-slate-300 space-y-2">
                <p>
                  Agar aapke paas already koi subscription (Basic ya Ultra) hai, to Credit Pass ka bonus multiplier usme jud jata hai:
                </p>
                <div className="space-y-1.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-black text-white">Free Plan User (1.0x Base)</span>
                      <p className="text-[10px] text-slate-400">Pass se jitna multiplier hai wahi milega (e.g. 1.1x / 1.5x)</p>
                    </div>
                    <span className="text-xs font-bold text-amber-300">1.0x + Boost</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-black text-white">Basic Plan User (1.5x Base)</span>
                      <p className="text-[10px] text-slate-400">1.5x Base + Pass Multiplier Boost jud kar milta hai</p>
                    </div>
                    <span className="text-xs font-bold text-amber-300">1.5x + Boost</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-black text-white">Ultra Plan User (2.0x Base)</span>
                      <p className="text-[10px] text-slate-400">2.0x Base + Pass Multiplier Boost jud kar milta hai</p>
                    </div>
                    <span className="text-xs font-bold text-amber-300">2.0x + Boost</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllTiersModal(false)}
                className="w-full py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 transition-colors cursor-pointer">
                Samajh Gaya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
`;

lines.splice(startIndex, lines.length - startIndex, correctTail);

fs.writeFileSync(file, lines.join('\n'), 'utf8');
