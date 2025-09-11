# 👥 Mitglieder-Modul - Mockup & Konzept

> **Ziel:** SPG-Verein 4 Alternative mit SEPA-Integration für Schützenvereine

## 🎯 Funktions-Übersicht

### **Kern-Features:**
- ✅ Mitgliederdatenbank (DSGVO-konform)
- ✅ Beitragsverwaltung mit SEPA-Lastschrift
- ✅ Excel-Import für Migration
- ✅ Austritte/Eintritte automatisiert
- ✅ Mitgliederstatistiken
- ✅ Export-Funktionen

## 📊 Datenbank-Schema

### **Mitglieder-Tabelle:**
```sql
CREATE TABLE members (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL,
  
  -- Persönliche Daten
  member_number VARCHAR(20) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  title VARCHAR(50),
  gender ENUM('male', 'female', 'other'),
  birth_date DATE,
  
  -- Kontakt
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  
  -- Adresse
  street VARCHAR(255),
  house_number VARCHAR(10),
  postal_code VARCHAR(10),
  city VARCHAR(100),
  country VARCHAR(50) DEFAULT 'Deutschland',
  
  -- Mitgliedschaft
  entry_date DATE NOT NULL,
  exit_date DATE NULL,
  member_status ENUM('active', 'inactive', 'honorary', 'youth') DEFAULT 'active',
  
  -- Beiträge
  membership_fee DECIMAL(10,2) DEFAULT 0.00,
  fee_category VARCHAR(50), -- 'Vollmitglied', 'Jugend', 'Familie', 'Ehrenmitglied'
  payment_method ENUM('sepa', 'cash', 'transfer') DEFAULT 'sepa',
  
  -- SEPA
  iban VARCHAR(34),
  bic VARCHAR(11),
  account_holder VARCHAR(255),
  sepa_mandate_id VARCHAR(35),
  sepa_mandate_date DATE,
  sepa_mandate_signed BOOLEAN DEFAULT FALSE,
  
  -- Zusatzinfo
  notes TEXT,
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(50),
  
  -- DSGVO
  data_consent BOOLEAN DEFAULT FALSE,
  data_consent_date DATE,
  newsletter_consent BOOLEAN DEFAULT FALSE,
  
  -- System
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  
  INDEX idx_tenant_member_number (tenant_id, member_number),
  INDEX idx_tenant_status (tenant_id, member_status),
  INDEX idx_tenant_fee_category (tenant_id, fee_category)
);
```

### **Beitrags-Tabelle:**
```sql
CREATE TABLE membership_fees (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL,
  member_id VARCHAR(36) NOT NULL,
  
  -- Beitrag
  year INT NOT NULL,
  quarter INT, -- 1-4 für Quartalsabrechnung
  amount DECIMAL(10,2) NOT NULL,
  fee_type VARCHAR(50), -- 'Grundbeitrag', 'Aufnahmegebühr', 'Sonderumlage'
  
  -- Status
  status ENUM('pending', 'collected', 'failed', 'refunded') DEFAULT 'pending',
  due_date DATE NOT NULL,
  collected_date DATE,
  
  -- SEPA
  sepa_transaction_id VARCHAR(50),
  sepa_mandate_id VARCHAR(35),
  
  -- System
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  INDEX idx_tenant_year_quarter (tenant_id, year, quarter),
  INDEX idx_member_year (member_id, year)
);
```

## 🖥️ UI-Mockups (Einbecker Schützengilde)

### **Dashboard:**
```
┌─────────────────────────────────────────────────────────┐
│ 👥 Mitgliederverwaltung - Einbecker Schützengilde      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📊 Übersicht                                           │
│ ┌─────────────┬─────────────┬─────────────┬───────────┐ │
│ │ Aktive      │ Jugend      │ Ehrenmitgl. │ Austritte │ │
│ │ 127         │ 23          │ 8           │ 3 (2025)  │ │
│ └─────────────┴─────────────┴─────────────┴───────────┘ │
│                                                         │
│ 💰 Beiträge 2025                                       │
│ ┌─────────────┬─────────────┬─────────────┬───────────┐ │
│ │ Eingezogen  │ Ausstehend  │ Fehlgeschl. │ Gesamt    │ │
│ │ €8.450      │ €1.200      │ €150        │ €9.800    │ │
│ └─────────────┴─────────────┴─────────────┴───────────┘ │
│                                                         │
│ [+ Neues Mitglied] [📥 Excel Import] [📊 Statistiken]  │
└─────────────────────────────────────────────────────────┘
```

### **Mitgliederliste:**
```
┌─────────────────────────────────────────────────────────┐
│ 👥 Mitgliederliste                                      │
├─────────────────────────────────────────────────────────┤
│ 🔍 [Suche...] [Filter: Alle ▼] [Export ▼]             │
│                                                         │
│ Nr.  │ Name              │ Status    │ Beitrag │ SEPA   │
│ ─────┼───────────────────┼───────────┼─────────┼────────│
│ 001  │ Müller, Hans      │ ✅ Aktiv  │ €65/Jahr│ ✅     │
│ 002  │ Schmidt, Anna     │ ✅ Aktiv  │ €65/Jahr│ ✅     │
│ 003  │ Weber, Klaus      │ 👑 Ehren  │ €0/Jahr │ -      │
│ 004  │ Jung, Lisa        │ 👶 Jugend │ €25/Jahr│ ✅     │
│ 005  │ Alt, Werner       │ ❌ Austritt│ -      │ -      │
│                                                         │
│ [◀ Zurück] Seite 1 von 8 [Weiter ▶]                   │
└─────────────────────────────────────────────────────────┘
```

### **Mitglied bearbeiten:**
```
┌─────────────────────────────────────────────────────────┐
│ ✏️ Mitglied bearbeiten: Hans Müller (Nr. 001)          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📋 Persönliche Daten                                   │
│ Vorname: [Hans          ] Nachname: [Müller          ] │
│ Titel:   [              ] Geschlecht: [Männlich ▼]     │
│ Geburt:  [15.03.1965    ] E-Mail: [hans@mueller.de   ] │
│                                                         │
│ 📍 Adresse                                             │
│ Straße:  [Musterstraße  ] Nr: [12 ]                    │
│ PLZ:     [37574         ] Ort: [Einbeck             ]  │
│                                                         │
│ 💳 Mitgliedschaft                                       │
│ Eintritt: [01.01.2010   ] Status: [Aktiv ▼]           │
│ Kategorie: [Vollmitglied ▼] Beitrag: [€65,00/Jahr]     │
│                                                         │
│ 🏦 SEPA-Lastschrift                                    │
│ IBAN:    [DE89 3705 0198 0000 0123 45]                 │
│ BIC:     [COLSDE33XXX   ] Inhaber: [Hans Müller     ]  │
│ Mandat:  [ESG-2025-001  ] Datum: [15.01.2025]         │
│ ☑️ Mandat unterschrieben                               │
│                                                         │
│ 📄 DSGVO & Einverständnis                              │
│ ☑️ Datenverarbeitung zugestimmt (15.01.2025)          │
│ ☑️ Newsletter-Empfang gewünscht                        │
│                                                         │
│ [💾 Speichern] [❌ Abbrechen] [🗑️ Löschen]            │
└─────────────────────────────────────────────────────────┘
```

### **SEPA-Lastschrift Übersicht:**
```
┌─────────────────────────────────────────────────────────┐
│ 🏦 SEPA-Lastschriften - Januar 2025                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📊 Übersicht                                           │
│ Fällig: 127 Mitglieder × €65 = €8.255                 │
│ Jugend: 23 Mitglieder × €25 = €575                     │
│ Gesamt: €8.830                                          │
│                                                         │
│ 📅 Einzugstermin: [31.01.2025] [Ändern]               │
│                                                         │
│ Status │ Anzahl │ Betrag  │ Aktion                     │
│ ───────┼────────┼─────────┼────────────────────────────│
│ ⏳ Bereit│ 150   │ €8.830  │ [📤 SEPA-XML erstellen]   │
│ ✅ Erfolg│ 0     │ €0      │ -                          │
│ ❌ Fehler│ 0     │ €0      │ -                          │
│                                                         │
│ [📋 Detailliste] [📊 Statistiken] [⚙️ Einstellungen]  │
└─────────────────────────────────────────────────────────┘
```

## 🔧 SEPA-Integration

### **SPG-Verein 4 Alternative:**
```typescript
interface SEPAService {
  // Mandate Management
  createMandate(memberId: string, iban: string, bic: string): Promise<SEPAMandate>;
  validateIBAN(iban: string): Promise<boolean>;
  
  // Direct Debit
  createDirectDebitCollection(
    members: Member[], 
    dueDate: Date,
    description: string
  ): Promise<SEPACollection>;
  
  // XML Generation
  generateSEPAXML(collection: SEPACollection): Promise<string>;
  
  // Bank Integration
  submitToBank(sepaXML: string): Promise<SubmissionResult>;
  
  // Return Handling
  processReturns(returnFile: string): Promise<ReturnResult[]>;
}

interface SEPAMandate {
  id: string;
  memberId: string;
  mandateId: string;        // ESG-2025-001
  iban: string;
  bic: string;
  accountHolder: string;
  signedDate: Date;
  status: 'active' | 'cancelled' | 'expired';
}

interface SEPACollection {
  id: string;
  collectionDate: Date;
  totalAmount: number;
  memberCount: number;
  transactions: SEPATransaction[];
  status: 'draft' | 'submitted' | 'processed' | 'failed';
}
```

### **Bank-Integration (Sparkasse/Volksbank):**
```typescript
class BankConnector {
  // EBICS Integration für größere Vereine
  async submitViaEBICS(sepaXML: string): Promise<void> {
    // EBICS-Protokoll für Bankkommunikation
  }
  
  // Online-Banking Upload für kleinere Vereine
  async uploadToOnlineBanking(sepaXML: string): Promise<string> {
    // Datei für manuellen Upload vorbereiten
    return this.createUploadFile(sepaXML);
  }
  
  // Return File Processing
  async processReturnFile(returnXML: string): Promise<ReturnResult[]> {
    // Rücklastschriften verarbeiten
    const returns = this.parseReturnXML(returnXML);
    
    // Mitglieder-Status aktualisieren
    for (const returnItem of returns) {
      await this.handleFailedPayment(returnItem);
    }
    
    return returns;
  }
}
```

## 📊 Excel-Import für Einbecker Schützengilde

### **Import-Mapping:**
```typescript
interface ExcelImportMapping {
  // Spalten-Mapping
  memberNumber: 'A';      // Mitgliedsnummer
  firstName: 'B';         // Vorname
  lastName: 'C';          // Nachname
  birthDate: 'D';         // Geburtsdatum
  street: 'E';            // Straße
  houseNumber: 'F';       // Hausnummer
  postalCode: 'G';        // PLZ
  city: 'H';              // Ort
  phone: 'I';             // Telefon
  email: 'J';             // E-Mail
  entryDate: 'K';         // Eintrittsdatum
  feeCategory: 'L';       // Beitragskategorie
  iban: 'M';              // IBAN
  bic: 'N';               // BIC
}

class ExcelImporter {
  async importMembers(file: File): Promise<ImportResult> {
    const workbook = await this.readExcelFile(file);
    const worksheet = workbook.getWorksheet(1);
    
    const results: ImportResult = {
      total: 0,
      imported: 0,
      errors: [],
      warnings: []
    };
    
    // Zeile für Zeile verarbeiten
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Header überspringen
      
      try {
        const member = this.mapRowToMember(row);
        await this.validateAndImportMember(member);
        results.imported++;
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          error: error.message
        });
      }
      
      results.total++;
    });
    
    return results;
  }
}
```

## 📈 Statistiken & Reports

### **Mitglieder-Dashboard:**
```typescript
interface MemberStatistics {
  // Mitglieder-Übersicht
  totalMembers: number;
  activeMembers: number;
  youthMembers: number;
  honoryMembers: number;
  
  // Entwicklung
  newMembersThisYear: number;
  exitedMembersThisYear: number;
  membershipGrowth: number; // Prozent
  
  // Altersstruktur
  ageDistribution: {
    under18: number;
    age18to30: number;
    age31to50: number;
    age51to65: number;
    over65: number;
  };
  
  // Finanzen
  totalAnnualFees: number;
  collectedFees: number;
  outstandingFees: number;
  failedPayments: number;
}

interface FinancialReport {
  year: number;
  quarter?: number;
  
  // Einnahmen
  membershipFees: number;
  entryFees: number;
  specialAssessments: number;
  
  // SEPA-Status
  successfulCollections: number;
  failedCollections: number;
  returnRate: number; // Prozent
  
  // Gemeinnützigkeit
  taxExemptStatus: boolean;
  charitableActivities: string[];
  publicBenefitReport: string;
}
```

## 🎯 Migration von SPG-Verein 4

### **Daten-Export aus SPG-Verein 4:**
1. **Mitgliederdaten** → Excel/CSV Export
2. **SEPA-Mandate** → Manuelle Übertragung
3. **Beitragshistorie** → Import der letzten 2 Jahre
4. **Bankverbindungen** → Sichere Übertragung

### **Migrations-Assistent:**
```typescript
class SPGMigrationWizard {
  async migrateSPGData(spgExportFile: File): Promise<MigrationResult> {
    // 1. SPG-Format analysieren
    const spgData = await this.parseSPGExport(spgExportFile);
    
    // 2. Daten validieren
    const validationResult = await this.validateSPGData(spgData);
    
    // 3. Mapping durchführen
    const mappedData = await this.mapSPGToRWKPlatform(spgData);
    
    // 4. Import durchführen
    const importResult = await this.importMappedData(mappedData);
    
    return {
      totalRecords: spgData.length,
      imported: importResult.success,
      errors: importResult.errors,
      warnings: validationResult.warnings
    };
  }
}
```

---

**Nächste Schritte:**
1. Datenbank-Schema implementieren
2. Basis-CRUD Operations
3. Excel-Import für Einbecker Schützengilde testen
4. SEPA-Integration recherchieren und implementieren