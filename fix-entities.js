const fs = require('fs');
const path = require('path');

// Function to fix unescaped entities in a file
function fixEntitiesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Replace unescaped quotes and apostrophes
    const replacements = [
      { from: /(?<!&[a-z]*);quot;/g, to: '&quot;' },
      { from: /(?<!&[a-z]*);#39;/g, to: '&#39;' },
      { from: /(?<!&[a-z]*);apos;/g, to: '&apos;' },
      { from: /(?<!&[a-z]*);ldquo;/g, to: '&ldquo;' },
      { from: /(?<!&[a-z]*);rdquo;/g, to: '&rdquo;' },
      { from: /(?<!&[a-z]*);lsquo;/g, to: '&lsquo;' },
      { from: /(?<!&[a-z]*);rsquo;/g, to: '&rsquo;' }
    ];
    
    // Simple replacements for common cases
    const simpleReplacements = [
      { from: /"/g, to: '&quot;' },
      { from: /'/g, to: '&#39;' }
    ];
    
    // Apply simple replacements only in JSX content (between > and <)
    content = content.replace(/>([^<]*['""][^<]*)</g, (match, innerContent) => {
      let fixed = innerContent;
      fixed = fixed.replace(/"/g, '&quot;');
      fixed = fixed.replace(/'/g, '&#39;');
      return '>' + fixed + '<';
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed entities in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Get all TypeScript/JavaScript files with errors
const errorFiles = [
  'src/app/add-fields/page.tsx',
  'src/app/admin/clubs/page.tsx',
  'src/app/admin/edit-results/page.tsx',
  'src/app/admin/leagues/page.tsx',
  'src/app/admin/migrations/page.tsx',
  'src/app/admin/results/page.tsx',
  'src/app/admin/seasons/page.tsx',
  'src/app/admin/seasons/zeitungsbericht/page.tsx',
  'src/app/admin/shooters/page.tsx',
  'src/app/admin/teams/page.tsx',
  'src/app/admin/user-management/page.tsx',
  'src/app/app/page.tsx',
  'src/app/copyright/page.tsx',
  'src/app/debug-auth/page.tsx',
  'src/app/dokumente/DocumentPreview.tsx',
  'src/app/fuer-vereine/page.tsx',
  'src/app/handbuch/page.tsx',
  'src/app/km/mannschaften/page.tsx',
  'src/app/km/meldungen/page.tsx',
  'src/app/km-orga/page.tsx',
  'src/app/nutzungsbedingungen/page.tsx',
  'src/app/rwk-tabellen/page.tsx',
  'src/app/support/page.tsx',
  'src/app/termine/add/page.tsx',
  'src/app/updates/v0/page.tsx',
  'src/app/updates/v0.10.1/page.tsx',
  'src/app/updates/v0.11.5/page.tsx',
  'src/app/updates/v0.11.6/page.tsx',
  'src/app/updates/v0.2/page.tsx',
  'src/app/updates/v0.3/page.tsx',
  'src/app/updates/v0.7/page.tsx',
  'src/app/updates/v0.8/page.tsx',
  'src/app/updates/v0.9/page.tsx',
  'src/app/updates/v0.9.1.0/page.tsx',
  'src/app/updates/v0.9.2/page.tsx',
  'src/app/updates/v0.9.4/page.tsx',
  'src/app/updates/v0.9.5/page.tsx',
  'src/app/updates/v1.7.0/page.tsx',
  'src/app/updates/v1.7.4/page.tsx',
  'src/app/updates/v1.7.5/page.tsx',
  'src/app/updates/v1.7.5.5/page.tsx',
  'src/app/verein/ergebnisse/page.tsx',
  'src/app/verein/hilfe/page.tsx',
  'src/app/verein/mannschaften/page.tsx',
  'src/app/verein/schuetzen/page.tsx',
  'src/app/vereinssoftware/beitraege/page.tsx',
  'src/app/vereinssoftware/support/page.tsx',
  'src/components/GlobalSearch.tsx',
  'src/components/onboarding/FirstStepsWizard.tsx',
  'src/components/onboarding/OnboardingWizard.tsx'
];

console.log('Starting to fix unescaped entities...');

errorFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fixEntitiesInFile(fullPath);
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});

console.log('Finished fixing entities.');