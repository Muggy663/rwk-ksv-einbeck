# 🏗️ Modularisierungs-Konzept - RWK Platform

## 🎯 Architektur-Übersicht

### **Hybrid-Ansatz: "Distributed Monolith"**
```
Central Update Server (updates.rwk-platform.de)
├── Core Framework (Auto-Update)
├── Module Registry
├── Version Management
└── Configuration Management

Separate Instanzen:
├── ksv-einbeck.de (eigene Domain/DB)
├── ksv-goettingen.de (eigene Domain/DB)  
└── ksv-hannover.de (eigene Domain/DB)
```

## 🧩 Module-System

### **Core Framework**
```typescript
interface CoreFramework {
  auth: AuthenticationSystem;
  database: DatabaseAbstraction;
  ui: UIComponentLibrary;
  routing: RouterSystem;
  updates: UpdateManager;
  config: ConfigurationManager;
}
```

### **Module Definition**
```typescript
interface Module {
  id: string;                    // 'rwk', 'km', 'members', 'finance'
  name: string;                  // 'Rundenwettkampf'
  version: string;               // '1.0.0'
  description: string;           // Beschreibung für Admin
  
  // Dependencies
  dependencies: string[];        // ['core', 'auth']
  optionalDependencies: string[]; // ['finance'] für erweiterte Features
  
  // Module Content
  routes: ModuleRoute[];         // Routen die das Modul bereitstellt
  components: Component[];       // React Components
  services: Service[];           // Business Logic Services
  migrations: Migration[];       // Datenbank-Migrationen
  
  // Configuration
  config: ModuleConfig;          // Modul-spezifische Einstellungen
  permissions: Permission[];     // Erforderliche Berechtigungen
  
  // Lifecycle
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onUpdate?: (oldVersion: string) => Promise<void>;
}
```

### **Module Registry**
```typescript
class ModuleRegistry {
  private modules: Map<string, Module> = new Map();
  
  async registerModule(module: Module): Promise<void> {
    // Dependency Check
    await this.validateDependencies(module);
    
    // Install Module
    await this.installModule(module);
    
    // Register Routes
    await this.registerRoutes(module.routes);
    
    this.modules.set(module.id, module);
  }
  
  async unregisterModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) return;
    
    // Check if other modules depend on this
    await this.checkDependents(moduleId);
    
    // Uninstall
    await module.onUninstall?.();
    
    this.modules.delete(moduleId);
  }
}
```

## 🔄 Update-System

### **Update Server Architecture**
```typescript
interface UpdateServer {
  // Version Management
  getLatestVersion(instanceId: string): Promise<VersionInfo>;
  getModuleUpdates(moduleIds: string[]): Promise<ModuleUpdate[]>;
  
  // Update Distribution
  downloadUpdate(updateId: string): Promise<UpdatePackage>;
  verifyUpdate(package: UpdatePackage): Promise<boolean>;
  
  // Rollback Support
  createBackup(instanceId: string): Promise<BackupInfo>;
  rollback(instanceId: string, backupId: string): Promise<boolean>;
}

interface UpdatePackage {
  id: string;
  version: string;
  modules: ModuleUpdate[];
  migrations: Migration[];
  rollbackData: RollbackInfo;
  checksum: string;
}
```

### **Client Update Process**
```typescript
class UpdateClient {
  async checkForUpdates(): Promise<UpdateInfo[]> {
    const currentConfig = await this.getLocalConfig();
    const serverUpdates = await this.updateServer.getLatestVersion(this.instanceId);
    
    return this.compareVersions(currentConfig, serverUpdates);
  }
  
  async applyUpdate(updateInfo: UpdateInfo): Promise<boolean> {
    try {
      // 1. Create Backup
      const backup = await this.createBackup();
      
      // 2. Download Update
      const updatePackage = await this.downloadUpdate(updateInfo.id);
      
      // 3. Verify Integrity
      if (!await this.verifyPackage(updatePackage)) {
        throw new Error('Package verification failed');
      }
      
      // 4. Apply Migrations
      await this.applyMigrations(updatePackage.migrations);
      
      // 5. Update Files
      await this.updateFiles(updatePackage);
      
      // 6. Restart Services
      await this.restartServices();
      
      return true;
    } catch (error) {
      // Rollback on error
      await this.rollback(backup.id);
      throw error;
    }
  }
}
```

## 🏢 Instance Configuration

### **Organization Setup**
```typescript
interface OrganizationConfig {
  // Basic Info
  id: string;                    // 'ksv-einbeck'
  name: string;                  // 'Kreisschützenverband Einbeck'
  domain: string;                // 'ksv-einbeck.de'
  
  // Database
  database: {
    type: 'firebase' | 'postgresql' | 'mysql';
    connectionString: string;
    prefix: string;              // Tabellen-Prefix für Isolation
  };
  
  // Modules
  enabledModules: {
    [moduleId: string]: {
      version: string;
      config: any;
      enabled: boolean;
    };
  };
  
  // Branding
  branding: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    customCSS?: string;
    favicon?: string;
  };
  
  // Features
  features: {
    customRules: boolean;        // Eigene RWK-Ordnung
    multiTenant: boolean;        // Mehrere Vereine
    apiAccess: boolean;          // API für Integrationen
  };
}
```

## 📊 Datenbank-Isolation

### **Tenant-basierte Isolation**
```typescript
interface DatabaseManager {
  // Tenant Context
  setTenant(tenantId: string): void;
  getCurrentTenant(): string;
  
  // Isolated Queries
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  insert<T>(table: string, data: T): Promise<string>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<boolean>;
  delete(table: string, id: string): Promise<boolean>;
}

// Automatic Tenant Filtering
class TenantAwareRepository<T> {
  constructor(
    private db: DatabaseManager,
    private tableName: string
  ) {}
  
  async findAll(): Promise<T[]> {
    // Automatically adds tenant filter
    return this.db.query(`
      SELECT * FROM ${this.tableName} 
      WHERE tenant_id = ?
    `, [this.db.getCurrentTenant()]);
  }
}
```

## 🔐 Security & Permissions

### **Module Permissions**
```typescript
interface Permission {
  module: string;                // 'rwk'
  action: string;                // 'read', 'write', 'admin'
  resource: string;              // 'teams', 'results', 'users'
}

interface UserRole {
  id: string;
  name: string;                  // 'admin', 'vereinsvertreter', 'mannschaftsfuehrer'
  permissions: Permission[];
  moduleAccess: string[];        // Welche Module darf die Rolle nutzen
}

class PermissionManager {
  async checkPermission(
    userId: string, 
    module: string, 
    action: string, 
    resource: string
  ): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    
    return userRoles.some(role => 
      role.moduleAccess.includes(module) &&
      role.permissions.some(perm => 
        perm.module === module &&
        perm.action === action &&
        perm.resource === resource
      )
    );
  }
}
```

## 🚀 Deployment Strategy

### **Development Workflow**
```bash
# 1. Feature Development
git checkout -b feature/members-module
# ... development ...
git commit -m "feat: Add members module"

# 2. Module Testing
npm run test:module members
npm run test:integration

# 3. Build Module Package
npm run build:module members
# Creates: dist/modules/members-v1.0.0.zip

# 4. Deploy to Update Server
npm run deploy:module members --version 1.0.0

# 5. Notify Instances
curl -X POST https://updates.rwk-platform.de/notify \
  -d '{"module": "members", "version": "1.0.0"}'
```

### **Instance Update Process**
```bash
# Automatic Update Check (Cron Job)
0 2 * * * /usr/local/bin/rwk-platform check-updates

# Manual Update
rwk-platform update --module members --version 1.0.0

# Rollback if needed
rwk-platform rollback --to-backup backup-20250115-0200
```

## 📈 Monitoring & Analytics

### **Update Metrics**
```typescript
interface UpdateMetrics {
  instanceId: string;
  updateId: string;
  startTime: Date;
  endTime: Date;
  success: boolean;
  error?: string;
  rollbackRequired: boolean;
  downtime: number; // in seconds
}

interface ModuleUsage {
  moduleId: string;
  instanceId: string;
  activeUsers: number;
  requestsPerDay: number;
  errorRate: number;
  performanceMetrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
  };
}
```

## 🎯 Migration Strategy

### **Phase 1: Extract Core**
1. Bestehende RWK-App analysieren
2. Core-Framework extrahieren
3. Shared Components identifizieren
4. Database Abstraction Layer

### **Phase 2: Modularize Existing**
1. RWK-Funktionen in Modul extrahieren
2. KM-Funktionen in Modul extrahieren
3. Module-Loader implementieren
4. Tests für modulare Struktur

### **Phase 3: New Modules**
1. Mitglieder-Modul entwickeln
2. Finanz-Modul entwickeln
3. Integration zwischen Modulen
4. Update-System implementieren

### **Phase 4: Multi-Instance**
1. Tenant-System implementieren
2. Separate Instanzen deployen
3. Update-Distribution testen
4. Pilot-Kunden onboarden

---

**Nächste Schritte:**
1. Git-Repo `rwk-platform` erstellen
2. Basis-Struktur implementieren
3. Core-Framework aus bestehender App extrahieren
4. Erstes Modul (RWK) als Proof of Concept