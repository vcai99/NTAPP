const fs = require('fs');
const path = require('path');

function bundle() {
  const rootDir = __dirname;
  let appHtml = fs.readFileSync(path.join(rootDir, 'app.html'), 'utf8');

  // Replace activePage parameter
  appHtml = appHtml.replace(/<\?=\s*activePage\s*\?>/g, 'donvitinh');

  // Helper function to recursively resolve includes
  function resolveIncludes(content) {
    const includeRegex = /<\?!=\s*include\s*\('([^']+)'\)\s*\?>/g;
    return content.replace(includeRegex, (match, filename) => {
      let fileContent = '';
      const possiblePaths = [
        path.join(rootDir, filename + '.html'),
        path.join(rootDir, 'backend', filename + '.html')
      ];
      
      let resolved = false;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          fileContent = fs.readFileSync(p, 'utf8');
          resolved = true;
          break;
        }
      }
      
      if (!resolved) {
        console.warn(`Warning: Could not resolve include for '${filename}'`);
        return `<!-- MISSING INCLUDE: ${filename} -->`;
      }
      
      return resolveIncludes(fileContent);
    });
  }

  const bundledContent = resolveIncludes(appHtml);
  fs.writeFileSync(path.join(rootDir, 'dist_app.html'), bundledContent, 'utf8');
  console.log('Successfully bundled dist_app.html!');
}

bundle();
