const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/km-orga/meldungen/page.tsx',
  'src/app/km/admin/page.tsx', 
  'src/app/km/mitglieder/page.tsx',
  'src/app/km/uebersicht/page.tsx',
  'src/app/verein/schuetzen/page.tsx'
];

filesToFix.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove broken console.log fragments
    content = content.replace(/console\.log\([^)]*$/gm, '');
    content = content.replace(/^\s*[^;,})\]]*console\.log.*$/gm, '');
    content = content.replace(/^\s*[^;,})\]]*\);?\s*$/gm, '');
    
    // Fix common syntax issues
    content = content.replace(/}\s*catch\s*\(/g, '} catch (');
    content = content.replace(/}\s*finally\s*\(/g, '} finally (');
    content = content.replace(/if\s*\(\s*response\.ok\s*\)\s*{/g, '});\n      if (response.ok) {');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
});