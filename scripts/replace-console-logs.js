/**
 * Script zum automatischen Ersetzen von console.log durch secure-logger
 * 
 * Verwendung: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');

// Konfiguration
const SRC_DIR = path.join(__dirname, '..', 'src');
const DRY_RUN = false; // true = nur anzeigen, false = tatsächlich ändern

// Statistiken
let stats = {
  filesScanned: 0,
  filesModified: 0,
  replacements: {
    'console.log': 0,
    'console.error': 0,
    'console.warn': 0,
    'console.debug': 0,
    'console.info': 0
  }
};

/**
 * Prüft ob Datei bereits secure-logger importiert
 */
function hasSecureLoggerImport(content) {
  return content.includes("from '@/lib/utils/secure-logger'") ||
         content.includes('from "@/lib/utils/secure-logger"');
}

/**
 * Fügt secure-logger Import hinzu
 */
function addSecureLoggerImport(content) {
  // Finde die letzte Import-Zeile
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith("import{")) {
      lastImportIndex = i;
    }
    // Stoppe bei erster nicht-import Zeile (außer Kommentare und Leerzeilen)
    if (lines[i].trim() && 
        !lines[i].trim().startsWith('import') && 
        !lines[i].trim().startsWith('//') &&
        !lines[i].trim().startsWith('/*') &&
        !lines[i].trim().startsWith('*') &&
        lastImportIndex > -1) {
      break;
    }
  }
  
  const importStatement = "import { logInfo, logWarn, logError, logDebug } from '@/lib/utils/secure-logger';";
  
  if (lastImportIndex === -1) {
    // Keine Imports gefunden, füge am Anfang ein
    return importStatement + '\n' + content;
  } else {
    // Füge nach letztem Import ein
    lines.splice(lastImportIndex + 1, 0, importStatement);
    return lines.join('\n');
  }
}

/**
 * Ersetzt console.* Aufrufe durch secure-logger
 */
function replaceConsoleCalls(content) {
  let modified = content;
  let hasChanges = false;
  
  // Muster für verschiedene console-Aufrufe
  const patterns = [
    // console.log("message", data) -> logInfo("message", { data })
    {
      regex: /console\.log\((["'`][^"'`]*["'`])\s*,\s*([^)]+)\)/g,
      replacement: (match, msg, data) => {
        stats.replacements['console.log']++;
        hasChanges = true;
        // Wenn data ein Objekt ist, direkt verwenden, sonst in Objekt wrappen
        const contextData = data.trim().startsWith('{') ? data : `{ data: ${data} }`;
        return `logInfo(${msg}, ${contextData})`;
      }
    },
    // console.log("message") -> logInfo("message")
    {
      regex: /console\.log\((["'`][^"'`]*["'`])\)/g,
      replacement: (match, msg) => {
        stats.replacements['console.log']++;
        hasChanges = true;
        return `logInfo(${msg})`;
      }
    },
    // console.log(variable) -> logInfo("Debug", { data: variable })
    {
      regex: /console\.log\(([^"'`][^)]*)\)/g,
      replacement: (match, data) => {
        stats.replacements['console.log']++;
        hasChanges = true;
        return `logDebug("Debug output", { data: ${data} })`;
      }
    },
    // console.error("message", error) -> logError("message", error)
    {
      regex: /console\.error\((["'`][^"'`]*["'`])\s*,\s*([^)]+)\)/g,
      replacement: (match, msg, error) => {
        stats.replacements['console.error']++;
        hasChanges = true;
        return `logError(${msg}, ${error})`;
      }
    },
    // console.error("message") -> logError("message")
    {
      regex: /console\.error\((["'`][^"'`]*["'`])\)/g,
      replacement: (match, msg) => {
        stats.replacements['console.error']++;
        hasChanges = true;
        return `logError(${msg})`;
      }
    },
    // console.error(error) -> logError("Error occurred", error)
    {
      regex: /console\.error\(([^"'`][^)]*)\)/g,
      replacement: (match, error) => {
        stats.replacements['console.error']++;
        hasChanges = true;
        return `logError("Error occurred", ${error})`;
      }
    },
    // console.warn -> logWarn
    {
      regex: /console\.warn\((["'`][^"'`]*["'`])\s*,\s*([^)]+)\)/g,
      replacement: (match, msg, data) => {
        stats.replacements['console.warn']++;
        hasChanges = true;
        const contextData = data.trim().startsWith('{') ? data : `{ data: ${data} }`;
        return `logWarn(${msg}, ${contextData})`;
      }
    },
    {
      regex: /console\.warn\((["'`][^"'`]*["'`])\)/g,
      replacement: (match, msg) => {
        stats.replacements['console.warn']++;
        hasChanges = true;
        return `logWarn(${msg})`;
      }
    },
    // console.debug -> logDebug
    {
      regex: /console\.debug\(([^)]+)\)/g,
      replacement: (match, args) => {
        stats.replacements['console.debug']++;
        hasChanges = true;
        return `logDebug(${args})`;
      }
    },
    // console.info -> logInfo
    {
      regex: /console\.info\(([^)]+)\)/g,
      replacement: (match, args) => {
        stats.replacements['console.info']++;
        hasChanges = true;
        return `logInfo(${args})`;
      }
    }
  ];
  
  // Wende alle Patterns an
  patterns.forEach(({ regex, replacement }) => {
    modified = modified.replace(regex, replacement);
  });
  
  return { content: modified, hasChanges };
}

/**
 * Verarbeitet eine einzelne Datei
 */
function processFile(filePath) {
  stats.filesScanned++;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Überspringe Dateien, die bereits secure-logger verwenden und keine console.* haben
  if (hasSecureLoggerImport(content) && !content.match(/console\.(log|error|warn|debug|info)/)) {
    return;
  }
  
  // Ersetze console-Aufrufe
  const { content: modifiedContent, hasChanges } = replaceConsoleCalls(content);
  
  if (!hasChanges) {
    return;
  }
  
  // Füge Import hinzu, falls noch nicht vorhanden
  let finalContent = modifiedContent;
  if (!hasSecureLoggerImport(modifiedContent)) {
    finalContent = addSecureLoggerImport(modifiedContent);
  }
  
  stats.filesModified++;
  
  if (DRY_RUN) {
    console.log(`\n📝 Würde ändern: ${filePath}`);
  } else {
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log(`✅ Geändert: ${filePath}`);
  }
}

/**
 * Durchsucht Verzeichnis rekursiv
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Überspringe node_modules, .next, etc.
      if (!['node_modules', '.next', 'dist', 'build'].includes(file)) {
        scanDirectory(filePath);
      }
    } else if (stat.isFile()) {
      // Nur .ts, .tsx, .js, .jsx Dateien
      if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        // Überspringe secure-logger.ts selbst
        if (!filePath.includes('secure-logger')) {
          processFile(filePath);
        }
      }
    }
  });
}

/**
 * Hauptfunktion
 */
function main() {
  console.log('🚀 Starte console.log Ersetzung...\n');
  console.log(`📁 Verzeichnis: ${SRC_DIR}`);
  console.log(`🔧 Modus: ${DRY_RUN ? 'DRY RUN (keine Änderungen)' : 'LIVE (Dateien werden geändert)'}\n`);
  
  if (!DRY_RUN) {
    console.log('⚠️  WARNUNG: Dateien werden tatsächlich geändert!');
    console.log('💡 Tipp: Committe deine Änderungen vorher oder setze DRY_RUN = true\n');
  }
  
  scanDirectory(SRC_DIR);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 STATISTIK');
  console.log('='.repeat(60));
  console.log(`Dateien gescannt: ${stats.filesScanned}`);
  console.log(`Dateien geändert: ${stats.filesModified}`);
  console.log('\nErsetzungen:');
  Object.entries(stats.replacements).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`  ${type}: ${count}x`);
    }
  });
  console.log('='.repeat(60));
  
  if (DRY_RUN) {
    console.log('\n💡 Setze DRY_RUN = false um Änderungen anzuwenden');
  } else {
    console.log('\n✅ Fertig! Prüfe die Änderungen mit: git diff');
  }
}

// Script ausführen
main();
