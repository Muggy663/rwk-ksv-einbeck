#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Pfade zu den Dateien
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const readmePath = path.join(__dirname, '..', 'README.md');

try {
  // package.json lesen
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;
  
  console.log(`📦 Aktuelle Version: ${version}`);
  
  // README.md lesen
  let readmeContent = fs.readFileSync(readmePath, 'utf8');
  
  // Version-Platzhalter ersetzen
  const updatedContent = readmeContent.replace(/\{\{ VERSION \}\}/g, version);
  
  // README.md schreiben
  fs.writeFileSync(readmePath, updatedContent, 'utf8');
  
  console.log('✅ README.md erfolgreich aktualisiert!');
  console.log(`🔄 Alle {{ VERSION }} Platzhalter wurden durch ${version} ersetzt`);
  
} catch (error) {
  console.error('❌ Fehler beim Aktualisieren der Version:', error.message);
  process.exit(1);
}