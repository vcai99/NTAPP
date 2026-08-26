import os
import re

def bundle():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    app_html_path = os.path.join(root_dir, 'app.html')
    
    if not os.path.exists(app_html_path):
        print("Error: app.html not found")
        return
        
    with open(app_html_path, 'r', encoding='utf-8') as f:
        app_html = f.read()
        
    # Replace activePage parameter
    app_html = app_html.replace('<?= activePage ?>', 'donvitinh')
    
    # Helper to recursively resolve includes
    def resolve_includes(content):
        include_pattern = re.compile(r'<\?!=\s*include\s*\(\'([^\']+)\'\)\s*\?>')
        
        def replace_match(match):
            filename = match.group(1)
            possible_paths = [
                os.path.join(root_dir, filename + '.html'),
                os.path.join(root_dir, 'backend', filename + '.html')
            ]
            
            for p in possible_paths:
                if os.path.exists(p):
                    with open(p, 'r', encoding='utf-8') as f_inc:
                        inc_content = f_inc.read()
                    return resolve_includes(inc_content)
                    
            print(f"Warning: Could not resolve include for '{filename}'")
            return f"<!-- MISSING INCLUDE: {filename} -->"
            
        return include_pattern.sub(replace_match, content)

    bundled_content = resolve_includes(app_html)
    dist_path = os.path.join(root_dir, 'dist_app.html')
    with open(dist_path, 'w', encoding='utf-8') as f_out:
        f_out.write(bundled_content)
    print("Successfully bundled dist_app.html via Python!")

if __name__ == '__main__':
    bundle()
