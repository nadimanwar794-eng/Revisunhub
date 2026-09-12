const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `          if (!isPermanentlyUnlocked && !_isAdm) {
            const _updated = applyDeduction(_freshU, activeCost);
            if (_updated) {
              handleUserUpdate(_updated);
              try { recordCreditTx(_freshU.id, activeCost, 'SPEND', reason + (selectedBulk ? ' (Bulk)' : ''), _updated.credits ?? 0); } catch {}
            }
          }`;

const replacement = `          if (!isPermanentlyUnlocked && !_isAdm) {
            const _primary = (_freshU as any).primaryCurrency || 'CREDITS';
            if (_primary === 'DIAMONDS') {
              const diaCost = Math.ceil(activeCost / 10);
              const _updated = { ..._freshU, diamonds: (_freshU.diamonds || 0) - diaCost };
              handleUserUpdate(_updated);
              // Not logging diamond tx for now, or you can add one
            } else {
              const _updated = applyDeduction(_freshU, activeCost);
              if (_updated) {
                handleUserUpdate(_updated);
                try { recordCreditTx(_freshU.id, activeCost, 'SPEND', reason + (selectedBulk ? ' (Bulk)' : ''), _updated.credits ?? 0); } catch {}
              }
            }
          }`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
