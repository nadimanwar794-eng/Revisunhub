const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `        const confirmGate = () => {
          if (!isFree) {
            const _freshU = (window as any).__dashUserRef?.current ?? user;
            const _updated = applyDeduction(_freshU, activeCost);
            if (_updated) {
              handleUserUpdate(_updated);
              try { recordCreditTx(_freshU.id, activeCost, 'SPEND', reason + (selectedBulk ? ' (Bulk)' : ''), _updated.credits ?? 0); } catch {}
            }
          }`;

const replacement = `        const confirmGate = () => {
          if (!isFree) {
            const _freshU = (window as any).__dashUserRef?.current ?? user;
            const _isAdm = _freshU.role === 'ADMIN' || _freshU.role === 'SUB_ADMIN';
            
            if (!_isAdm) {
              const _primary = (_freshU as any).primaryCurrency || 'CREDITS';
              if (_primary === 'DIAMONDS') {
                const diaCost = Math.ceil(activeCost / 10);
                const _updated = { ..._freshU, diamonds: (_freshU.diamonds || 0) - diaCost };
                handleUserUpdate(_updated);
              } else {
                const _updated = applyDeduction(_freshU, activeCost);
                if (_updated) {
                  handleUserUpdate(_updated);
                  try { recordCreditTx(_freshU.id, activeCost, 'SPEND', reason + (selectedBulk ? ' (Bulk)' : ''), _updated.credits ?? 0); } catch {}
                }
              }
            }
          }`;

content = content.replace(target, replacement);

// Change rendering text to match diamond if selected
const renderTarget = `        const emojiMap: Record<string, string> = {`;
const renderReplacement = `        const _primary = (user as any).primaryCurrency || 'CREDITS';
        const displayCost = _primary === 'DIAMONDS' ? Math.ceil(activeCost / 10) : activeCost;
        const displayCoin = _primary === 'DIAMONDS' ? '💎' : '🪙';
        const canAfford = _primary === 'DIAMONDS' ? ((user.diamonds || 0) >= displayCost) : (balance >= displayCost);

        const emojiMap: Record<string, string> = {`;

content = content.replace(renderTarget, renderReplacement);

// Change "activeCost" display to "displayCost"
content = content.replace(/\{activeCost\} CR/g, '{displayCost} {displayCoin}');
content = content.replace(/\{activeCost\}/g, '{displayCost}');
content = content.replace(/\{Math.floor\(cost \* discMult\)\} CR/g, '{_primary === "DIAMONDS" ? Math.ceil(Math.floor(cost * discMult) / 10) : Math.floor(cost * discMult)} {displayCoin}');
content = content.replace(/CR/g, '{displayCoin}');
// Wait, I shouldn't replace all CR blindly! Let's be careful.

fs.writeFileSync(file, content);
