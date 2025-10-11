const fs = require('fs');
const path = require('path');

// Funktion zum Ersetzen von unescaped quotes
function fixUnescapedQuotes(content) {
  // Ersetze unescaped quotes in JSX
  return content
    .replace(/([^\\])"([^"]*)"([^>]*>)/g, '$1&quot;$2&quot;$3')
    .replace(/([^\\])'([^']*)'([^>]*>)/g, '$1&apos;$2&apos;$3')
    .replace(/>\s*"([^"]*)"([^<]*)</g, '>&quot;$1&quot;$2<')
    .replace(/>\s*'([^']*)'([^<]*)</g, '>&apos;$1&apos;$2<');
}

// Kritische Dateien mit Parsing-Fehlern
const criticalFiles = [
  'src/app/updates/page.tsx',
  'src/app/gesamtergebnisliste-generator/page.tsx',
  'src/app/verein/ergebnisse/page.tsx'
];

criticalFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Spezifische Fixes
    if (file.includes('updates/page.tsx')) {
      // Fix parsing error in line 183
      content = content.replace(/>\s*Version 0\.1\.0 <ArrowRight/, '>Version 0.1.0 <ArrowRight');
    }
    
    if (file.includes('gesamtergebnisliste-generator')) {
      // Fix duplicate props
      content = content.replace(/className="[^"]*"\s+className="[^"]*"/g, match => {
        const classes = match.match(/className="([^"]*)"/g);
        if (classes && classes.length > 1) {
          const allClasses = classes.map(c => c.replace(/className="([^"]*)"/, '$1')).join(' ');
          return `className="${allClasses}"`;
        }
        return match;
      });
    }
    
    if (file.includes('verein/ergebnisse')) {
      // Fix duplicate props
      content = content.replace(/className="[^"]*"\s+className="[^"]*"/g, match => {
        const classes = match.match(/className="([^"]*)"/g);
        if (classes && classes.length > 1) {
          const allClasses = classes.map(c => c.replace(/className="([^"]*)"/, '$1')).join(' ');
          return `className="${allClasses}"`;
        }
        return match;
      });
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed ${file}`);
  }
});

console.log('Critical ESLint fixes applied');