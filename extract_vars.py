import re

def extract_var(filename, varname):
    with open(filename, 'r') as f:
        content = f.read()
    match = re.search(r'const ' + varname + r' = `([\s\S]*?)`;', content)
    if match:
        return match.group(1)
    return ""

with open('free_tab.tsx', 'w') as f:
    f.write(extract_var('insert_free_tab.js', 'freeTabCode'))

with open('pro_accordion.tsx', 'w') as f:
    f.write(extract_var('fix_accordions.js', 'proNew'))

with open('max_accordion.tsx', 'w') as f:
    f.write(extract_var('fix_accordions.js', 'maxNew'))

