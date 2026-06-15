import os, re
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'
files = [f for f in os.listdir(d) if f.endswith('.js')]
for js in sorted(files):
    css = js.replace('.js', '.css')
    css_path = os.path.join(d, css)
    if not os.path.exists(css_path): continue
    js_content = open(os.path.join(d, js), encoding='utf-8').read()
    css_content = open(css_path, encoding='utf-8').read()
    classes = set(re.findall(r'"([a-z][a-z0-9\-]+)"', js_content))
    classes = {c for c in classes if '-' in c}
    missing = [c for c in sorted(classes) if '.' + c not in css_content]
    if missing:
        print(f'{js}: {len(missing)} missing: {missing[:5]}')
    else:
        print(f'{js}: OK')
