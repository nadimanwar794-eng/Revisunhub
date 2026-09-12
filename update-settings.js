const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `            {showProfileSettings && (<>
            {/* ── Theme Override Toggle ── */}`;

const replacement = `            {showProfileSettings && (<>
            {/* ── Auto-Deduct / Hide Pop-up Toggle ── */}
            <button
              onClick={async () => {
                const isCurrentlyHidden = (user.hideDeductionPopups ?? true);
                const nextVal = !isCurrentlyHidden;
                try {
                  const { doc, updateDoc } = await import('firebase/firestore');
                  const uRef = doc(db, 'users', user.id);
                  await updateDoc(uRef, { hideDeductionPopups: nextVal });
                  const updated = { ...user, hideDeductionPopups: nextVal };
                  handleUserUpdate(updated);
                  if (nextVal) showAlert('✅ Auto-payment ON: Pop-ups hidden', 'SUCCESS');
                  else showAlert('ℹ️ Manual-payment ON: Pop-ups enabled', 'INFO');
                } catch {
                  showAlert('❌ Failed to update payment settings', 'ERROR');
                }
              }}
              className={\`w-full px-4 py-4 flex items-center gap-3.5 \${_pHovCls} transition-colors\`}
              style={{ borderBottom: _pSep }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{
                background: (user.hideDeductionPopups ?? true) ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: \`1px solid \${(user.hideDeductionPopups ?? true) ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}\`,
              }}>
                <span className="text-base leading-none">{(user.hideDeductionPopups ?? true) ? '⚡' : '🛑'}</span>
              </div>
              <div className="flex-1 text-left">
                <p className={\`text-sm font-bold \${_pTxt}\`}>
                  {(user.hideDeductionPopups ?? true) ? 'Auto Payment: ON' : 'Payment Pop-ups: ON'}
                </p>
                <p className={\`text-[10px] mt-0.5 \${_pTxtSub}\`}>
                  {(user.hideDeductionPopups ?? true)
                    ? 'Pop-ups hidden, auto-deducts based on your primary currency.'
                    : 'Shows a confirmation pop-up before every deduction.'}
                </p>
              </div>
              <div className="shrink-0 w-10 h-5 rounded-full relative transition-all"
                style={{ background: (user.hideDeductionPopups ?? true) ? 'rgba(16,185,129,0.70)' : 'rgba(255,255,255,0.12)' }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    background: '#fff',
                    left: (user.hideDeductionPopups ?? true) ? '1.375rem' : '0.125rem',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }} />
              </div>
            </button>

            {/* ── Primary Currency Toggle ── */}
            <button
              onClick={async () => {
                const currentPrimary = user.primaryCurrency || 'CREDIT';
                const nextPrimary = currentPrimary === 'CREDIT' ? 'DIAMOND' : 'CREDIT';
                try {
                  const { doc, updateDoc } = await import('firebase/firestore');
                  const uRef = doc(db, 'users', user.id);
                  await updateDoc(uRef, { primaryCurrency: nextPrimary });
                  const updated = { ...user, primaryCurrency: nextPrimary };
                  handleUserUpdate(updated);
                  showAlert(\`✅ Primary Currency set to \${nextPrimary === 'DIAMOND' ? 'Diamonds' : 'Credits'}\`, 'SUCCESS');
                } catch {
                  showAlert('❌ Failed to update primary currency', 'ERROR');
                }
              }}
              className={\`w-full px-4 py-4 flex items-center gap-3.5 \${_pHovCls} transition-colors\`}
              style={{ borderBottom: _pSep }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{
                background: (user.primaryCurrency === 'DIAMOND') ? 'rgba(56,189,248,0.15)' : 'rgba(251,191,36,0.15)',
                border: \`1px solid \${(user.primaryCurrency === 'DIAMOND') ? 'rgba(56,189,248,0.4)' : 'rgba(251,191,36,0.4)'}\`,
              }}>
                <span className="text-base leading-none">{(user.primaryCurrency === 'DIAMOND') ? '💎' : '🪙'}</span>
              </div>
              <div className="flex-1 text-left">
                <p className={\`text-sm font-bold \${_pTxt}\`}>
                  Primary: {(user.primaryCurrency === 'DIAMOND') ? 'Diamonds' : 'Credits'}
                </p>
                <p className={\`text-[10px] mt-0.5 \${_pTxtSub}\`}>
                  {(user.primaryCurrency === 'DIAMOND')
                    ? '1 Diamond = 10 Credits. Auto-deductions will spend diamonds first.'
                    : 'Auto-deductions will spend credits first.'}
                </p>
              </div>
              <div className="shrink-0 w-10 h-5 rounded-full relative transition-all"
                style={{ background: (user.primaryCurrency === 'DIAMOND') ? 'rgba(56,189,248,0.70)' : 'rgba(251,191,36,0.70)' }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    background: '#fff',
                    left: (user.primaryCurrency === 'DIAMOND') ? '1.375rem' : '0.125rem',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }} />
              </div>
            </button>

            {/* ── Theme Override Toggle ── */}`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
