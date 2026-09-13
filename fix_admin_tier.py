import re

with open('artifacts/iic-study-app-replit/src/components/AdminTierManager.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import { getTierFeatures, TierFeatureRow, DEFAULT_TIER_FEATURES } from '../utils/tierConfig';",
    "import { DEFAULT_TIER_FEATURES, TierFeature } from '../utils/tierConfig';"
)

content = content.replace("TierFeatureRow", "TierFeature")
content = content.replace("getTierFeatures(settings)", "settings.tierFeatures || DEFAULT_TIER_FEATURES")
content = content.replace("f.label", "f.name")
content = content.replace("f.isIndent", "f.isSubItem")

with open('artifacts/iic-study-app-replit/src/components/AdminTierManager.tsx', 'w') as f:
    f.write(content)
print("Fixed AdminTierManager.tsx")
