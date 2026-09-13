import re

with open('artifacts/iic-study-app-replit/src/components/Store.tsx', 'r') as f:
    content = f.read()

basic_features = """  const defaultBasicFeatures = [
    'Daily Claim: 50 Credits / Day',
    'Daily Limit: 2500, MCQ Limit: 1500',
    'XP Multiplier: 1.5x Boost',
    'Store Discount: 5%',
    'Nsta Messenger: 100 msg/day, 30 Friends',
    'Revision Slates: 3 Free',
    'Offline Download & Basic Theme',
    'Writing & Correction Mode',
  ];"""

ultra_features = """  const defaultUltraFeatures = [
    'Daily Claim: 5 Diamonds / Day',
    'Daily Limit: 3500, MCQ Limit: 3000',
    'XP Multiplier: 2.0x Boost',
    'Store Discount: 10%',
    'Flashcard, PDF & Video Mode: FREE',
    'Nsta Messenger: 300 msg/day, 50 Friends',
    'Revision Slates: 4 Free + Multi-Book',
    'Global Message + Ultra Theme',
  ];"""

content = re.sub(r'const defaultBasicFeatures = \[.*?\];', basic_features, content, flags=re.DOTALL)
content = re.sub(r'const defaultUltraFeatures = \[.*?\];', ultra_features, content, flags=re.DOTALL)

with open('artifacts/iic-study-app-replit/src/components/Store.tsx', 'w') as f:
    f.write(content)
print("Features replaced successfully")
