const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `            {/* ── Theme Override Toggle ── */}`;
const replacement = `            {/* ── Primary Currency Setup ── */}
            {(() => {
              const _primary = (user as any).primaryCurrency || 'CREDITS';
              return (
                <button
                  onClick={async () => {
                    try {
                      const newCurr = _primary === 'CREDITS' ? 'DIAMONDS' : 'CREDITS';
                      const uRef = doc(db, 'users', user.id);
                      await updateDoc(uRef, { primaryCurrency: newCurr });
                      const updated = { ...user, primaryCurrency: newCurr };
                      handleUserUpdate(updated);
                      showAlert(\`💰 Primary Currency set to \${newCurr}\`, 'SUCCESS');
                    } catch {
                      showAlert('❌ Currency update failed', 'ERROR');
                    }
                  }}
                  className={\`w-full px-4 py-4 flex items-center gap-3.5 \${_pHovCls} transition-colors\`}
                  style={{ borderBottom: _pSep }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{
                    background: _primary === 'DIAMONDS' ? 'rgba(56,189,248,0.15)' : 'rgba(251,191,36,0.15)',
                    border: \`1px solid \${_primary === 'DIAMONDS' ? 'rgba(56,189,248,0.4)' : 'rgba(251,191,36,0.4)'}\`,
                  }}>
                    <span className="text-base leading-none">{_primary === 'DIAMONDS' ? '💎' : '🪙'}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className={\`text-sm font-bold \${_pTxt}\`}>
                      {_primary === 'DIAMONDS' ? 'Primary: Diamonds' : 'Primary: Credits'}
                    </p>
                    <p className={\`text-[10px] mt-0.5 \${_pTxtSub}\`}>
                      Deduction popups is currency se charge karenge
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color: _pTxtMutedColor }} className="shrink-0" />
                </button>
              );
            })()}

            {/* ── Auto-Deduct / Hide Popup Toggle ── */}
            {(() => {
              const _hidePopup = (user as any).hideCoinPopup ?? true; // defukt on rahega new acciunt me
              return (
                <button
                  onClick={async () => {
                    try {
                      const uRef = doc(db, 'users', user.id);
                      await updateDoc(uRef, { hideCoinPopup: !_hidePopup });
                      const updated = { ...user, hideCoinPopup: !_hidePopup };
                      handleUserUpdate(updated);
                      showAlert(_hidePopup ? '👀 Popups enabled' : '⚡ Auto-deduct active', 'SUCCESS');
                    } catch {
                      showAlert('❌ Setting could not be updated', 'ERROR');
                    }
                  }}
                  className={\`w-full px-4 py-4 flex items-center gap-3.5 \${_pHovCls} transition-colors\`}
                  style={{ borderBottom: _pSep }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{
                    background: _hidePopup ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    border: \`1px solid \${_hidePopup ? 'rgba(16,185,129,0.40)' : 'rgba(239,68,68,0.40)'}\`,
                  }}>
                    <span className="text-base leading-none">{_hidePopup ? '⚡' : '🛡️'}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className={\`text-sm font-bold \${_pTxt}\`}>
                      {_hidePopup ? 'Auto-Deduct: ON' : 'Popups: ON'}
                    </p>
                    <p className={\`text-[10px] mt-0.5 \${_pTxtSub}\`}>
                      {_hidePopup
                        ? 'Confirmation popups hidden (Fast mode)'
                        : 'Credits/Diamonds spend se pehle puchega'}
                    </p>
                  </div>
                  {/* Toggle pill */}
                  <div className="shrink-0 w-10 h-5 rounded-full relative transition-all"
                    style={{ background: _hidePopup ? 'rgba(16,185,129,0.70)' : 'rgba(255,255,255,0.12)' }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                      style={{
                        background: '#fff',
                        left: _hidePopup ? '1.375rem' : '0.125rem',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                      }} />
                  </div>
                </button>
              );
            })()}

            {/* ── Theme Override Toggle ── */}`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
