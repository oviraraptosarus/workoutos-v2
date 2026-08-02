import os, re

def replace_colors(content):
    colors = 'blue|purple|emerald|green|indigo|pink|rose|red|orange|yellow|teal|cyan|sky|fuchsia|violet|amber|lime'
    
    # 1. bg-color-500/600 -> bg-white
    content = re.sub(r'bg-(' + colors + r')-[56]00\b', 'bg-white', content)
    content = re.sub(r'hover:bg-(' + colors + r')-[67]00\b', 'hover:bg-zinc-200', content)
    
    # 2. text-color-400/500/600 -> text-white
    content = re.sub(r'text-(' + colors + r')-[3456]00\b', 'text-white', content)
    
    # 3. text-color-100/200 -> text-zinc-300
    content = re.sub(r'text-(' + colors + r')-[12]00\b', 'text-zinc-300', content)
    
    # 5. bg-color-50 -> bg-white/5
    content = re.sub(r'bg-(' + colors + r')-50\b', 'bg-white/5', content)
    
    # 6. border-color-500 -> border-white/20
    content = re.sub(r'border-(' + colors + r')-[456]00\b', 'border-white/20', content)
    content = re.sub(r'border-(' + colors + r')-[123]00\b', 'border-white/10', content)
    
    # 7. shadow/ring
    content = re.sub(r'shadow-(' + colors + r')-[456]00\b', 'shadow-white/10', content)
    content = re.sub(r'ring-(' + colors + r')-[456]00\b', 'ring-white/20', content)

    # 8. Fix text-white inside buttons that are now bg-white
    # Look for bg-white and text-white in the same className string and replace text-white with text-black
    def fix_button_text(match):
        cls = match.group(0)
        if 'bg-white' in cls and 'text-white' in cls and 'bg-white/' not in cls:
            return cls.replace('text-white', 'text-black')
        return cls
        
    content = re.sub(r'className=\"[^\"]+\"', fix_button_text, content)
    content = re.sub(r'className=\{`[^`]+`\}', fix_button_text, content)
    
    return content

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            new_content = replace_colors(content)
            if content != new_content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
print('Done!')
