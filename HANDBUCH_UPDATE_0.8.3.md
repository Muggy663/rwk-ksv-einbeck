# Handbuch-Update für Version 0.8.3

## Neue Funktionen in Version 0.8.3

### Technische Verbesserungen und Optimierungen

Mit Version 0.8.3 wurden umfangreiche technische Verbesserungen vorgenommen:

- **TypeScript-Migration**: Mehrere JavaScript-Dateien wurden zu TypeScript migriert, was die Codequalität und Typsicherheit verbessert
- **Codeoptimierung**: Unnötige Dateien und Duplikate wurden entfernt
- **Verbesserte Leistung**: Optimierte Datenverarbeitung für schnellere Ladezeiten
- **Reduzierte Projektgröße**: Entfernung ungenutzter Dateien und Ressourcen

### "Außer Konkurrenz"-Funktion

Mit der Version 0.8.3 wurde eine neue Funktion eingeführt, die es ermöglicht, Teams als "außer Konkurrenz" zu kennzeichnen. Diese Funktion ist besonders nützlich für:

- Gastmannschaften, die nicht offiziell zur Liga gehören
- Teams, die bestimmte Voraussetzungen nicht erfüllen
- Testmannschaften oder Übungsteams

#### Für Administratoren

Als Administrator können Sie Teams als "außer Konkurrenz" markieren:

1. Navigieren Sie zur Mannschaftsverwaltung im Admin-Bereich
2. Wählen Sie ein Team zum Bearbeiten aus oder erstellen Sie ein neues Team
3. Aktivieren Sie die Option "Außer Konkurrenz"
4. Geben Sie optional einen Grund an (z.B. "Gastmannschaft")
5. Speichern Sie die Änderungen

#### Für Benutzer

Teams, die als "außer Konkurrenz" markiert sind, werden in den Ligatabellen und Ranglisten speziell gekennzeichnet. Diese Teams nehmen zwar an den Wettkämpfen teil, ihre Ergebnisse fließen jedoch nicht in die offizielle Wertung ein.

In den Tabellen erkennen Sie diese Teams an:
- Einer "AK"-Kennzeichnung anstelle eines Rangplatzes
- Einem "AK"-Symbol neben dem Teamnamen
- Einem Hinweis beim Überfahren mit der Maus

### Filterfunktion für "Außer Konkurrenz"-Teams

Mit der neuen Filterfunktion können Sie Teams und Schützen "außer Konkurrenz" ein- oder ausblenden:

1. In der RWK-Tabellen-Ansicht finden Sie eine Checkbox "Teams 'Außer Konkurrenz' anzeigen"
2. In der Einzelschützen-Ansicht finden Sie eine Checkbox "Schützen 'Außer Konkurrenz' anzeigen"
3. Die Filtereinstellungen werden im lokalen Speicher gespeichert und bleiben auch nach einem Neuladen der Seite erhalten
4. Die Filtereinstellungen werden auch in der URL gespeichert, sodass Sie Links mit bestimmten Filtereinstellungen teilen können

#### Tastaturkürzel

Für schnellen Zugriff auf die Filterfunktionen wurden Tastaturkürzel eingerichtet:
- `Alt+A`: Teams "außer Konkurrenz" ein-/ausblenden
- `Alt+S`: Schützen "außer Konkurrenz" ein-/ausblenden

### Korrekte Rangberechnung

Die Rangberechnung wurde angepasst, um den "Außer Konkurrenz"-Status zu berücksichtigen:

- Teams "außer Konkurrenz" erhalten keinen offiziellen Rangplatz
- In der Tabelle wird statt eines Rangplatzes "AK" angezeigt
- Die Rangplätze der regulären Teams werden korrekt berechnet, ohne Teams "außer Konkurrenz" zu berücksichtigen
- Gleiches gilt für die Einzelschützen-Rangliste

## Bekannte Probleme und Lösungen

### Problem: Filtereinstellungen werden nicht gespeichert

**Lösung**: Stellen Sie sicher, dass Cookies und lokaler Speicher in Ihrem Browser aktiviert sind. Falls das Problem weiterhin besteht, löschen Sie den Browser-Cache und versuchen Sie es erneut.

### Problem: Tastaturkürzel funktionieren nicht

**Lösung**: Einige Browser oder Erweiterungen können Tastaturkürzel blockieren. Überprüfen Sie Ihre Browser-Einstellungen oder deaktivieren Sie temporär Erweiterungen, die Tastaturkürzel beeinflussen könnten.

## Kontakt und Support

Bei Fragen oder Problemen mit den neuen Funktionen wenden Sie sich bitte an:

- E-Mail: support@rwk-einbeck.de
- Support-Formular: Über den "Support"-Link in der Anwendung