const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `            {/* ── Settings Button ── */}`;

const replacement = `            {/* ── Active Subscriptions & History ── */}
            <button
              onClick={() => setShowProfileSubs(v => !v)}
              className={\`w-full px-4 py-4 flex items-center gap-3.5 \${_pHovCls} transition-colors\`}
              style={{ borderBottom: _pSep }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: _pIconBg, border: _pIconBdr }}>
                <span className="text-base leading-none">👑</span>
              </div>
              <div className="flex-1 text-left">
                <p className={\`text-sm font-bold \${_pTxt}\`}>My Subscriptions</p>
                <p className={\`text-[10px] mt-0.5 \${_pTxtSub}\`}>Active plans aur billing history dekhein</p>
              </div>
              <ChevronRight size={15} style={{ color: _pTxtMutedColor, transform: showProfileSubs ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} className="shrink-0" />
            </button>

            {showProfileSubs && (() => {
              const hist = user.subscriptionHistory || [];
              const hasAny = user.isPremium || user.creditSubscription || user.diamondSubscription || hist.length > 0;
              
              if (!hasAny) {
                return (
                  <div className="px-4 py-6 text-center" style={{ borderBottom: _pSep, background: 'rgba(0,0,0,0.1)' }}>
                    <span className="text-2xl mb-2 block">🤷</span>
                    <p className={\`text-xs font-bold \${_pTxt}\`}>Koi Subscription Nahi Hai</p>
                    <p className={\`text-[10px] \${_pTxtSub} mt-1\`}>Aapka account abhi Base Tier (Free) par hai.</p>
                  </div>
                );
              }

              return (
                <div className="px-4 py-4" style={{ borderBottom: _pSep, background: 'rgba(0,0,0,0.15)' }}>
                  
                  {/* Active Plans */}
                  <div className="mb-5">
                    <p className={\`text-[10px] font-black uppercase tracking-widest \${_pTxtSub} mb-3 flex items-center gap-1.5\`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Active Plans
                    </p>
                    
                    <div className="space-y-2">
                      {user.isPremium && (
                        <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl leading-none">{user.subscriptionLevel === 'ULTRA' ? '👑' : '⭐'}</span>
                            <div>
                              <p className={\`text-sm font-black \${_pTxt}\`}>{user.subscriptionLevel === 'ULTRA' ? 'MAX (Ultra)' : 'PRO (Basic)'} VIP</p>
                              {user.activeSubscriptions && user.activeSubscriptions.length > 0 && (
                                <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Active & Valid</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {user.creditSubscription && user.creditSubscription.status === 'ACTIVE' && (
                        <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl leading-none">🪙</span>
                            <div>
                              <p className={\`text-sm font-black \${_pTxt}\`}>{user.creditSubscription.planName}</p>
                              <p className="text-[10px] text-amber-400 font-bold mt-0.5">Roz {user.creditSubscription.dailyCredits} Credits</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {user.diamondSubscription && user.diamondSubscription.status === 'ACTIVE' && (
                        <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl leading-none">💎</span>
                            <div>
                              <p className={\`text-sm font-black \${_pTxt}\`}>{user.diamondSubscription.planName}</p>
                              <p className="text-[10px] text-sky-400 font-bold mt-0.5">Roz {user.diamondSubscription.dailyDiamonds} Diamonds</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* History */}
                  {hist.length > 0 && (
                    <div>
                      <p className={\`text-[10px] font-black uppercase tracking-widest \${_pTxtSub} mb-3\`}>Billing History</p>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {hist.slice().sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((h: any, i: number) => {
                          const isCoin = h.grantSource === 'CREDITS';
                          const isFree = h.isFree;
                          return (
                            <div key={i} className="p-2.5 rounded-lg flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div>
                                <p className={\`text-xs font-bold \${_pTxt}\`}>{h.level === 'ULTRA' ? 'MAX (Ultra)' : h.level === 'BASIC' ? 'PRO (Basic)' : 'Subscription'}</p>
                                <p className={\`text-[9px] \${_pTxtSub} mt-0.5\`}>{new Date(h.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-white">
                                  {isFree ? 'FREE' : isCoin ? \`-\${h.originalPrice || h.price} 🪙\` : \`₹\${h.price}\`}
                                </p>
                                <p className="text-[9px] text-emerald-400 font-medium mt-0.5">{(h.durationHours || 720) / 24} Din</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Settings Button ── */}`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
