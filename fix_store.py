import re
with open('artifacts/iic-study-app-replit/src/components/Store.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"import \{ FeatureMatrixModal \} from '\./FeatureMatrixModal';\n", "", content)
content = re.sub(r"      <FeatureMatrixModal\s+isOpen=\{showFeatureMatrix\}\s+onClose=\{\(\) => setShowFeatureMatrix\(false\)\}\s+settings=\{settings\}\s+/>\n", "", content)

with open('artifacts/iic-study-app-replit/src/components/Store.tsx', 'w') as f:
    f.write(content)
print("Removed FeatureMatrixModal from Store.tsx")
