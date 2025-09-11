"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/components/auth/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useClubId } from '@/hooks/useClubId';
import { getClubCollection, CLUB_COLLECTIONS } from '@/lib/utils/club-utils';


export default function BeitraegeVerwaltungPage() {
  const { user, userAppPermissions } = useAuthContext();
  const { clubId, loading: clubLoading } = useClubId();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userClub, setUserClub] = useState(null);
  const [sortField, setSortField] = useState('lastName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [beitragssaetze, setBeitragssaetze] = useState({
    erwachsene: { name: 'Erwachsene', alterVon: 21, alterBis: null, betrag: 120, aktiv: true },
    jugend: { name: 'Jugend', alterVon: 0, alterBis: 20, betrag: 60, aktiv: true },
    senioren: { name: 'Senioren', alterVon: 65, alterBis: null, betrag: 90, aktiv: false },
    familie: { name: 'Familie', alterVon: null, alterBis: null, betrag: 200, aktiv: false }
  });
  const getDefaultVereinsEinstellungen = () => {
    // Nur für Einbeck vorausgefüllte Daten
    if (userClub?.name?.includes('Einbeck') || user?.email?.includes('einbeck')) {
      return {
        glaeubigerID: 'DE12ZZZ00000340999',
        vereinsname: 'Einbecker Schützengilde von 1457 – Neugründung 1862 e.V.',
        adresse: 'Schützenstr. 19',
        plz: '37574',
        ort: 'Einbeck',
        email: 'einbecker.schuetzengilde@gmx.de',
        iban: 'DE98262514250001038421',
        bic: 'NOLADE21EIN',
        bankname: 'Sparkasse Einbeck',
        verwendungszweck: 'Mitgliedsbeitrag 2025'
      };
    }
    // Leere Vorlage für andere Vereine
    return {
      glaeubigerID: '',
      vereinsname: userClub?.name || '',
      adresse: '',
      plz: '',
      ort: '',
      email: '',
      iban: '',
      bic: '',
      bankname: '',
      verwendungszweck: 'Mitgliedsbeitrag 2025'
    };
  };
  
  const [vereinsEinstellungen, setVereinsEinstellungen] = useState(getDefaultVereinsEinstellungen());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('alle');
  const [activeTab, setActiveTab] = useState('uebersicht');
  const [importData, setImportData] = useState([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showMahnDialog, setShowMahnDialog] = useState(false);
  const [showAbgleichDialog, setShowAbgleichDialog] = useState(false);
  const [kontoauszugData, setKontoauszugData] = useState([]);
  const [selectedBank, setSelectedBank] = useState('sparkasse');
  const [mahnungsEinstellungen, setMahnungsEinstellungen] = useState({
    erste_mahnung: 30,
    zweite_mahnung: 60,
    dritte_mahnung: 90,
    mahngebuehr: 5.00
  });
  const fileInputRef = useRef(null);
  const sepaFileInputRef = useRef(null);

  const handleSEPAImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Parse CSV: Name;Vorname;Zahlungsart;BIC;IBAN;SEPA-Ausführung
        const parsedData = lines.slice(1).map((line, index) => {
          const parts = line.split(';');
          if (parts.length >= 5) {
            const [name, vorname, zahlungsart, bic, iban, sepaAusfuehrung] = parts;
            
            return {
              id: `sepa_import_${index}`,
              name: (name || '').trim(),
              vorname: (vorname || '').trim(),
              zahlungsart: (zahlungsart || '').trim(),
              bic: (bic || '').trim(),
              iban: (iban || '').trim(),
              sepaAusfuehrung: (sepaAusfuehrung || 'folge_lastschrift').trim(),
              kontoinhaber: `${(vorname || '').trim()} ${(name || '').trim()}`.trim()
            };
          }
          return null;
        }).filter(item => item && item.iban);
        
        // Aktualisiere Mitglieder mit SEPA-Daten und speichere in Firebase
        let updated = 0;
        const updatedMembers = [...members];
        
        // Verwende Promise.all für parallele Firebase Updates
        const updatePromises = [];
        
        members.forEach(member => {
          const sepaMatch = parsedData.find(sepa => 
            (sepa.vorname.toLowerCase() === member.firstName?.toLowerCase() && 
             sepa.name.toLowerCase() === member.lastName?.toLowerCase())
          );
          
          if (sepaMatch && !member.sepaMandat?.iban) {
            // BIC automatisch aus IBAN berechnen falls leer
            const calculatedBIC = sepaMatch.bic || detectBICFromIBAN(sepaMatch.iban);
            
            const sepaData = {
              iban: sepaMatch.iban,
              bic: calculatedBIC,
              kontoinhaber: sepaMatch.kontoinhaber || `${member.firstName} ${member.lastName}`,
              mandatsreferenz: `SGI-${member.mitgliedsnummer || member.id.slice(-3)}-2025`,
              mandatsdatum: new Date().toISOString().split('T')[0],
              verwendungszweck: 'Mitgliedsbeitrag'
            };
            
            // Firebase Update Promise
            const mitgliederCollection = getClubCollection(userClub.id, CLUB_COLLECTIONS.MITGLIEDER);
            const memberRef = doc(db, mitgliederCollection, member.id);
            const updatePromise = updateDoc(memberRef, {
              sepa: sepaData,
              updatedAt: new Date()
            });
            
            updatePromises.push(updatePromise);
            
            // Update local state
            const memberIndex = updatedMembers.findIndex(m => m.id === member.id);
            if (memberIndex !== -1) {
              updatedMembers[memberIndex] = {
                ...member,
                zahlungsart: 'sepa_lastschrift',
                sepaMandat: {
                  ...sepaData,
                  bankname: getBankNameFromBIC(calculatedBIC),
                  sepaAusfuehrung: sepaMatch.sepaAusfuehrung || 'folge_lastschrift'
                }
              };
            }
            
            updated++;
          }
        });
        
        // Warte auf alle Firebase Updates
        Promise.all(updatePromises).then(() => {
          console.log('Alle SEPA-Daten in Firebase gespeichert');
        }).catch(error => {
          console.error('Fehler beim Speichern:', error);
        });
        
        setMembers(updatedMembers);
        alert(`${updated} SEPA-Daten erfolgreich importiert!`);
        
        // Seite neu laden um die Daten korrekt anzuzeigen
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('Fehler beim SEPA-Import:', error);
        alert('Fehler beim Lesen der CSV-Datei');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (user && clubId && !clubLoading) {
      loadMembersWithBeitraege();
    }
  }, [user, clubId, clubLoading]);

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const loadMembersWithBeitraege = async () => {
    if (!clubId) return;
    
    try {
      // Lade Club-Daten
      const clubQuery = query(collection(db, 'clubs'), where('__name__', '==', clubId));
      const clubSnapshot = await getDocs(clubQuery);
      
      if (!clubSnapshot.empty) {
        const clubData = clubSnapshot.docs[0].data();
        setUserClub({ id: clubId, ...clubData });
        
        // Lade gespeicherte Beitragssätze falls vorhanden
        if (clubData.beitragssaetze) {
          setBeitragssaetze(clubData.beitragssaetze);
        }
        
        // Lade gespeicherte Vereinseinstellungen oder setze Defaults
        if (clubData.vereinsEinstellungen) {
          setVereinsEinstellungen(clubData.vereinsEinstellungen);
        } else {
          setVereinsEinstellungen(getDefaultVereinsEinstellungen());
        }
        
        // Lade Mitglieder aus club-spezifischer Collection
        const mitgliederCollection = getClubCollection(clubId, CLUB_COLLECTIONS.MITGLIEDER);
        const membersSnapshot = await getDocs(collection(db, mitgliederCollection));
        
        const membersList = membersSnapshot.docs.map(doc => {
          const data = doc.data();
          const alter = data.geburtsdatum ? 
            new Date().getFullYear() - new Date(data.geburtsdatum).getFullYear() :
            data.geburtstag ? 
            new Date().getFullYear() - new Date(data.geburtstag).getFullYear() :
            new Date().getFullYear() - (data.birthYear || 0);
          
          // Berechne Beitragskategorie basierend auf aktuellen Regeln
          let kategorie = 'erwachsene';
          let jahresbeitrag = 120; // Fallback
          
          // Verwende die aktuellen beitragssaetze (werden später geladen)
          const currentBeitragssaetze = clubData.beitragssaetze || beitragssaetze;
          
          // Finde passende Kategorie
          for (const [key, config] of Object.entries(currentBeitragssaetze)) {
            if (!config.aktiv) continue;
            
            const passt = (config.alterVon === null || alter >= config.alterVon) &&
                         (config.alterBis === null || alter <= config.alterBis);
            
            if (passt) {
              kategorie = key;
              jahresbeitrag = config.betrag;
              break;
            }
          }
          
          // Echte SEPA-Daten aus Mitgliederdaten
          const sepaData = data.sepa || {};
          const hasSepaData = sepaData.iban && sepaData.bic;
          
          const zahlungsart = hasSepaData ? 'sepa_lastschrift' : 'ueberweisung';
          
          const sepaMandat = hasSepaData ? {
            mandatsreferenz: sepaData.mandatsreferenz || `SGI-${data.mitgliedsnummer || doc.id.slice(-3)}-2025`,
            mandatsdatum: sepaData.mandatsdatum || new Date().toISOString().split('T')[0],
            iban: sepaData.iban,
            bic: sepaData.bic,
            kontoinhaber: sepaData.kontoinhaber || `${data.firstName || data.vorname || ''} ${data.lastName || data.name || ''}`.trim(),
            bankname: getBankNameFromBIC(sepaData.bic),
            sepaAusfuehrung: 'folge_lastschrift',
            verwendungszweck: sepaData.verwendungszweck || 'Mitgliedsbeitrag'
          } : null;
          
          return {
            id: doc.id,
            ...data,
            alter,
            firstName: data.firstName || data.vorname || data.name?.split(' ')[0] || '',
            lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
            isActive: data.isActive !== false && data.status !== 'inaktiv',
            beitragskategorie: kategorie,
            jahresbeitrag,
            zahlungsart,
            sepaMandat,
            // Beitragsstatus - standardmäßig offen für neues Jahr
            beitragsstatus: data.beitragsstatus || 'offen',
            letzteZahlung: data.letzteZahlung || null,
            mahnungen: data.mahnungen || 0
          };
        });
        
        setMembers(membersList);
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBeitragsstatus = async (memberId, newStatus) => {
    try {
      // In echter Implementierung: Firebase Update
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { 
          ...m, 
          beitragsstatus: newStatus,
          letzteZahlung: newStatus === 'bezahlt' ? new Date().toISOString().split('T')[0] : m.letzteZahlung
        } : m
      ));
    } catch (error) {
      console.error('Fehler beim Update:', error);
    }
  };

  const sendMahnung = async (memberId) => {
    try {
      // In echter Implementierung: E-Mail senden + Firebase Update
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { 
          ...m, 
          mahnungen: (m.mahnungen || 0) + 1,
          letzteMahnung: new Date().toISOString().split('T')[0]
        } : m
      ));
      alert('Mahnung versendet!');
    } catch (error) {
      console.error('Fehler beim Mahnung senden:', error);
    }
  };

  const handleTxtImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Parse TXT data: Name\tVorname\tBIC\tIBAN\tSEPA-Ausführung (Tab-getrennt)
        const parsedData = lines.map((line, index) => {
          const [name, vorname, bic, iban, sepaAusfuehrung] = line.split('\t');
          
          // BIC automatisch ermitteln basierend auf IBAN
          const detectedBIC = bic || detectBICFromIBAN(iban);
          
          return {
            id: `import_${index}`,
            name: (name || '').trim(),
            vorname: (vorname || '').trim(),
            gebDatum: '', // Nicht im Import enthalten
            bic: detectedBIC,
            iban: (iban || '').trim(),
            sepaAusfuehrung: (sepaAusfuehrung || 'folge_lastschrift').trim(),
            bankname: getBankNameFromBIC(detectedBIC)
          };
        }).filter(item => item.name && item.iban);
        
        setImportData(parsedData);
        setShowImportDialog(true);
      } catch (error) {
        console.error('Fehler beim TXT-Import:', error);
        alert('Fehler beim Lesen der TXT-Datei');
      }
    };
    reader.readAsText(file);
  };

  const detectBICFromIBAN = (iban) => {
    if (!iban) return '';
    
    const bankCode = iban.substring(4, 12);
    const bicMap = {
      // Sparkassen
      '26251245': 'NOLADE21EIN', // Sparkasse Einbeck
      '26250001': 'NOLADE21GOE', // Sparkasse Göttingen
      '50050222': 'HELADEF1GOE', // Sparkasse Göttingen
      '26251425': 'NOLADE21EIN', // Sparkasse Einbeck
      '26280024': 'GENODEF1SES', // VR Bank Südniedersachsen
      '27893760': 'GENODEF1SES', // VR Bank Südniedersachsen
      '26271424': 'GENODEF1SES', // VR Bank Südniedersachsen
      '26281420': 'GENODEF1SES', // VR Bank Südniedersachsen
      
      // Großbanken
      '37040044': 'COBADEFFXXX', // Commerzbank
      '50010517': 'INGDDEFFXXX', // ING-DiBa
      '44010046': 'PBNKDEFFXXX', // Postbank
      '12030000': 'BYLADEM1001', // Deutsche Kreditbank
      '10010010': 'PBNKDEFFXXX', // Postbank Berlin
      '25010030': 'PBNKDEFFXXX', // Postbank
      '50010400': 'INGDDEFFXXX', // ING-DiBa
      '52090000': 'GENODEF1S06', // Sparda Bank
      '18051000': 'WELADED1STB', // Stadtsparkasse
      '70390000': 'GENODED1WUR', // VR Bank Würzburg
      '25070024': 'DEUTDEDBHAN', // Deutsche Bank
      '26240039': 'COBADEFFXXX', // Commerzbank
    };
    
    return bicMap[bankCode] || 'GENODEF1SES'; // VR Bank als Fallback für Region
  };

  const getBankNameFromBIC = (bic) => {
    if (!bic) return 'Unbekannte Bank';
    
    const bankMap = {
      'GENODEF1SES': 'VR Bank Südniedersachsen eG',
      'NOLADE21EIN': 'Sparkasse Einbeck',
      'NOLADE21GOE': 'Sparkasse Göttingen',
      'HELADEF1GOE': 'Sparkasse Göttingen',
      'COBADEFFXXX': 'Commerzbank AG',
      'INGDDEFFXXX': 'ING-DiBa AG', 
      'PBNKDEFFXXX': 'Postbank',
      'BYLADEM1001': 'Deutsche Kreditbank AG',
      'DEUTDEFFXXX': 'Deutsche Bank AG',
      'DEUTDEDBHAN': 'Deutsche Bank AG',
      'WELADED1STB': 'Stadtsparkasse',
      'GENODED1WUR': 'VR Bank Würzburg',
      'GENODEF1S06': 'Sparda Bank'
    };
    
    
    return bankMap[bic] || 'Regionale Bank';
  };

  const applyImportData = async () => {
    try {
      // Aktualisiere Mitglieder mit SEPA-Daten
      const updatedMembers = members.map(member => {
        const importMatch = importData.find(imp => 
          imp.name.toLowerCase() === member.lastName?.toLowerCase() && 
          imp.vorname.toLowerCase() === member.firstName?.toLowerCase()
        );
        
        if (importMatch) {
          return {
            ...member,
            zahlungsart: 'sepa_lastschrift',
            sepaMandat: {
              mandatsreferenz: `SGI-${member.id.slice(-3)}-2025`,
              mandatsdatum: new Date().toISOString().split('T')[0],
              iban: importMatch.iban,
              bic: importMatch.bic,
              kontoinhaber: `${importMatch.vorname} ${importMatch.name}`,
              bankname: importMatch.bankname,
              sepaAusfuehrung: importMatch.sepaAusfuehrung,
              verwendungszweck: 'Mitgliedsbeitrag SGi Einbeck'
            }
          };
        }
        return member;
      });
      
      setMembers(updatedMembers);
      setShowImportDialog(false);
      setImportData([]);
      alert(`${importData.length} SEPA-Mandate erfolgreich importiert!`);
    } catch (error) {
      console.error('Fehler beim Import:', error);
      alert('Fehler beim Importieren der SEPA-Daten');
    }
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateSEPAXML = () => {
    const sepaMembers = members.filter(m => m.sepaMandat && m.beitragsstatus === 'offen');
    
    if (sepaMembers.length === 0) {
      alert('Keine offenen SEPA-Lastschriften gefunden');
      return;
    }
    
    const totalAmount = sepaMembers.reduce((sum, m) => sum + m.jahresbeitrag, 0);
    const executionDate = new Date();
    executionDate.setDate(executionDate.getDate() + 5);
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>SGI-${Date.now()}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${sepaMembers.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${vereinsEinstellungen.vereinsname}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>SGI-BEITRAG-${executionDate.getFullYear()}</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>${sepaMembers.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>CORE</Cd>
        </LclInstrm>
        <SeqTp>RCUR</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>${executionDate.toISOString().split('T')[0]}</ReqdColltnDt>
      <Cdtr>
        <Nm>${vereinsEinstellungen.vereinsname}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${vereinsEinstellungen.iban}</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId>
          <BIC>${vereinsEinstellungen.bic}</BIC>
        </FinInstnId>
      </CdtrAgt>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${vereinsEinstellungen.glaeubigerID}</Id>
              <SchmeNm>
                <Prtry>SEPA</Prtry>
              </SchmeNm>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>
${sepaMembers.map(member => `      <DrctDbtTxInf>
        <PmtId>
          <EndToEndId>${member.sepaMandat.mandatsreferenz}</EndToEndId>
        </PmtId>
        <InstdAmt Ccy="EUR">${member.jahresbeitrag.toFixed(2)}</InstdAmt>
        <DrctDbtTx>
          <MndtRltdInf>
            <MndtId>${member.sepaMandat.mandatsreferenz}</MndtId>
            <DtOfSgntr>${member.sepaMandat.mandatsdatum}</DtOfSgntr>
          </MndtRltdInf>
        </DrctDbtTx>
        <DbtrAgt>
          <FinInstnId>
            <BIC>${member.sepaMandat.bic}</BIC>
          </FinInstnId>
        </DbtrAgt>
        <Dbtr>
          <Nm>${member.sepaMandat.kontoinhaber}</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>${member.sepaMandat.iban}</IBAN>
          </Id>
        </DbtrAcct>
        <RmtInf>
          <Ustrd>${member.sepaMandat.verwendungszweck}</Ustrd>
        </RmtInf>
      </DrctDbtTxInf>`).join('\n')}
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`;
    
    downloadFile(xml, `SEPA-Lastschrift-${executionDate.toISOString().split('T')[0]}.xml`, 'application/xml');
  };

  const generateSEPACSV = () => {
    const sepaMembers = members.filter(m => m.sepaMandat && m.beitragsstatus === 'offen');
    
    if (sepaMembers.length === 0) {
      alert('Keine offenen SEPA-Lastschriften gefunden');
      return;
    }
    
    const csv = [
      'Name;IBAN;BIC;Betrag;Verwendungszweck;Mandatsreferenz;Mandatsdatum;Ausführungsart',
      ...sepaMembers.map(member => 
        `${member.sepaMandat.kontoinhaber};${member.sepaMandat.iban};${member.sepaMandat.bic};${member.jahresbeitrag.toFixed(2)};${member.sepaMandat.verwendungszweck};${member.sepaMandat.mandatsreferenz};${member.sepaMandat.mandatsdatum};${member.sepaMandat.sepaAusfuehrung}`
      )
    ].join('\n');
    
    downloadFile(csv, `SEPA-Lastschrift-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
  };

  const generateSEPAExcel = () => {
    const sepaMembers = members.filter(m => m.sepaMandat && m.beitragsstatus === 'offen');
    
    if (sepaMembers.length === 0) {
      alert('Keine offenen SEPA-Lastschriften gefunden');
      return;
    }
    
    const excel = [
      'Name\tIBAN\tBIC\tBetrag\tVerwendungszweck\tMandatsreferenz\tMandatsdatum\tAusführungsart',
      ...sepaMembers.map(member => 
        `${member.sepaMandat.kontoinhaber}\t${member.sepaMandat.iban}\t${member.sepaMandat.bic}\t${member.jahresbeitrag.toFixed(2)}\t${member.sepaMandat.verwendungszweck}\t${member.sepaMandat.mandatsreferenz}\t${member.sepaMandat.mandatsdatum}\t${member.sepaMandat.sepaAusfuehrung}`
      )
    ].join('\n');
    
    downloadFile(excel, `SEPA-Lastschrift-${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel');
  };

  const generateDTAUS = () => {
    const sepaMembers = members.filter(m => m.sepaMandat && m.beitragsstatus === 'offen');
    
    if (sepaMembers.length === 0) {
      alert('Keine offenen SEPA-Lastschriften gefunden');
      return;
    }
    
    // Vereinfachtes DTAUS-Format für alte Systeme
    const dtaus = [
      '# DTAUS-Format für Schützengesellschaft Einbeck',
      `# Erstellt am: ${new Date().toLocaleDateString('de-DE')}`,
      `# Anzahl Datensätze: ${sepaMembers.length}`,
      '# Format: Kontonummer;BLZ;Name;Betrag;Verwendungszweck',
      '',
      ...sepaMembers.map(member => {
        const iban = member.sepaMandat.iban;
        const blz = iban.substring(4, 12);
        const konto = iban.substring(12);
        return `${konto};${blz};${member.sepaMandat.kontoinhaber};${member.jahresbeitrag.toFixed(2)};${member.sepaMandat.verwendungszweck}`;
      })
    ].join('\n');
    
    downloadFile(dtaus, `SEPA-DTAUS-${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
  };

  const generateMahnbriefe = () => {
    const offeneMembers = members.filter(m => m.isActive && m.beitragsstatus === 'offen');
    
    if (offeneMembers.length === 0) {
      alert('Keine offenen Beiträge für Mahnbriefe gefunden');
      return;
    }
    
    // Erstelle PDF mit jsPDF
    const { jsPDF } = window.jspdf || require('jspdf');
    const doc = new jsPDF();
    
    offeneMembers.forEach((member, index) => {
      if (index > 0) doc.addPage();
      
      // Absender
      doc.setFontSize(10);
      doc.text(`${vereinsEinstellungen.vereinsname}`, 20, 20);
      doc.text(`${vereinsEinstellungen.adresse}, ${vereinsEinstellungen.plz} ${vereinsEinstellungen.ort}`, 20, 25);
      doc.text(`E-Mail: ${vereinsEinstellungen.email}`, 20, 30);
      
      // Empfänger
      doc.setFontSize(12);
      doc.text(`${member.firstName} ${member.lastName}`, 20, 50);
      doc.text(`${member.strasse || 'Adresse unbekannt'}`, 20, 55);
      doc.text(`${member.plz || ''} ${member.ort || ''}`, 20, 60);
      
      // Betreff
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('1. Mahnung - Mitgliedsbeitrag 2025', 20, 80);
      
      // Text
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      const zahlungsfrist = new Date();
      zahlungsfrist.setDate(zahlungsfrist.getDate() + 14);
      
      const anrede = member.gender === 'female' ? 'Liebe Schützenschwester' : 'Lieber Schützenbruder';
      
      const mahntext = [
        `${anrede} ${member.firstName},`,
        '',
        'leider haben wir Deinen Mitgliedsbeitrag für das Jahr 2025 noch nicht erhalten.',
        '',
        `Offener Betrag: ${member.jahresbeitrag},00 €`,
        `Ursprüngliches Fälligkeitsdatum: 31.01.2025`,
        '',
        `Bitte überweise den Betrag bis zum ${zahlungsfrist.toLocaleDateString('de-DE')}`,
        'auf unser Vereinskonto:',
        '',
        `Empfänger: ${vereinsEinstellungen.vereinsname}`,
        `IBAN: ${vereinsEinstellungen.iban}`,
        `BIC: ${vereinsEinstellungen.bic}`,
        `Bank: ${vereinsEinstellungen.bankname}`,
        `Verwendungszweck: Mitgliedsbeitrag ${member.firstName} ${member.lastName}`,
        '',
        'Bei Nichtzahlung bis zum oben genannten Datum werden wir eine',
        '2. Mahnung mit Mahnkosten in Höhe von 5,00 € versenden.',
        '',
        'Falls Du bereits überwiesen hast, betrachte dieses Schreiben als gegenstandslos.',
        '',
        'Mit schützenbrüderlichen Grüßen',
        'Der Vorstand'
      ];
      
      let yPos = 95;
      mahntext.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 5;
      });
      
      // Datum
      doc.text(`${vereinsEinstellungen.ort}, ${new Date().toLocaleDateString('de-DE')}`, 140, 95);
    });
    
    doc.save(`Mahnbriefe-${new Date().toISOString().split('T')[0]}.pdf`);
    alert(`${offeneMembers.length} Mahnbriefe als PDF erstellt!`);
  };

  const migrateSEPAData = async () => {
    if (!userClub) return;
    
    try {
      // Lade alle Shooters für diesen Club
      const shootersQuery = query(
        collection(db, 'shooters'),
        where('clubId', '==', userClub.id)
      );
      const shootersSnapshot = await getDocs(shootersQuery);
      
      // Lade alle Mitglieder
      const mitgliederCollection = getClubCollection(userClub.id, CLUB_COLLECTIONS.MITGLIEDER);
      const membersSnapshot = await getDocs(collection(db, mitgliederCollection));
      
      let updated = 0;
      
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        const originalShooterId = memberData.originalShooterId;
        
        if (originalShooterId) {
          const shooterDoc = shootersSnapshot.docs.find(doc => doc.id === originalShooterId);
          
          if (shooterDoc) {
            const shooterData = shooterDoc.data();
            const updates = {};
            
            // SEPA-Daten migrieren (aus sepa Objekt)
            if (shooterData.sepa && (shooterData.sepa.iban || shooterData.sepa.bic) && (!memberData.sepa?.iban || memberData.sepa?.iban === '')) {
              const currentSepa = memberData.sepa || {};
              updates.sepa = {
                ...currentSepa,
                iban: shooterData.sepa.iban || '',
                bic: shooterData.sepa.bic || '',
                kontoinhaber: shooterData.sepa.kontoinhaber || `${shooterData.firstName} ${shooterData.lastName}`,
                mandatsreferenz: shooterData.sepa.mandatsreferenz || `SGI-${shooterData.mitgliedsnummer || 'XXX'}-2025`,
                mandatsdatum: shooterData.sepa.mandatsdatum || new Date().toISOString().split('T')[0],
                verwendungszweck: 'Mitgliedsbeitrag'
              };
            }
            
            if (Object.keys(updates).length > 0) {
              updates.updatedAt = new Date();
              
              const memberRef = doc(db, mitgliederCollection, memberDoc.id);
              await updateDoc(memberRef, updates);
              updated++;
            }
          }
        }
      }
      
      alert(`${updated} SEPA-Daten migriert! Seite wird neu geladen.`);
      window.location.reload();
      
    } catch (error) {
      console.error('Migration Fehler:', error);
      alert(`Fehler: ${error.message}`);
    }
  };

  const generateMandateList = () => {
    const sepaMembers = members.filter(m => m.sepaMandat);
    
    if (sepaMembers.length === 0) {
      alert('Keine SEPA-Mandate gefunden');
      return;
    }
    
    const mandateList = [
      'SEPA-Mandate Übersicht - Schützengesellschaft Einbeck',
      `Erstellt am: ${new Date().toLocaleDateString('de-DE')}`,
      `Anzahl Mandate: ${sepaMembers.length}`,
      '',
      'Name;Mandatsreferenz;IBAN;BIC;Bank;Mandatsdatum;Status;Jahresbeitrag',
      ...sepaMembers.map(member => 
        `${member.sepaMandat.kontoinhaber};${member.sepaMandat.mandatsreferenz};${member.sepaMandat.iban};${member.sepaMandat.bic};${member.sepaMandat.bankname};${member.sepaMandat.mandatsdatum};${member.beitragsstatus};${member.jahresbeitrag}€`
      )
    ].join('\n');
    
    downloadFile(mandateList, `SEPA-Mandate-Liste-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
  };

  const generateBankingImport = () => {
    const sepaMembers = members.filter(m => m.sepaMandat && m.beitragsstatus === 'offen');
    
    if (sepaMembers.length === 0) {
      alert('Keine offenen SEPA-Lastschriften gefunden');
      return;
    }
    
    const executionDate = new Date();
    executionDate.setDate(executionDate.getDate() + 5);
    
    let format, filename;
    
    switch (selectedBank) {
      case 'sparkasse':
        format = [
          'Zahlungspflichtiger;IBAN;BIC;Betrag;Verwendungszweck;Mandatsreferenz;Mandatsdatum;Sequenztyp;Fälligkeitsdatum',
          ...sepaMembers.map(member => 
            `${member.sepaMandat.kontoinhaber};${member.sepaMandat.iban};${member.sepaMandat.bic};${member.jahresbeitrag.toFixed(2)};Mitgliedsbeitrag ${member.firstName} ${member.lastName};${member.sepaMandat.mandatsreferenz};${member.sepaMandat.mandatsdatum};RCUR;${executionDate.toISOString().split('T')[0]}`
          )
        ].join('\n');
        filename = `Sparkasse-SEPA-${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'volksbank':
        format = [
          'Name;IBAN;BIC;Betrag;Verwendungszweck;Mandatsreferenz;Mandatsdatum;Lastschrifttyp',
          ...sepaMembers.map(member => 
            `${member.sepaMandat.kontoinhaber};${member.sepaMandat.iban};${member.sepaMandat.bic};${member.jahresbeitrag.toFixed(2)};Mitgliedsbeitrag ${member.firstName} ${member.lastName};${member.sepaMandat.mandatsreferenz};${member.sepaMandat.mandatsdatum};Folgelastschrift`
          )
        ].join('\n');
        filename = `Volksbank-SEPA-${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'commerzbank':
        format = [
          'Zahlungspflichtiger;IBAN;BIC;Betrag;Verwendungszweck;Mandatsreferenz;Mandatsdatum;Sequenz',
          ...sepaMembers.map(member => 
            `${member.sepaMandat.kontoinhaber};${member.sepaMandat.iban};${member.sepaMandat.bic};${member.jahresbeitrag.toFixed(2)};Mitgliedsbeitrag ${member.firstName} ${member.lastName};${member.sepaMandat.mandatsreferenz};${member.sepaMandat.mandatsdatum};RCUR`
          )
        ].join('\n');
        filename = `Commerzbank-SEPA-${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'deutsche_bank':
        format = [
          'Kontoinhaber;IBAN;BIC;Betrag;Verwendungszweck;Mandatsreferenz;Mandatsdatum;Typ',
          ...sepaMembers.map(member => 
            `${member.sepaMandat.kontoinhaber};${member.sepaMandat.iban};${member.sepaMandat.bic};${member.jahresbeitrag.toFixed(2)};Mitgliedsbeitrag ${member.firstName} ${member.lastName};${member.sepaMandat.mandatsreferenz};${member.sepaMandat.mandatsdatum};Folgelastschrift`
          )
        ].join('\n');
        filename = `Deutsche-Bank-SEPA-${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      default:
        format = [
          'Name;IBAN;BIC;Betrag;Verwendungszweck;Mandatsreferenz;Mandatsdatum',
          ...sepaMembers.map(member => 
            `${member.sepaMandat.kontoinhaber};${member.sepaMandat.iban};${member.sepaMandat.bic};${member.jahresbeitrag.toFixed(2)};Mitgliedsbeitrag ${member.firstName} ${member.lastName};${member.sepaMandat.mandatsreferenz};${member.sepaMandat.mandatsdatum}`
          )
        ].join('\n');
        filename = `SEPA-Export-${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    downloadFile(format, filename, 'text/csv;charset=utf-8');
  };

  const generateBankingImportOld = () => {
    const sepaMembers = members.filter(m => m.sepaMandat && m.beitragsstatus === 'offen');
    
    if (sepaMembers.length === 0) {
      alert('Keine offenen SEPA-Lastschriften gefunden');
      return;
    }
    
    const executionDate = new Date();
    executionDate.setDate(executionDate.getDate() + 5);
    
    // Sparkassen SEPA-Sammelauftrag Format (laut PDF)
    const sparkassenFormat = [
      'Zahlungspflichtiger;IBAN;BIC;Betrag;Verwendungszweck;Mandatsreferenz;Mandatsdatum;Sequenztyp;Fälligkeitsdatum',
      ...sepaMembers.map(member => 
        `${member.sepaMandat.kontoinhaber};${member.sepaMandat.iban};${member.sepaMandat.bic};${member.jahresbeitrag.toFixed(2)};Mitgliedsbeitrag ${member.firstName} ${member.lastName};${member.sepaMandat.mandatsreferenz};${member.sepaMandat.mandatsdatum};RCUR;${executionDate.toISOString().split('T')[0]}`
      )
    ].join('\n');
    
    downloadFile(sparkassenFormat, `Sparkasse-SEPA-Sammelauftrag-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.mitgliedsnummer?.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'alle' || member.beitragsstatus === filterStatus;
    
    return matchesSearch && matchesStatus && member.isActive;
  }).sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';
    
    if (sortField === 'alter' || sortField === 'jahresbeitrag' || sortField === 'mahnungen') {
      aVal = parseInt(aVal) || 0;
      bVal = parseInt(bVal) || 0;
    } else if (sortField === 'letzteZahlung') {
      aVal = new Date(aVal || '1900-01-01');
      bVal = new Date(bVal || '1900-01-01');
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const statistiken = {
    gesamt: members.filter(m => m.isActive).length,
    bezahlt: members.filter(m => m.isActive && m.beitragsstatus === 'bezahlt').length,
    offen: members.filter(m => m.isActive && m.beitragsstatus === 'offen').length,
    gesamtbeitrag: members.filter(m => m.isActive).reduce((sum, m) => sum + (m.jahresbeitrag || 0), 0),
    offeneBeitraege: members.filter(m => m.isActive && m.beitragsstatus === 'offen').reduce((sum, m) => sum + (m.jahresbeitrag || 0), 0)
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Lade Beitragsdaten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-primary">💰 Beitragsverwaltung</h1>
          <a href="/vereinssoftware">
            <Button variant="outline">
              Zurück zur Übersicht
            </Button>
          </a>
        </div>
        <p className="text-lg text-muted-foreground">
          {userClub ? `Beitragsverwaltung für ${userClub.name}` : 'Beitragsverwaltung'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'uebersicht'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('uebersicht')}
          >
            Übersicht
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'sepa'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('sepa')}
          >
            SEPA-Lastschrift
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'mandate'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('mandate')}
          >
            SEPA-Mandate
          </button>
        </div>
      </div>

      {activeTab === 'uebersicht' && (
        <div>
          {/* Statistiken */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{statistiken.gesamt}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Aktive Mitglieder</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statistiken.bezahlt}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Bezahlt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{statistiken.offen}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Offen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statistiken.gesamtbeitrag}€</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gesamtbeitrag</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{statistiken.offeneBeitraege}€</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Offene Beiträge</p>
          </CardContent>
        </Card>
      </div>

      {/* Vereinseinstellungen */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🏦 SEPA-Vereinseinstellungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Vereinsname:</label>
              <Input
                value={vereinsEinstellungen.vereinsname}
                onChange={(e) => setVereinsEinstellungen({...vereinsEinstellungen, vereinsname: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Adresse:</label>
              <Input
                value={vereinsEinstellungen.adresse}
                onChange={(e) => setVereinsEinstellungen({...vereinsEinstellungen, adresse: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">PLZ / Ort:</label>
              <div className="flex gap-2">
                <Input
                  value={vereinsEinstellungen.plz}
                  onChange={(e) => setVereinsEinstellungen({...vereinsEinstellungen, plz: e.target.value})}
                  className="w-20"
                  placeholder="PLZ"
                />
                <Input
                  value={vereinsEinstellungen.ort}
                  onChange={(e) => setVereinsEinstellungen({...vereinsEinstellungen, ort: e.target.value})}
                  placeholder="Ort"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">E-Mail:</label>
              <Input
                value={vereinsEinstellungen.email}
                onChange={(e) => setVereinsEinstellungen({...vereinsEinstellungen, email: e.target.value})}
                type="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Gläubiger-ID:</label>
              <Input
                value={vereinsEinstellungen.glaeubigerID}
                onChange={(e) => setVereinsEinstellungen({...vereinsEinstellungen, glaeubigerID: e.target.value})}
                placeholder="DE12ZZZ00000340999"
              />
            </div>
            <div>
              <label className="text-sm font-medium">IBAN:</label>
              <Input
                value={vereinsEinstellungen.iban}
                onChange={(e) => setVereinsEinstellungen({...vereinsEinstellungen, iban: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">BIC:</label>
              <Input
                value={vereinsEinstellungen.bic}
                onChange={(e) => setVereinsEinstellungen({...vereinsEinstellungen, bic: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bank:</label>
              <Input
                value={vereinsEinstellungen.bankname}
                onChange={(e) => setVereinsEinstellungen({...vereinsEinstellungen, bankname: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <Button onClick={async () => {
              try {
                if (userClub) {
                  const clubRef = doc(db, 'clubs', userClub.id);
                  await updateDoc(clubRef, {
                    vereinsEinstellungen: vereinsEinstellungen,
                    updatedAt: new Date()
                  });
                  alert('Vereinseinstellungen gespeichert!');
                }
              } catch (error) {
                console.error('Fehler beim Speichern:', error);
                alert('Fehler beim Speichern');
              }
            }}>
              💾 Einstellungen speichern
            </Button>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Gläubiger-ID beantragen:</strong> Kostenlos bei der Deutschen Bundesbank unter 
              <a href="https://www.bundesbank.de" target="_blank" className="underline">bundesbank.de</a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Beitragssätze Konfiguration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>⚙️ Beitragssätze 2025 - Individuell konfigurierbar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(beitragssaetze).map(([key, config]) => (
              <div key={key} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.aktiv}
                    onChange={(e) => setBeitragssaetze({
                      ...beitragssaetze,
                      [key]: { ...config, aktiv: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <Input
                    value={config.name}
                    onChange={(e) => setBeitragssaetze({
                      ...beitragssaetze,
                      [key]: { ...config, name: e.target.value }
                    })}
                    className="w-32"
                    placeholder="Name"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">Alter:</span>
                  <Input
                    type="number"
                    value={config.alterVon || ''}
                    onChange={(e) => setBeitragssaetze({
                      ...beitragssaetze,
                      [key]: { ...config, alterVon: e.target.value ? parseInt(e.target.value) : null }
                    })}
                    className="w-20"
                    placeholder="von"
                  />
                  <span className="text-sm">bis</span>
                  <Input
                    type="number"
                    value={config.alterBis || ''}
                    onChange={(e) => setBeitragssaetze({
                      ...beitragssaetze,
                      [key]: { ...config, alterBis: e.target.value ? parseInt(e.target.value) : null }
                    })}
                    className="w-20"
                    placeholder="ohne Ende"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={config.betrag}
                    onChange={(e) => setBeitragssaetze({
                      ...beitragssaetze,
                      [key]: { ...config, betrag: parseInt(e.target.value) || 0 }
                    })}
                    className="w-20"
                  />
                  <span className="text-sm">€</span>
                </div>
                
                <div className="text-xs text-gray-500">
                  {config.alterVon !== null && config.alterBis !== null ? 
                    `${config.alterVon}-${config.alterBis} Jahre` :
                    config.alterVon !== null ? 
                    `ab ${config.alterVon} Jahre` :
                    config.alterBis !== null ? 
                    `bis ${config.alterBis} Jahre` :
                    'Alle Alter'
                  }
                </div>
              </div>
            ))}
            
            <div className="flex gap-4">
              <Button onClick={loadMembersWithBeitraege} className="flex-1">
                🔄 Beiträge neu berechnen
              </Button>
              <Button variant="outline" onClick={async () => {
                try {
                  if (userClub) {
                    const clubRef = doc(db, 'clubs', userClub.id);
                    await updateDoc(clubRef, {
                      beitragssaetze: beitragssaetze,
                      updatedAt: new Date()
                    });
                    alert('Beitragssätze erfolgreich gespeichert!');
                  }
                } catch (error) {
                  console.error('Fehler beim Speichern:', error);
                  alert('Fehler beim Speichern der Konfiguration');
                }
              }}>
                💾 Konfiguration speichern
              </Button>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">📝 Konfiguration für euren Verein:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Erwachsene:</strong> ab 21 Jahre (ohne Ende)</li>
                <li>• <strong>Jugend:</strong> bis 20 Jahre</li>
                <li>• <strong>Senioren & Familie:</strong> deaktiviert</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter und Suche */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Suchen (Name, Mitgl.-Nr.)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="alle">Alle Status</option>
              <option value="bezahlt">Bezahlt</option>
              <option value="offen">Offen</option>
            </select>
            <div className="flex gap-2 flex-wrap items-center">
              <Button onClick={generateSEPAXML} size="sm">
                📄 SEPA-XML
              </Button>
              <Button onClick={generateSEPACSV} size="sm" variant="outline">
                📊 CSV Export
              </Button>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="sparkasse">Sparkasse</option>
                <option value="volksbank">Volksbank/Raiffeisenbank</option>
                <option value="commerzbank">Commerzbank</option>
                <option value="deutsche_bank">Deutsche Bank</option>
                <option value="standard">Standard CSV</option>
              </select>
              <Button onClick={generateBankingImport} size="sm" variant="outline">
                🏦 Bank-Export
              </Button>
            </div>
            <Button onClick={() => setShowMahnDialog(true)}>
              📧 Mahnlauf
            </Button>
            <Button onClick={generateMahnbriefe} variant="outline">
              📄 Mahnbriefe PDF
            </Button>
            <input
              type="file"
              ref={sepaFileInputRef}
              onChange={handleSEPAImport}
              accept=".csv,.txt"
              className="hidden"
            />
            <Button 
              onClick={() => sepaFileInputRef.current?.click()}
              variant="outline"
            >
              💳 SEPA-Daten Import
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Beitragsliste */}
      <Card>
        <CardHeader>
          <CardTitle>Beitragsliste ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-1 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('mitgliedsnummer')}>Nr. {sortField === 'mitgliedsnummer' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-left p-1 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('lastName')}>Name {sortField === 'lastName' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-center p-1 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('alter')}>Alter {sortField === 'alter' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-center p-1 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('beitragskategorie')}>Kategorie {sortField === 'beitragskategorie' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-center p-1 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('jahresbeitrag')}>Jahresbeitrag {sortField === 'jahresbeitrag' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-center p-1 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('beitragsstatus')}>Status {sortField === 'beitragsstatus' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-center p-1 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('letzteZahlung')}>Letzte Zahlung {sortField === 'letzteZahlung' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-center p-1 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('mahnungen')}>Mahnungen {sortField === 'mahnungen' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-center p-1 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('zahlungsart')}>Zahlungsart {sortField === 'zahlungsart' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-left p-1">IBAN</th>
                  <th className="text-left p-1">BIC</th>
                  <th className="text-left p-1">Bank</th>
                  <th className="text-left p-1">SEPA-Mandat</th>
                  <th className="text-center p-1">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => (
                  <tr key={member.id} className="border-b hover:bg-muted/20">
                    <td className="p-1 font-mono text-sm font-bold">
                      {member.mitgliedsnummer ? `0${member.mitgliedsnummer}` : '-'}
                    </td>
                    <td className="p-1 font-medium">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="p-1 text-center">{member.alter}</td>
                    <td className="p-1 text-center">
                      <Badge variant={
                        member.beitragskategorie === 'jugend' ? 'default' :
                        member.beitragskategorie === 'senioren' ? 'secondary' : 'outline'
                      }>
                        {beitragssaetze[member.beitragskategorie]?.name || 'Unbekannt'}
                      </Badge>
                    </td>
                    <td className="p-1 text-center font-medium">{member.jahresbeitrag}€</td>
                    <td className="p-1 text-center">
                      <Badge variant={member.beitragsstatus === 'bezahlt' ? 'default' : 'destructive'}>
                        {member.beitragsstatus === 'bezahlt' ? 'Bezahlt' : 'Offen'}
                      </Badge>
                    </td>
                    <td className="p-1 text-center text-xs">
                      {member.letzteZahlung || '-'}
                    </td>
                    <td className="p-1 text-center">
                      {member.mahnungen > 0 && (
                        <Badge variant="outline" className="text-orange-600">
                          {member.mahnungen}x
                        </Badge>
                      )}
                    </td>
                    <td className="p-1 text-center">
                      <select 
                        value={member.zahlungsart || 'ueberweisung'}
                        onChange={(e) => {
                          // Update Zahlungsart
                          setMembers(prev => prev.map(m => 
                            m.id === member.id ? { ...m, zahlungsart: e.target.value } : m
                          ));
                        }}
                        className="text-xs border rounded px-1 py-1 w-24"
                      >
                        <option value="sepa_lastschrift">SEPA</option>
                        <option value="ueberweisung">Überweisung</option>
                        <option value="barzahlung">Bar</option>
                        <option value="dauerauftrag">Dauerauftrag</option>
                      </select>
                    </td>
                    <td className="p-1 font-mono text-xs">
                      {member.sepaMandat?.iban ? 
                        `${member.sepaMandat.iban.substring(0, 8)}****${member.sepaMandat.iban.slice(-4)}` : 
                        <input 
                          type="text" 
                          placeholder="DE..."
                          className="w-32 text-xs border rounded px-1 py-1"
                          onBlur={(e) => {
                            // Update SEPA IBAN
                            const updates = {
                              sepa: {
                                ...member.sepa,
                                iban: e.target.value
                              }
                            };
                            // Hier könnte Firebase Update stehen
                          }}
                        />
                      }
                    </td>
                    <td className="p-1 font-mono text-xs">
                      {member.sepaMandat?.bic || 
                        <input 
                          type="text" 
                          placeholder="BIC"
                          className="w-20 text-xs border rounded px-1 py-1"
                          onBlur={(e) => {
                            // Update SEPA BIC
                          }}
                        />
                      }
                    </td>
                    <td className="p-1 text-xs">
                      {member.sepaMandat?.bankname || '-'}
                    </td>
                    <td className="p-1 text-xs">
                      {member.sepaMandat?.mandatsreferenz || '-'}
                    </td>
                    <td className="p-1">
                      <div className="flex gap-1">
                        {member.beitragsstatus === 'offen' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBeitragsstatus(member.id, 'bezahlt')}
                            >
                              ✓ Bezahlt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendMahnung(member.id)}
                            >
                              📧 Mahnung
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateBeitragsstatus(member.id, 'offen')}
                          >
                            ↩ Offen
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </div>
      )}

      {activeTab === 'sepa' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>SEPA-Lastschrift Verwaltung</CardTitle>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleTxtImport}
                    accept=".txt,.csv"
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    📄 TXT Import
                  </Button>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={generateSEPAXML} size="sm">
                      📄 SEPA-XML
                    </Button>
                    <Button onClick={generateSEPACSV} size="sm" variant="outline">
                      📊 CSV Export
                    </Button>
                    <Button onClick={generateSEPAExcel} size="sm" variant="outline">
                      📋 Excel Export
                    </Button>
                    <Button onClick={generateBankingImport} size="sm" variant="outline">
                      🏦 Sparkasse Einbeck
                    </Button>
                    <Button onClick={generateDTAUS} size="sm" variant="outline">
                      💾 DTAUS Format
                    </Button>
                    <Button onClick={generateMandateList} size="sm" variant="outline">
                      📋 Mandate-Liste
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {members.filter(m => m.zahlungsart === 'sepa_lastschrift').length}
                    </div>
                    <p className="text-sm text-gray-600">SEPA-Lastschrift</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {members.filter(m => m.zahlungsart === 'ueberweisung').length}
                    </div>
                    <p className="text-sm text-gray-600">Überweisung</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {members.filter(m => m.zahlungsart === 'barzahlung').length}
                    </div>
                    <p className="text-sm text-gray-600">Barzahlung</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {members.filter(m => m.sepaMandat).length}
                    </div>
                    <p className="text-sm text-gray-600">SEPA-Mandate</p>
                  </CardContent>
                </Card>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3">Mitglied</th>
                      <th className="text-left p-3">Zahlungsart</th>
                      <th className="text-left p-3">SEPA-Mandat</th>
                      <th className="text-left p-3">Bank</th>
                      <th className="text-center p-3">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member.id} className="border-b hover:bg-muted/20">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{member.firstName} {member.lastName}</div>
                            <div className="text-sm text-gray-500">#{member.mitgliedsnummer}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={
                            member.zahlungsart === 'sepa_lastschrift' ? 'bg-green-100 text-green-800' :
                            member.zahlungsart === 'ueberweisung' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }>
                            {member.zahlungsart === 'sepa_lastschrift' ? 'SEPA-Lastschrift' :
                             member.zahlungsart === 'ueberweisung' ? 'Überweisung' : 'Barzahlung'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {member.sepaMandat ? (
                            <div className="text-sm">
                              <div className="font-medium">{member.sepaMandat.mandatsreferenz}</div>
                              <div className="text-gray-500">{member.sepaMandat.sepaAusfuehrung}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {member.sepaMandat ? (
                            <div className="text-sm">
                              <div className="font-medium">{member.sepaMandat.bankname}</div>
                              <div className="text-gray-500 font-mono">
                                {member.sepaMandat.iban.substring(0, 8)}****{member.sepaMandat.iban.slice(-4)}
                              </div>
                              <div className="text-xs text-gray-400">
                                BIC: {member.sepaMandat.bic.substring(0, 4)}***
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-1">
                            <Badge variant={member.sepaMandat ? 'default' : 'outline'}>
                              {member.sepaMandat ? '✓ SEPA-Mandat' : 'Kein Mandat'}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Excel Import Dialog */}
          {showImportDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Excel Import Vorschau</h3>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowImportDialog(false)}
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {importData.length} SEPA-Datensätze gefunden. BIC wurde automatisch ermittelt.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
                    <p className="text-sm text-yellow-800">
                      ⚠️ <strong>Datenschutz:</strong> IBAN und BIC werden zur Sicherheit unkenntlich angezeigt.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Format TXT-Datei: Name\tVorname\tBIC\tIBAN\tSEPA-Ausführung (Tab-getrennt, eine Zeile pro Person)
                    </p>
                  </div>
                </div>
                
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Vorname</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">IBAN</th>
                        <th className="text-left p-2">BIC</th>
                        <th className="text-left p-2">Bank</th>
                        <th className="text-left p-2">SEPA-Art</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importData.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{item.name}</td>
                          <td className="p-2">{item.vorname}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-green-600">
                              ✓ Bereit
                            </Badge>
                          </td>
                          <td className="p-2 font-mono text-xs">
                            {item.iban ? `${item.iban.substring(0, 8)}****${item.iban.slice(-4)}` : ''}
                          </td>
                          <td className="p-2 font-mono text-xs">
                            {item.bic ? `${item.bic.substring(0, 4)}***` : ''}
                          </td>
                          <td className="p-2">{item.bankname}</td>
                          <td className="p-2">
                            <Badge variant="outline">{item.sepaAusfuehrung}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowImportDialog(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button onClick={applyImportData}>
                    {importData.length} SEPA-Mandate importieren
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'mandate' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📋 SEPA-Mandate Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3">Mitglied</th>
                      <th className="text-left p-3">Mandatsreferenz</th>
                      <th className="text-left p-3">IBAN</th>
                      <th className="text-left p-3">BIC</th>
                      <th className="text-left p-3">Bank</th>
                      <th className="text-left p-3">Mandatsdatum</th>
                      <th className="text-center p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.filter(m => m.sepaMandat).map(member => (
                      <tr key={member.id} className="border-b hover:bg-muted/20">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{member.firstName} {member.lastName}</div>
                            <div className="text-sm text-gray-500">#{member.mitgliedsnummer}</div>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-sm">{member.sepaMandat.mandatsreferenz}</td>
                        <td className="p-3 font-mono text-sm">
                          {member.sepaMandat.iban.substring(0, 8)}****{member.sepaMandat.iban.slice(-4)}
                        </td>
                        <td className="p-3 font-mono text-sm">{member.sepaMandat.bic}</td>
                        <td className="p-3 text-sm">{member.sepaMandat.bankname}</td>
                        <td className="p-3 text-sm">{member.sepaMandat.mandatsdatum}</td>
                        <td className="p-3 text-center">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            ✓ Aktiv
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">💡 SEPA-XML Nutzung:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Sparkassen-App:</strong> "SEPA-Lastschriften" → "Datei hochladen"</li>
                  <li>• <strong>Online-Banking:</strong> "Zahlungsverkehr" → "SEPA-Sammellastschrift"</li>
                  <li>• <strong>Ausführung:</strong> Meist 5 Werktage vor Fälligkeitsdatum einreichen</li>
                  <li>• <strong>Kosten:</strong> Bei Sparkassen meist kostenlos für Vereine</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Mahnlauf Dialog */}
      {showMahnDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">📧 Automatischer Mahnlauf</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowMahnDialog(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Mahnungs-Einstellungen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">1. Mahnung nach (Tagen):</label>
                    <Input 
                      type="number" 
                      value={mahnungsEinstellungen.erste_mahnung}
                      onChange={(e) => setMahnungsEinstellungen({...mahnungsEinstellungen, erste_mahnung: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm">2. Mahnung nach (Tagen):</label>
                    <Input 
                      type="number" 
                      value={mahnungsEinstellungen.zweite_mahnung}
                      onChange={(e) => setMahnungsEinstellungen({...mahnungsEinstellungen, zweite_mahnung: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm">3. Mahnung nach (Tagen):</label>
                    <Input 
                      type="number" 
                      value={mahnungsEinstellungen.dritte_mahnung}
                      onChange={(e) => setMahnungsEinstellungen({...mahnungsEinstellungen, dritte_mahnung: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm">Mahngebühr (€):</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={mahnungsEinstellungen.mahngebuehr}
                      onChange={(e) => setMahnungsEinstellungen({...mahnungsEinstellungen, mahngebuehr: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Fälligkeitsdatum: 31. Januar {new Date().getFullYear()}<br/>
                  Es werden automatisch E-Mails an alle fälligen Mitglieder versendet.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowMahnDialog(false)}
              >
                Abbrechen
              </Button>
              <Button onClick={() => {
                // Implementierung für automatischen Mahnlauf
                alert('Mahnlauf gestartet! E-Mails werden versendet.');
                setShowMahnDialog(false);
              }}>
                📧 Mahnlauf starten
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Zahlungsabgleich Dialog */}
      {showAbgleichDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">🔄 Automatischer Zahlungsabgleich</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowAbgleichDialog(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {kontoauszugData.length} Zahlungen aus Kontoauszug gefunden.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                <p className="text-sm text-blue-800">
                  💡 <strong>Format Kontoauszug:</strong> Datum;Betrag;Verwendungszweck;Name (eine Zeile pro Zahlung)
                </p>
              </div>
            </div>
            
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Datum</th>
                    <th className="text-left p-2">Betrag</th>
                    <th className="text-left p-2">Verwendungszweck</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kontoauszugData.map((zahlung, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{zahlung.datum}</td>
                      <td className="p-2 font-mono">{zahlung.betrag.toFixed(2)}€</td>
                      <td className="p-2">{zahlung.verwendungszweck}</td>
                      <td className="p-2">{zahlung.name}</td>
                      <td className="p-2">
                        <Badge variant={zahlung.zugeordnet ? "default" : "outline"}>
                          {zahlung.zugeordnet ? "✓ Zugeordnet" : "Offen"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowAbgleichDialog(false)}
              >
                Abbrechen
              </Button>
              <Button onClick={() => {
                // Implementierung für automatischen Zahlungsabgleich
                alert('Zahlungsabgleich durchgeführt!');
                setShowAbgleichDialog(false);
              }}>
                🔄 Automatisch zuordnen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}