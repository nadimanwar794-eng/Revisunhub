const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    const _isAdm = user.role === 'ADMIN' || user.role === 'SUB_ADMIN';
    if (_isAdm) { action(); return; }
    const { cost, discountPct } = _getCoinCost(baseCost);
    const total = getTotalCredits(user);
    if (total < cost) {
      showAlert(\`⚠️ Coins kam hain! \${cost} CR chahiye, aapke paas sirf \${total} CR hai.\`, 'INFO');
      onCancel?.();
      return;
    }
    const _bulkOption = (bulkOpt && bulkOpt.count >= 2) ? {
      count: bulkOpt.count,
      originalTotal: bulkOpt.count * cost,
      totalCost: Math.floor(bulkOpt.count * cost * 0.8),
      action: bulkOpt.action,
      pages: (bulkOpt.pages || []).map(p => ({ name: p.name, cost: p.cost })),
    } : undefined;
    setCoinGate({ cost, originalCost: baseCost, discountPct, reason, action, onCancel, bulkOption: _bulkOption, pageInfo });
  };`;

const replacement = `    const _isAdm = user.role === 'ADMIN' || user.role === 'SUB_ADMIN';
    if (_isAdm) { action(); return; }

    const _primary = (user as any).primaryCurrency || 'CREDITS';
    const _hidePopup = (user as any).hideCoinPopup ?? true;

    const { cost, discountPct } = _getCoinCost(baseCost);
    const diaCost = Math.ceil(cost / 10); // 1 Diamond = 10 Credits

    let canAfford = false;
    let err = '';

    if (_primary === 'DIAMONDS') {
      const totalDia = user.diamonds || 0;
      canAfford = totalDia >= diaCost;
      err = \`⚠️ Diamonds kam hain! \${diaCost} 💎 chahiye, aapke paas sirf \${totalDia} 💎 hai.\`;
    } else {
      const total = getTotalCredits(user);
      canAfford = total >= cost;
      err = \`⚠️ Coins kam hain! \${cost} CR chahiye, aapke paas sirf \${total} CR hai.\`;
    }

    if (!canAfford) {
      showAlert(err, 'INFO');
      onCancel?.();
      return;
    }

    if (_hidePopup && (!bulkOpt || bulkOpt.count < 2)) {
      // Auto-deduct
      let updatedUser = { ...user };
      if (_primary === 'DIAMONDS') {
        updatedUser.diamonds = (updatedUser.diamonds || 0) - diaCost;
      } else {
        const afterDed = applyDeduction(user, cost);
        if (afterDed) updatedUser = afterDed;
      }
      handleUserUpdate(updatedUser);
      // Trigger effect
      if (_primary === 'DIAMONDS') triggerRewardEffect(0, \`-\${diaCost} 💎\`);
      else triggerRewardEffect(0, \`-\${cost} 🪙\`);
      
      action();
      return;
    }

    const _bulkOption = (bulkOpt && bulkOpt.count >= 2) ? {
      count: bulkOpt.count,
      originalTotal: bulkOpt.count * cost,
      totalCost: Math.floor(bulkOpt.count * cost * 0.8),
      action: bulkOpt.action,
      pages: (bulkOpt.pages || []).map(p => ({ name: p.name, cost: p.cost })),
    } : undefined;

    setCoinGate({ cost, originalCost: baseCost, discountPct, reason, action, onCancel, bulkOption: _bulkOption, pageInfo });
  };`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
