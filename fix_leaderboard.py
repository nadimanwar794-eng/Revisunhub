import re

with open('artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx', 'r') as f:
    content = f.read()

old_code = """          {
            id: "LEADERBOARD_MENU",
            label: "Leaderboard",
            icon: Trophy,
            color: "amber",
            action: () => {
              onTabChange("LEADERBOARD");
            }"""

new_code = """          {
            id: "LEADERBOARD_MENU",
            label: "Leaderboard",
            icon: Trophy,
            color: "amber",
            action: () => {
              const isPremiumUser = user.isPremium && (user.subscriptionLevel === 'BASIC' || user.subscriptionLevel === 'ULTRA' || user.subscriptionLevel === 'PRO');
              const userLevel = getLevelInfo(user.score || 0).level;
              if (!isPremiumUser && userLevel < 2) {
                alert("Leaderboard unlocks at Level 2 for Free users. Upgrade to Premium for instant access!");
                return;
              }
              onTabChange("LEADERBOARD");
            }"""

content = content.replace(old_code, new_code)

with open('artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx', 'w') as f:
    f.write(content)
print("Updated Leaderboard")
