const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    const { cost, discountPct } = _getCoinCost(baseCost);

    const total = getTotalCredits(user);
    if (total < cost) {
      showAlert(\`⚠️ Coins kam hain! \${cost} CR chahiye, aapke paas sirf \${total} CR hai.\`, 'INFO');
      onCancel?.();
      return;
    }`;

const replacement = `    const { cost, discountPct } = _getCoinCost(baseCost);

    if (user.hideDeductionPopups) {
      const _updated = applyDeduction(user, cost);
      if (_updated) {
        handleUserUpdate(_updated);
        try { recordCreditTx(user.id, cost, 'SPEND', reason + ' (Auto)', _updated.credits ?? 0); } catch {}
        action();
        return;
      }
    }

    const total = getTotalCredits(user);
    const canAfford = applyDeduction(user, cost) !== null;
    if (!canAfford) {
      showAlert(\`⚠️ Balance kam hai! \${cost} CR chahiye.\`, 'INFO');
      onCancel?.();
      return;
    }`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
