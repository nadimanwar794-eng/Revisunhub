with open('artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx', 'r') as f:
    text = f.read()

import re
match = re.search(r"  const openHwWithModeGate = \([\s\S]*?  \};", text)
if match:
    print(match.group(0))
