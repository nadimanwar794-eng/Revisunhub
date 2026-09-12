const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const claimDailyReward = () => {
    if (!canClaimReward) return;

    const finalReward = RewardEngine.calculateDailyBonus(user, settings);
    const updatedUser = RewardEngine.processClaim(user, finalReward);

    handleUserUpdate(updatedUser);
    setCanClaimReward(false);
    triggerRewardEffect(finalReward, 'Login Reward');
    showAlert(
      \`Received: \${finalReward} Free Credits!\`,
      "SUCCESS",
      "Daily Goal Met",
    );
  };`;

const replacement = `  const claimDailyReward = () => {
    if (!canClaimReward) return;

    if (user.isPremium && user.subscriptionLevel === 'ULTRA') {
      const updatedUser = {
        ...user,
        diamonds: (user.diamonds || 0) + 5,
        lastRewardClaimDate: new Date().toISOString()
      };
      handleUserUpdate(updatedUser);
      setCanClaimReward(false);
      triggerRewardEffect(5, 'Ultra Daily Diamonds');
      showAlert(\`Received: 5 Free Diamonds!\`, "SUCCESS", "Ultra Daily Goal Met");
    } else {
      const finalReward = RewardEngine.calculateDailyBonus(user, settings);
      const updatedUser = RewardEngine.processClaim(user, finalReward);
      handleUserUpdate(updatedUser);
      setCanClaimReward(false);
      triggerRewardEffect(finalReward, 'Login Reward');
      showAlert(
        \`Received: \${finalReward} Free Credits!\`,
        "SUCCESS",
        "Daily Goal Met",
      );
    }
  };`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
