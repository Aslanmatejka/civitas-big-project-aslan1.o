import os, re
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'
for js in ['AppStorePage.js','CommunityPage.js','DataVaultPage.js','DocsPage.js','HomePage.js']:
    css = js.replace('.js', '.css')
    js_content = open(os.path.join(d, js), encoding='utf-8').read()
    css_content = open(os.path.join(d, css), encoding='utf-8').read()
    classes = {c for c in re.findall(r'"([a-z][a-z0-9-]+)"', js_content) if '-' in c}
    missing = [c for c in sorted(classes) if '.' + c not in css_content]
    print(f'{js}: {missing}')
