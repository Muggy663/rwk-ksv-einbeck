# Git Branch Wechsel Anleitung

## Zwischen Branches wechseln

### 1. Aktuellen Branch anzeigen
```bash
git branch
```
oder
```bash
git status
```

### 2. Zu einem anderen Branch wechseln
```bash
# Zu master wechseln
git checkout master

# Zu security-fixes wechseln  
git checkout security-fixes
```

### 3. Alle verfügbaren Branches anzeigen
```bash
# Lokale Branches
git branch

# Alle Branches (lokal + remote)
git branch -a
```

### 4. Branch mit aktuellen Änderungen wechseln
```bash
# Änderungen stashen (temporär speichern)
git stash

# Branch wechseln
git checkout master

# Änderungen wieder holen
git stash pop
```

### 5. Neuen Branch erstellen und wechseln
```bash
git checkout -b neuer-branch-name
```

## Wichtige Tipps

- **Vor dem Wechseln**: Immer `git status` prüfen ob uncommitted changes vorhanden sind
- **Bei Änderungen**: Entweder committen oder mit `git stash` temporär speichern
- **Remote Updates**: `git pull` um neueste Änderungen zu holen

## Dein aktueller Stand
Du bist vermutlich auf `security-fixes` Branch. Um zu `master` zu wechseln:

```bash
git checkout master
git pull origin master
```

## Schnell-Referenz

| Befehl | Beschreibung |
|--------|--------------|
| `git branch` | Zeigt alle lokalen Branches |
| `git checkout master` | Wechselt zu master Branch |
| `git checkout security-fixes` | Wechselt zu security-fixes Branch |
| `git status` | Zeigt aktuellen Branch und Status |
| `git stash` | Speichert Änderungen temporär |
| `git stash pop` | Holt gestashte Änderungen zurück |
| `git pull` | Holt neueste Änderungen vom Remote |