"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { useAuthContext } from '@/components/auth/AuthContext';
import { useClubId } from '@/hooks/useClubId';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function AufgabenManagementPage() {
  const { user } = useAuthContext();
  const { clubId, loading: clubLoading } = useClubId();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState('alle');
  const [sortField, setSortField] = useState('faelligkeitsdatum');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    if (user && clubId && !clubLoading) {
      loadTasks();
    } else {
      loadDemoTasks();
      setLoading(false);
    }
  }, [user, clubId, clubLoading]);

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const loadTasks = async () => {
    if (!clubId) return;
    
    try {
      const aufgabenCollection = `clubs/${clubId}/aufgaben`;
      const snapshot = await getDocs(collection(db, aufgabenCollection));
      
      const tasksList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTasks(tasksList.length > 0 ? tasksList : getDemoTasks());
    } catch (error) {
      console.error('Fehler beim Laden der Aufgaben:', error);
      setTasks(getDemoTasks());
    } finally {
      setLoading(false);
    }
  };

  const getDemoTasks = () => {
    return [
      {
        id: 'demo-1',
        titel: 'Jahreshauptversammlung vorbereiten',
        beschreibung: 'Einladungen versenden, Tagesordnung erstellen, Räumlichkeiten buchen',
        status: 'offen',
        prioritaet: 'hoch',
        faelligkeitsdatum: '2025-03-15',
        zustaendig: 'Vorstand',
        kategorie: 'Verwaltung',
        fortschritt: 25
      },
      {
        id: 'demo-2',
        titel: 'Beitragsrechnungen versenden',
        beschreibung: 'Jahresbeiträge 2025 an alle Mitglieder versenden',
        status: 'in_bearbeitung',
        prioritaet: 'hoch',
        faelligkeitsdatum: '2025-01-31',
        zustaendig: 'Kassenwart',
        kategorie: 'Finanzen',
        fortschritt: 75
      }
    ];
  };

  const loadDemoTasks = () => {
    const demoTasks = [
      {
        id: '1',
        titel: 'Jahreshauptversammlung vorbereiten',
        beschreibung: 'Einladungen versenden, Tagesordnung erstellen, Räumlichkeiten buchen',
        status: 'offen',
        prioritaet: 'hoch',
        faelligkeitsdatum: '2025-03-15',
        zustaendig: 'Vorstand',
        kategorie: 'Verwaltung',
        fortschritt: 25
      },
      {
        id: '2',
        titel: 'Beitragsrechnungen versenden',
        beschreibung: 'Jahresbeiträge 2025 an alle Mitglieder versenden',
        status: 'in_bearbeitung',
        prioritaet: 'hoch',
        faelligkeitsdatum: '2025-01-31',
        zustaendig: 'Kassenwart',
        kategorie: 'Finanzen',
        fortschritt: 75
      },
      {
        id: '3',
        titel: 'Schießstand-Wartung',
        beschreibung: 'Jährliche Wartung der Schießanlage durchführen',
        status: 'offen',
        prioritaet: 'mittel',
        faelligkeitsdatum: '2025-02-28',
        zustaendig: 'Sportwart',
        kategorie: 'Technik',
        fortschritt: 0
      },
      {
        id: '4',
        titel: 'Website aktualisieren',
        beschreibung: 'Neue Termine und Ergebnisse eintragen',
        status: 'erledigt',
        prioritaet: 'niedrig',
        faelligkeitsdatum: '2025-01-10',
        zustaendig: 'Schriftführer',
        kategorie: 'Öffentlichkeit',
        fortschritt: 100
      }
    ];
    
    setTasks(demoTasks);
  };

  const addNewTask = async () => {
    if (!clubId) return;
    
    const titel = document.getElementById('new-titel').value;
    const beschreibung = document.getElementById('new-beschreibung').value;
    const faelligkeitsdatum = document.getElementById('new-faelligkeit').value;
    const zustaendig = document.getElementById('new-zustaendig').value;
    const prioritaet = document.getElementById('new-prioritaet').value;

    if (!titel || !faelligkeitsdatum) {
      alert('Titel und Fälligkeitsdatum sind erforderlich');
      return;
    }

    const newTask = {
      titel,
      beschreibung,
      status: 'offen',
      prioritaet,
      faelligkeitsdatum,
      zustaendig,
      kategorie: 'Verwaltung',
      fortschritt: 0,
      clubId,
      erstelltAm: new Date(),
      aktualisiertAm: new Date()
    };

    try {
      const aufgabenCollection = `clubs/${clubId}/aufgaben`;
      const docRef = await addDoc(collection(db, aufgabenCollection), newTask);
      setTasks(prev => [...prev, { id: docRef.id, ...newTask }]);
      setShowNewTaskDialog(false);
    } catch (error) {
      console.error('Fehler beim Erstellen der Aufgabe:', error);
      alert('Fehler beim Speichern der Aufgabe');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    if (!clubId) return;
    
    try {
      const aufgabenCollection = `clubs/${clubId}/aufgaben`;
      const taskRef = doc(db, aufgabenCollection, taskId);
      
      const updates = {
        status: newStatus,
        fortschritt: newStatus === 'erledigt' ? 100 : undefined,
        aktualisiertAm: new Date()
      };
      
      await updateDoc(taskRef, updates);
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { 
          ...task, 
          status: newStatus,
          fortschritt: newStatus === 'erledigt' ? 100 : task.fortschritt
        } : task
      ));
    } catch (error) {
      console.error('Fehler beim Update:', error);
    }
  };

  const updateTaskProgress = (taskId, progress) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { 
        ...task, 
        fortschritt: progress,
        status: progress === 100 ? 'erledigt' : progress > 0 ? 'in_bearbeitung' : 'offen'
      } : task
    ));
  };

  const filteredTasks = tasks.filter(task => {
    return filterStatus === 'alle' || task.status === filterStatus;
  }).sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';
    
    if (sortField === 'faelligkeitsdatum') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else if (sortField === 'fortschritt') {
      aVal = parseInt(aVal) || 0;
      bVal = parseInt(bVal) || 0;
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const statistiken = {
    gesamt: tasks.length,
    offen: tasks.filter(t => t.status === 'offen').length,
    inBearbeitung: tasks.filter(t => t.status === 'in_bearbeitung').length,
    erledigt: tasks.filter(t => t.status === 'erledigt').length,
    ueberfaellig: tasks.filter(t => t.status !== 'erledigt' && new Date(t.faelligkeitsdatum) < new Date()).length,
    hochPrio: tasks.filter(t => t.prioritaet === 'hoch' && t.status !== 'erledigt').length
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <BackButton className="mr-2" fallbackHref="/vereinssoftware" />
          <h1 className="text-2xl lg:text-4xl font-bold text-primary">📋 Aufgaben-Management</h1>
        </div>
        <p className="text-base lg:text-lg text-muted-foreground">Vorstand-Dashboard mit To-Do-Listen</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'dashboard' ? 'border-b-2 border-primary text-primary' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'aufgaben' ? 'border-b-2 border-primary text-primary' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('aufgaben')}
          >
            📋 Aufgaben
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div>
          {/* Statistiken */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <Card><CardContent className="p-4"><div className="text-2xl font-bold text-primary">{statistiken.gesamt}</div><p className="text-sm text-gray-600">Gesamt</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-2xl font-bold text-blue-600">{statistiken.offen}</div><p className="text-sm text-gray-600">Offen</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-2xl font-bold text-orange-600">{statistiken.inBearbeitung}</div><p className="text-sm text-gray-600">In Arbeit</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{statistiken.erledigt}</div><p className="text-sm text-gray-600">Erledigt</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-2xl font-bold text-red-600">{statistiken.ueberfaellig}</div><p className="text-sm text-gray-600">Überfällig</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-2xl font-bold text-purple-600">{statistiken.hochPrio}</div><p className="text-sm text-gray-600">Hoch Prio</p></CardContent></Card>
          </div>

          {/* Prioritäre Aufgaben */}
          <Card className="mb-6">
            <CardHeader><CardTitle>🚨 Prioritäre Aufgaben</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.filter(task => task.prioritaet === 'hoch' && task.status !== 'erledigt').map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <div className="font-medium">{task.titel}</div>
                      <div className="text-sm text-gray-600">
                        Fällig: {new Date(task.faelligkeitsdatum).toLocaleDateString('de-DE')} | Zuständig: {task.zustaendig}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Hoch</Badge>
                      <Button size="sm" onClick={() => updateTaskStatus(task.id, 'in_bearbeitung')}>Starten</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'aufgaben' && (
        <div>
          {/* Filter */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded px-3 py-2">
                  <option value="alle">Alle Status</option>
                  <option value="offen">Offen</option>
                  <option value="in_bearbeitung">In Bearbeitung</option>
                  <option value="erledigt">Erledigt</option>
                </select>
                <div className="flex-1"></div>
                <Button onClick={() => setShowNewTaskDialog(true)}>+ Neue Aufgabe</Button>
              </div>
            </CardContent>
          </Card>

          {/* Aufgabenliste */}
          <div className="space-y-4">
            {filteredTasks.map(task => (
              <Card key={task.id} className={task.status === 'erledigt' ? 'opacity-75' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{task.titel}</h3>
                        <Badge variant={task.prioritaet === 'hoch' ? 'destructive' : task.prioritaet === 'mittel' ? 'default' : 'secondary'}>
                          {task.prioritaet}
                        </Badge>
                        <Badge variant={task.status === 'erledigt' ? 'default' : task.status === 'in_bearbeitung' ? 'secondary' : 'outline'}>
                          {task.status === 'offen' ? 'Offen' : task.status === 'in_bearbeitung' ? 'In Arbeit' : 'Erledigt'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{task.beschreibung}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📅 Fällig: {new Date(task.faelligkeitsdatum).toLocaleDateString('de-DE')}</span>
                        <span>👤 {task.zustaendig}</span>
                        <span>🏷️ {task.kategorie}</span>
                      </div>
                      
                      {/* Fortschrittsbalken */}
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Fortschritt</span>
                          <span>{task.fortschritt}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: `${task.fortschritt}%` }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {task.status !== 'erledigt' && (
                        <>
                          <Button size="sm" onClick={() => updateTaskStatus(task.id, 'erledigt')}>✅ Erledigt</Button>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={task.fortschritt}
                            onChange={(e) => updateTaskProgress(task.id, parseInt(e.target.value))}
                            className="w-20"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Neue Aufgabe Dialog */}
      {showNewTaskDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">📋 Neue Aufgabe erstellen</h3>
              <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>✕</Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titel *</label>
                <Input id="new-titel" placeholder="Aufgaben-Titel" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea id="new-beschreibung" placeholder="Detaillierte Beschreibung" className="w-full border rounded px-3 py-2 h-20"></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fälligkeitsdatum *</label>
                  <Input type="date" id="new-faelligkeit" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Zuständig</label>
                  <select id="new-zustaendig" className="w-full border rounded px-3 py-2">
                    <option value="Vorstand">Vorstand</option>
                    <option value="Kassenwart">Kassenwart</option>
                    <option value="Schriftführer">Schriftführer</option>
                    <option value="Sportwart">Sportwart</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Priorität</label>
                  <select id="new-prioritaet" className="w-full border rounded px-3 py-2">
                    <option value="niedrig">Niedrig</option>
                    <option value="mittel">Mittel</option>
                    <option value="hoch">Hoch</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>Abbrechen</Button>
              <Button onClick={addNewTask}>📋 Aufgabe erstellen</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}