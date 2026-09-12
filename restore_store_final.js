const fs = require('fs');

const importsAndC = fs.readFileSync('imports_and_c.txt', 'utf8');
const freeTabCode = fs.readFileSync('free_tab.tsx', 'utf8');
const proAccordionCode = fs.readFileSync('pro_accordion.tsx', 'utf8');
const maxAccordionCode = fs.readFileSync('max_accordion.tsx', 'utf8');

const storeCode = `
/* ─── Subscription History ─── */
const SubHistory: React.FC<{ user: User; onBack: () => void }> = ({ user, onBack }) => {
  const history = user.subscriptionHistory || [];
  const sorted = [...history].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  return (
    <div className="animate-in fade-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black text-white">Purchase History</h2>
      </div>
      <div className="space-y-4">
        {sorted.length === 0 ? (
          <p className="text-center text-slate-400 mt-10 text-xs font-medium">No history found.</p>
        ) : (
          sorted.map(tx => (
            <div key={tx.id} className="p-4 rounded-xl border border-white/10 bg-slate-900/50">
              <div className="flex justify-between items-start mb-2">
                <span className="font-black text-white text-sm">{tx.planId}</span>
                <span className="text-xs font-bold text-amber-400">₹{tx.price}</span>
              </div>
              <p className="text-xs text-slate-400">{new Date(tx.startDate).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const Store: React.FC<Props> = ({ user, settings, onUserUpdate, onBack, initialTier = 'FREE' }) => {
  const [tierType, setTierType] = useState(initialTier);
  const [subTierView, setSubTierView] = useState<'PRO' | 'MAX'>('PRO');
  const [diamondSubTab, setDiamondSubTab] = useState<'PACKS' | 'WEEKLY' | 'MONTHLY'>('PACKS');
  const [exchangeMsg, setExchangeMsg] = useState<string | null>(null);
  const [exchangeDiamondsCount, setExchangeDiamondsCount] = useState(1);
  const [showAllTiersModal, setShowAllTiersModal] = useState(false);

  const isFreeTab = tierType === 'FREE';
  const isSubTab = tierType === 'SUBSCRIPTION';
  const isCreditsTab = tierType === 'CREDITS';
  const isDiamondsTab = tierType === 'DIAMONDS';
  const isExchangeTab = tierType === 'EXCHANGE';
  const isHistoryTab = tierType === 'HISTORY';

  const pageTheme = isFreeTab 
    ? { cardSurface: 'rgba(148,163,184,0.05)', cardBorder: 'rgba(148,163,184,0.15)' }
    : { cardSurface: 'rgba(56,189,248,0.05)', cardBorder: 'rgba(56,189,248,0.15)' }; 

  const allTabs = [
    { id: 'FREE'         as const, label: 'Free',         emoji: '🎯', color: '#94a3b8',bg: 'rgba(148,163,184,0.12)',border: 'rgba(148,163,184,0.3)',glow: 'rgba(148,163,184,0.18)' },
    { id: 'SUBSCRIPTION' as const, label: 'VIP Plans',    emoji: '👑', color: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.35)', glow: 'rgba(192,132,252,0.25)' },
    { id: 'CREDITS'      as const, label: 'Credits',      emoji: '🪙', color: C.credit, bg: C.creditBg,                border: C.creditBorder,          glow: C.creditGlow },
    { id: 'DIAMONDS'     as const, label: 'Diamonds',     emoji: '💎', color: C.diamond,bg: C.diamondBg,               border: C.diamondBorder,         glow: C.diamondGlow },
    { id: 'EXCHANGE'     as const, label: 'Exchange',     emoji: '🔄', color: '#10b981',bg: 'rgba(16,185,129,0.12)',border: 'rgba(16,185,129,0.3)',glow: 'rgba(16,185,129,0.18)' },
  ];

  const initiatePurchase = (pack: any) => {
    alert("Proceeding to checkout for " + (pack.name || 'Pack'));
  };

  return (
    <div className="min-h-screen pb-28 animate-in fade-in slide-in-from-right duration-300" style={{ background: C.bg }}>
      <div className="px-4 pt-6 pb-5" style={{ background: C.surface, borderBottom: \`1px solid \${C.border}\` }}>
        <div className="flex items-center gap-3">
          {onBack && (
             <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white">
               <ArrowLeft size={20}/>
             </button>
          )}
          <h2 className="text-xl font-black text-white">Store & Subscriptions</h2>
        </div>
        
        {/* Horizontal Scrollable Tabs */}
        <div className="mt-6 flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {allTabs.map(tab => (
            <button key={tab.id} onClick={() => setTierType(tab.id as any)} className={\`px-4 py-2 rounded-full font-black text-xs flex items-center gap-1.5 transition-all whitespace-nowrap \${tierType === tab.id ? 'opacity-100 shadow-md' : 'opacity-60 hover:opacity-100'}\`} style={{ background: tierType === tab.id ? tab.bg : 'transparent', border: \`1px solid \${tierType === tab.id ? tab.border : 'rgba(255,255,255,0.1)'}\`, color: tierType === tab.id ? tab.color : '#94a3b8' }}>
              <span>{tab.emoji}</span> {tab.label}
            </button>
          ))}
          <button onClick={() => setTierType('HISTORY')} className={\`px-4 py-2 rounded-full font-black text-xs flex items-center gap-1.5 transition-all whitespace-nowrap \${tierType === 'HISTORY' ? 'opacity-100 shadow-md bg-white/10 border-white/20 text-white' : 'opacity-60 hover:opacity-100 bg-transparent border-white/10 text-slate-400'}\`} style={{ border: '1px solid' }}>
            <History size={14}/> History
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        {tierType === 'HISTORY' && <SubHistory user={user} onBack={() => setTierType('FREE')} />}
        
`;

const storeCodeEnd = `
        {tierType === 'SUBSCRIPTION' && (
          <div className="space-y-4">
            <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/10 mb-4">
               <button onClick={() => setSubTierView('PRO')} className={\`flex-1 py-2 rounded-xl font-black text-xs transition-all \${subTierView === 'PRO' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}\`}>⭐ PRO Plan</button>
               <button onClick={() => setSubTierView('MAX')} className={\`flex-1 py-2 rounded-xl font-black text-xs transition-all \${subTierView === 'MAX' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}\`}>👑 MAX Plan</button>
            </div>
            
            {subTierView === 'PRO' && (
               <div className="space-y-4">
                 <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-center">
                    <h3 className="text-xl font-black text-white">Basic (PRO) Plan</h3>
                    <p className="text-xs text-slate-300 mt-2">Unlock amazing features and boost your progress!</p>
                    <button className="mt-4 px-6 py-2 bg-cyan-500 text-slate-950 font-black rounded-full shadow-lg" onClick={() => initiatePurchase({name: 'PRO Plan'})}>Subscribe Now</button>
                 </div>
                 ${proAccordionCode}
               </div>
            )}
            
            {subTierView === 'MAX' && (
               <div className="space-y-4">
                 <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 text-center">
                    <h3 className="text-xl font-black text-white">Ultra (MAX) Plan</h3>
                    <p className="text-xs text-slate-300 mt-2">Get the ultimate study experience with all features!</p>
                    <button className="mt-4 px-6 py-2 bg-purple-500 text-white font-black rounded-full shadow-lg" onClick={() => initiatePurchase({name: 'MAX Plan'})}>Subscribe Now</button>
                 </div>
                 ${maxAccordionCode}
               </div>
            )}
          </div>
        )}

        {tierType === 'CREDITS' && (
          <div className="space-y-4 text-center p-6 border border-emerald-500/30 bg-emerald-500/10 rounded-2xl">
             <h3 className="text-xl font-black text-white">Credit Store</h3>
             <p className="text-slate-300 text-xs">Buy credits to unlock premium content individually.</p>
             <button className="mt-4 px-6 py-2 bg-emerald-500 text-slate-950 font-black rounded-full shadow-lg" onClick={() => initiatePurchase({name: 'Credits'})}>Get Credits</button>
          </div>
        )}

        {tierType === 'DIAMONDS' && (
          <div className="space-y-4">
            <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/10 mb-4">
               <button onClick={() => setDiamondSubTab('PACKS')} className={\`flex-1 py-2 rounded-xl font-black text-xs transition-all \${diamondSubTab === 'PACKS' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}\`}>💎 Packs</button>
               <button onClick={() => setDiamondSubTab('WEEKLY')} className={\`flex-1 py-2 rounded-xl font-black text-xs transition-all \${diamondSubTab === 'WEEKLY' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}\`}>⭐ Weekly</button>
               <button onClick={() => setDiamondSubTab('MONTHLY')} className={\`flex-1 py-2 rounded-xl font-black text-xs transition-all \${diamondSubTab === 'MONTHLY' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}\`}>🌟 Monthly</button>
            </div>
            
            {diamondSubTab === 'PACKS' && (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIAMOND_PACKS.map(pack => (
                    <div key={pack.id} className="rounded-2xl p-4 border border-sky-400/20 bg-slate-900 shadow-md">
                       <h4 className="text-white font-bold">{pack.name}</h4>
                       <p className="text-sky-300 text-xs font-black my-1">{pack.diamonds} 💎</p>
                       <p className="text-slate-400 text-[10px] mb-3">Lifetime diamonds to unlock premium content.</p>
                       <button onClick={() => initiatePurchase(pack)} className="w-full py-2 bg-sky-500 text-slate-950 font-black rounded-xl shadow-md text-xs">Buy for ₹{pack.price}</button>
                    </div>
                  ))}
               </div>
            )}
            
            {diamondSubTab === 'WEEKLY' && (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIAMOND_SUBSCRIPTION_PLANS.filter(p => p.planType === 'WEEKLY').map(plan => (
                    <div key={plan.id} className="rounded-2xl p-4 border border-sky-400/20 bg-slate-900 shadow-md">
                       <h4 className="text-white font-bold">{plan.name}</h4>
                       <p className="text-sky-300 text-xs font-black my-1">{plan.totalDiamonds} 💎 (Over 7 Days)</p>
                       <p className="text-slate-400 text-[10px] mb-3">{plan.dailyDiamonds} 💎 claim daily.</p>
                       <button onClick={() => initiatePurchase(plan)} className="w-full py-2 bg-sky-500 text-slate-950 font-black rounded-xl shadow-md text-xs">Subscribe — ₹{plan.price}</button>
                    </div>
                  ))}
               </div>
            )}
            
            {diamondSubTab === 'MONTHLY' && (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIAMOND_SUBSCRIPTION_PLANS.filter(p => p.planType === 'MONTHLY').map(plan => (
                    <div key={plan.id} className="rounded-2xl p-4 border border-sky-400/20 bg-slate-900 shadow-md">
                       <h4 className="text-white font-bold">{plan.name}</h4>
                       <p className="text-sky-300 text-xs font-black my-1">{plan.totalDiamonds} 💎 (Over 30 Days)</p>
                       <p className="text-slate-400 text-[10px] mb-3">{plan.dailyDiamonds} 💎 claim daily.</p>
                       <button onClick={() => initiatePurchase(plan)} className="w-full py-2 bg-sky-500 text-slate-950 font-black rounded-xl shadow-md text-xs">Subscribe — ₹{plan.price}</button>
                    </div>
                  ))}
               </div>
            )}
          </div>
        )}

        {tierType === 'EXCHANGE' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
                <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">🔄</span> 
                Currency Exchange
              </h2>
              <p className="text-xs text-slate-400">Convert your Diamonds into Credits</p>
            </div>
            
            <div className="rounded-2xl p-5 border border-emerald-500/30 bg-slate-900/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Currency Swap System</span>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span className="text-sky-400">💎 Diamonds</span>
                    <ArrowLeftRight size={16} className="text-emerald-400" />
                    <span>🪙 Credits</span>
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-black">
                  1 💎 = {CREDITS_PER_DIAMOND} 🪙
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Aap apne paas maujood Diamonds ko instant <strong>Credits</strong> me badal sakte hain.
              </p>

              {exchangeMsg && (
                <div className={\`p-3 rounded-xl text-xs font-bold text-center \${exchangeMsg.startsWith('✅') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-red-500/20 text-red-300 border border-red-400/40'}\`}>
                  {exchangeMsg}
                </div>
              )}

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Exchange karne ke liye Diamonds:</label>
                  <span className="text-xs text-sky-300 font-bold">Aapke paas: {user.diamonds ?? 0} 💎</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={user.diamonds ?? 0}
                    value={exchangeDiamondsCount}
                    onChange={e => setExchangeDiamondsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-28 px-3 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-white font-black text-base text-center focus:outline-none focus:border-sky-400"
                  />
                  <div className="flex-1 flex gap-1.5">
                    {[1, 5, 10, 25].map(cnt => (
                      <button key={cnt} type="button" onClick={() => setExchangeDiamondsCount(cnt)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-black text-slate-300 border border-white/5 active:scale-95">
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
                    setExchangeMsg(\`⚠️ Diamonds kam hain!\`);
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
                className="w-full py-3.5 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Coins size={16} />
                <span>Exchange Karein: {exchangeDiamondsCount} 💎 ➔ {exchangeDiamondsCount * CREDITS_PER_DIAMOND} 🪙</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
`;

const finalCode = importsAndC + '\n' + storeCode + freeTabCode + '\n' + storeCodeEnd;
fs.writeFileSync('artifacts/iic-study-app-replit/src/components/Store.tsx', finalCode, 'utf8');

