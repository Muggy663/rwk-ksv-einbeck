"use client";

import React, { useState } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X, Target, Trophy, Users, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const sections = [
  { id: 'grundlagen', title: 'Grundlagen des Schießsports', icon: Target },
  { id: 'disziplinen', title: 'Disziplinen', icon: Zap },
  { id: 'wettkampfebenen', title: 'Wettkampf-Ebenen', icon: Trophy },
  { id: 'meisterschaften', title: 'Meisterschaften & RWK', icon: Users },
  { id: 'nachwuchs', title: 'Nachwuchs & Kader', icon: Trophy },
  { id: 'ausruestung', title: 'Ausrüstung', icon: Target }
];

export default function SchiesssportErklaerungPage() {
  const [activeSection, setActiveSection] = useState('grundlagen');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'grundlagen':
        return (
          <div className="space-y-8">
            {/* Einführung für Anfänger */}
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 md:p-6 rounded-lg border-l-4 border-l-blue-500">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">Was ist Sportschießen? - Eine Einführung</h2>
              <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Sportschießen ist weit mehr als nur "Zielen und Abdrücken". Es ist eine der ältesten olympischen Disziplinen und eine Sportart, 
                die höchste Präzision, mentale Stärke und jahrelange Übung erfordert. Beim Sportschießen geht es darum, mit verschiedenen 
                Sportwaffen möglichst genau ins Zentrum einer Zielscheibe zu treffen.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Stellen Sie sich vor: Ein Sportschütze steht 10 Meter von einer Scheibe entfernt und muss einen Bereich treffen, der kleiner 
                als ein 1-Euro-Stück ist - und das 40 Mal hintereinander mit höchster Konstanz. Das ist Sportschießen.
              </p>
            </div>

            {/* Warum Sportschießen? */}
            <div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4">Warum Sportschießen betreiben?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">🧘 Mentale Vorteile</h4>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Stressabbau und Entspannung</li>
                    <li>• Verbesserung der Konzentrationsfähigkeit</li>
                    <li>• Aufbau von Selbstvertrauen</li>
                    <li>• Entwicklung von Geduld und Ausdauer</li>
                    <li>• Meditation in Bewegung</li>
                  </ul>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-purple-800 dark:text-purple-200">🤝 Soziale Aspekte</h4>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Gemeinschaft im Verein</li>
                    <li>• Sport für alle Altersgruppen (6-80+ Jahre)</li>
                    <li>• Inklusion von Menschen mit Behinderungen</li>
                    <li>• Internationale Freundschaften</li>
                    <li>• Familiensport - Generationen zusammen</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Mythen und Realität */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 md:p-6 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-200">❌ Mythen vs. ✅ Realität</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 font-bold text-lg">❌</span>
                  <div className="text-sm md:text-base">
                    <strong className="text-gray-900 dark:text-gray-100">Mythos:</strong> <span className="text-gray-700 dark:text-gray-300">"Sportschießen ist gefährlich"</span>
                    <br />
                    <span className="text-green-600 dark:text-green-400"><strong>✅ Realität:</strong> Sportschießen hat eine der niedrigsten Verletzungsraten aller Sportarten. Strikte Sicherheitsregeln machen es extrem sicher.</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 font-bold text-lg">❌</span>
                  <div className="text-sm md:text-base">
                    <strong className="text-gray-900 dark:text-gray-100">Mythos:</strong> <span className="text-gray-700 dark:text-gray-300">"Das ist kein echter Sport"</span>
                    <br />
                    <span className="text-green-600 dark:text-green-400"><strong>✅ Realität:</strong> Olympische Disziplin seit 1896. Erfordert jahrelanges Training, Körperbeherrschung und mentale Stärke wie Hochleistungssport.</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 font-bold text-lg">❌</span>
                  <div className="text-sm md:text-base">
                    <strong className="text-gray-900 dark:text-gray-100">Mythos:</strong> <span className="text-gray-700 dark:text-gray-300">"Nur für Männer geeignet"</span>
                    <br />
                    <span className="text-green-600 dark:text-green-400"><strong>✅ Realität:</strong> Einer der wenigen Sportarten, wo Männer und Frauen gleichberechtigt gegeneinander antreten. Viele Weltrekorde werden von Frauen gehalten.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wissenschaftliche Grundlagen */}
            <div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Die Wissenschaft des Sportschießens</h3>
              <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
                Moderne Sportschieß-Forschung zeigt, dass Präzisionsschießen eine komplexe Koordination verschiedener 
                physiologischer und psychologischer Faktoren erfordert:
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-blue-700">🧠 Neurophysiologie</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Das Gehirn muss während des Schusses mehrere Systeme koordinieren:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Visuelles System:</strong> Scheibe, Visier und Korn müssen scharf abgebildet werden</li>
                      <li>• <strong>Motorisches System:</strong> Feinmotorik für Abzugsbetätigung (2-20 Newton Kraft)</li>
                      <li>• <strong>Vestibuläres System:</strong> Gleichgewicht und Körperstabilität</li>
                      <li>• <strong>Autonomes Nervensystem:</strong> Herzschlag und Atmung kontrollieren</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-green-700">📊 Biomechanik</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Physikalische Faktoren, die das Ergebnis beeinflussen:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Körperschwankungen:</strong> 0,1-0,3mm Bewegung = 1 Ring Abweichung</li>
                      <li>• <strong>Herzschlag:</strong> Optimaler Schuss zwischen Herzschlägen</li>
                      <li>• <strong>Atmung:</strong> Natürliche Atempause für Schussabgabe</li>
                      <li>• <strong>Muskeltonus:</strong> 20-30% Anspannung für optimale Stabilität</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-purple-700">🎯 Ballistik & Präzision</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Die Physik des perfekten Schusses:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Geschossgeschwindigkeit:</strong> LG ~170 m/s, KK ~320 m/s</li>
                      <li>• <strong>Flugzeit:</strong> LG 10m = 0,06s, KK 50m = 0,16s</li>
                      <li>• <strong>Präzision:</strong> Moderne Sportwaffen: &lt;0,5 MOA Genauigkeit</li>
                      <li>• <strong>Umweltfaktoren:</strong> Wind, Temperatur, Luftfeuchtigkeit</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-red-700">🧘 Sportpsychologie</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Mentale Aspekte des Hochleistungsschießens:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Flow-State:</strong> Optimaler Leistungszustand</li>
                      <li>• <strong>Arousal-Kontrolle:</strong> Optimales Erregungsniveau</li>
                      <li>• <strong>Attention Control:</strong> Fokussierung auf relevante Reize</li>
                      <li>• <strong>Selbstregulation:</strong> Emotionale Kontrolle unter Wettkampfdruck</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Trainingsmethodik */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 md:p-6 rounded-lg">
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Moderne Trainingsmethodik</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">📈 Leistungsdiagnostik</h4>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Elektronische Trainingsanlagen (SCATT, Noptel)</li>
                    <li>• Bewegungsanalyse mit Hochgeschwindigkeitskameras</li>
                    <li>• Herzfrequenzvariabilität-Messung</li>
                    <li>• Biomechanische Analysen</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">🎯 Techniktraining</h4>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Trockentraining (ohne Munition)</li>
                    <li>• Lasertraining für Bewegungsanalyse</li>
                    <li>• Progressives Technikaufbau-Training</li>
                    <li>• Videoanalyse der Schießtechnik</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-purple-600 dark:text-purple-400">🧠 Mentaltraining</h4>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Atemtechniken und Entspannungsverfahren</li>
                    <li>• Visualisierung und mentale Simulation</li>
                    <li>• Wettkampfvorbereitung und Routinen</li>
                    <li>• Stressmanagement und Druckbewältigung</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sicherheitsphilosophie */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 md:p-6 rounded-lg border border-green-200 dark:border-green-700">
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-green-800 dark:text-green-200">🔒 Sicherheit im Sportschießen</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm md:text-base">
                Sicherheit ist das Fundament des Sportschießens. Als Sportschützen stehen wir für verantwortungsvollen Umgang 
                mit Sportwaffen und höchste Sicherheitsstandards. Unser Ziel ist sportliche Präzision auf der Scheibe.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-green-700 dark:text-green-300">Die 4 Grundregeln für Sportschützen</h4>
                  <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li><strong>1. Jede Sportwaffe ist geladen</strong> - Behandle jede Waffe so, als wäre sie geladen</li>
                    <li><strong>2. Nur auf die Scheibe zielen</strong> - Niemals auf etwas anderes als das Ziel</li>
                    <li><strong>3. Finger weg vom Abzug</strong> - bis du schießbereit bist</li>
                    <li><strong>4. Kenne dein Ziel</strong> - und den sicheren Kugelfang dahinter</li>
                  </ol>
                </div>

              </div>
            </div>

            {/* Rechtliche Grundlagen */}
            <div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4">⚖️ Rechtliche Grundlagen in Deutschland</h3>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Wichtiger Hinweis:</strong> Diese Informationen dienen nur der allgemeinen Orientierung. 
                  Für verbindliche Rechtsauskünfte wenden Sie sich an die örtlichen Behörden oder Rechtsexperten.
                </p>
              </div>
              
              <div className="space-y-4">
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">📋 Waffengesetz (WaffG)</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Das deutsche Waffengesetz regelt den Umgang mit Sportwaffen sehr strikt:
                    </p>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <li>• <strong>Bedürfnisprüfung:</strong> Nachweis der sportlichen Betätigung (18 Monate Vereinsmitgliedschaft)</li>
                      <li>• <strong>Sachkunde:</strong> Theoretische und praktische Prüfung bei Behörde</li>
                      <li>• <strong>Zuverlässigkeit:</strong> Führungszeugnis, keine Vorstrafen</li>
                      <li>• <strong>Persönliche Eignung:</strong> Gesundheitszeugnis, psychische Eignung</li>
                      <li>• <strong>Aufbewahrung:</strong> Waffenschrank Grad 0/N nach EN 1143-1</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">🏛️ Sportordnung des DSB</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Interne Regelungen für den organisierten Sportschießen:
                    </p>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <li>• Wettkampfbestimmungen und Disziplinregeln</li>
                      <li>• Ausbildungsstandards für Trainer und Übungsleiter</li>
                      <li>• Jugendschutzbestimmungen</li>
                      <li>• Anti-Doping-Regelungen</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Internationale Dimension */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 p-4 md:p-6 rounded-lg">
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">🌍 Sportschießen International</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">🏅 Olympische Geschichte</h4>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• <strong>1896:</strong> Erste Olympische Spiele der Neuzeit - 5 Schießdisziplinen</li>
                    <li>• <strong>Mixed-Wettbewerbe:</strong> Männer und Frauen können gemeinsam antreten</li>
                    <li>• <strong>15 Disziplinen:</strong> Gewehr, Pistole, Flinte (Trap, Skeet)</li>
                    <li>• <strong>Deutsche Erfolge:</strong> Über 90 olympische Medaillen seit 1896</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">🌐 Weltweite Organisation</h4>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• <strong>ISSF:</strong> International Shooting Sport Federation</li>
                    <li>• <strong>160+ Nationen:</strong> Mitglieder weltweit</li>
                    <li>• <strong>Weltmeisterschaften:</strong> Alle 4 Jahre</li>
                    <li>• <strong>Weltcup-Serie:</strong> Jährliche Wettkampfserie</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'disziplinen':
        return (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Sportschieß-Disziplinen</h2>
            
            <div className="space-y-6">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-900 dark:text-gray-100">
                    🎯 Luftgewehr (LG)
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 w-fit">10m Entfernung</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm md:text-base text-gray-700 dark:text-gray-300">
                    Das Luftgewehr ist eine der populärsten Disziplinen im Sportschießen. Geschossen wird auf 10 Meter Entfernung 
                    mit Luftdruckgewehren im Kaliber 4,5mm.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Wettkampf-Format:</h4>
                      <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li>• 40 Schuss für Erwachsene</li>
                        <li>• 20 Schuss für Jugend</li>
                        <li>• Stehend freihändig</li>
                        <li>• Maximale Ringzahl: 400 (Erwachsene)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Besonderheiten:</h4>
                      <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li>• Keine Auflage erlaubt</li>
                        <li>• Schießjacke und -hose zugelassen</li>
                        <li>• Diopter-Visierung üblich</li>
                        <li>• Olympische Disziplin</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-900 dark:text-gray-100">
                    🎯 Luftpistole (LP)
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 w-fit">10m Entfernung</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm md:text-base text-gray-700 dark:text-gray-300">
                    Luftpistole wird ebenfalls auf 10 Meter geschossen, erfordert aber eine andere Technik als das Gewehr.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Wettkampf-Format:</h4>
                      <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li>• 40 Schuss für Erwachsene</li>
                        <li>• 20 Schuss für Jugend</li>
                        <li>• Einhändiger Anschlag</li>
                        <li>• Maximale Ringzahl: 400</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Besonderheiten:</h4>
                      <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li>• Freie Hand darf nicht stützen</li>
                        <li>• Spezielle Schießschuhe erlaubt</li>
                        <li>• Präzisions-Luftpistolen</li>
                        <li>• Olympische Disziplin</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-900 dark:text-gray-100">
                    🎯 Kleinkaliber (KK)
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 w-fit">50m/100m</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm md:text-base text-gray-700 dark:text-gray-300">
                    Kleinkaliber-Disziplinen werden mit .22 lfB Munition auf größere Entfernungen geschossen.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">KK-Gewehr 50m:</h4>
                      <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li>• 60 Schuss liegend (Liegendkampf)</li>
                        <li>• 30 Schuss verschiedene Positionen</li>
                        <li>• Auflage-Disziplinen möglich</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">KK-Gewehr 100m:</h4>
                      <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li>• Meist Auflage-Disziplin</li>
                        <li>• 30 Schuss Standard</li>
                        <li>• Höchste Präzisionsanforderungen</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    🎯 Dreistellungskampf
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600">50m KK & LG</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-gray-700 dark:text-gray-300">
                    Der Dreistellungskampf ist eine der anspruchsvollsten Disziplinen, bei der in drei verschiedenen Anschlägen geschossen wird. Gibt es sowohl als Kleinkaliber- als auch als Luftgewehr-Variante.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Wettkampf-Format:</h4>
                      <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li>• 3x20 Schuss (insgesamt 60 Schuss)</li>
                        <li>• Liegend - Stehend - Kniend</li>
                        <li>• Kleinkaliber .22 lfB oder Luftgewehr</li>
                        <li>• Maximale Ringzahl: 600</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Besonderheiten:</h4>
                      <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li>• Höchste technische Anforderungen</li>
                        <li>• Olympische Disziplin</li>
                        <li>• Verschiedene Anschlagstechniken</li>
                        <li>• Königsdisziplin des Gewehrschießens</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    🎯 Auflage-Disziplinen
                    <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Alle Kaliber</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-gray-700 dark:text-gray-300">
                    Bei Auflage-Disziplinen wird die Waffe auf einer Auflage stabilisiert, was höchste Präzision ermöglicht.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Verfügbare Disziplinen:</h4>
                      <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li>• Luftgewehr Auflage 10m</li>
                        <li>• Luftpistole Auflage 10m</li>
                        <li>• KK-Gewehr Auflage 50m/100m</li>
                        <li>• Zimmerstutzen Auflage</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Besonderheiten:</h4>
                      <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li>• Eigene Altersklassen-Einteilung</li>
                        <li>• Meist 30 Schuss</li>
                        <li>• Sehr hohe Ergebnisse möglich</li>
                        <li>• Beliebte Senioren-Disziplinen</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'wettkampfebenen':
        return (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Wettkampf-Ebenen im deutschen Sportschießen</h2>
            
            <div className="space-y-4">
              <Card className="border-l-4 border-l-green-500 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-900 dark:text-gray-100">
                    🏠 Vereinsebene
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 w-fit">Basis</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm md:text-base text-gray-700 dark:text-gray-300">
                    Der Schützenverein ist die Grundlage des deutschen Sportschießens. Hier finden regelmäßige Trainings und interne Wettkämpfe statt.
                  </p>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Vereinsmeisterschaften</li>
                    <li>• Rundenwettkämpfe (RWK) zwischen Vereinsmannschaften</li>
                    <li>• Training und Nachwuchsförderung</li>
                    <li>• Gesellschaftsschießen und Volksfeste</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🏘️ Kreisebene
                    <Badge variant="outline">Regional</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3">
                    Kreisverbände organisieren Wettkämpfe zwischen Vereinen einer Region und führen Kreismeisterschaften durch.
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Kreismeisterschaften (KM) in allen Disziplinen</li>
                    <li>• Rundenwettkämpfe zwischen Vereinen</li>
                    <li>• Qualifikation für Landesmeisterschaften</li>
                    <li>• Nachwuchsförderung und Ausbildung</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🏛️ Bezirksebene
                    <Badge variant="outline">Überregional</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3">
                    Bezirksverbände umfassen mehrere Kreise und organisieren Wettkämpfe auf höherem Niveau.
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Bezirksmeisterschaften</li>
                    <li>• Qualifikation für Landesmeisterschaften</li>
                    <li>• Bezirksligen bis Verbandsoberligen</li>
                    <li>• Leistungssport-Förderung</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    🏢 Landesebene
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Bundesland</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-gray-700 dark:text-gray-300">
                    Landesschützenverbände organisieren die höchsten Wettkämpfe auf Landesebene.
                  </p>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Landesmeisterschaften (Einzel & Mannschaft)</li>
                    <li>• Qualifikation für Deutsche Meisterschaften</li>
                    <li>• Landesliga, Verbandsliga, Verbandsoberliga</li>
                    <li>• Kaderförderung und Leistungszentren</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    🇩🇪 Bundesebene
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">National</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-gray-700 dark:text-gray-300">
                    Der Deutsche Schützenbund (DSB) ist die Spitze des deutschen Sportschießens.
                  </p>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Deutsche Meisterschaften (Einzel & Mannschaft)</li>
                    <li>• 2. Bundesliga und Bundesliga (höchste Wettkampfklassen)</li>
                    <li>• Nationalmannschafts-Nominierung</li>
                    <li>• Internationale Wettkämpfe und Olympia-Qualifikation</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🔄 Aufstiegssystem</h3>
                <p className="text-sm text-gray-700">
                  Durch gute Leistungen können Schützen und Mannschaften von einer Ebene zur nächsten aufsteigen. 
                  Kreismeister qualifizieren sich für Landesmeisterschaften, 
                  und Landesmeister für Deutsche Meisterschaften.
                </p>
              </div>
            </div>
          </div>
        );

      case 'meisterschaften':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Meisterschaften vs. Rundenwettkämpfe</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    🏆 Meisterschaften
                    <Badge variant="default">Einzel & Mannschaft</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Meisterschaften werden sowohl als Einzel- als auch als Mannschaftswettkämpfe ausgetragen, bei denen um offizielle Titel gekämpft wird.
                  </p>
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Charakteristika:</h4>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <li>• Einzel- und Mannschaftswertung nach Altersklassen</li>
                      <li>• Qualifikationssystem (Kreis → Land → Bund)</li>
                      <li>• Titel: Kreismeister, Bezirksmeister, etc.</li>
                      <li>• Meist einmaliger Wettkampf pro Jahr</li>
                      <li>• Urkunden und Medaillen für Platzierte</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Altersklassen (Beispiel):</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Schüler 6-11 Jahre (Lichtpunkt)</li>
                      <li>• Schüler (bis 14 Jahre)</li>
                      <li>• Jugend (15-16 Jahre)</li>
                      <li>• Junioren (17-20 Jahre)</li>
                      <li>• Herren/Damen I-V (nach Alter)</li>
                      <li>• Senioren 0-VI (Auflage-Disziplinen)</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded">
                    <h4 className="font-semibold mb-1">🎯 Ziel:</h4>
                    <p className="text-sm">Ermittlung der besten Einzelschützen in jeder Altersklasse und Disziplin.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    👥 Rundenwettkämpfe (RWK)
                    <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Mannschaftswertung</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Rundenwettkämpfe sind Mannschaftswettkämpfe zwischen Vereinen, die über eine ganze Saison ausgetragen werden.
                  </p>
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Charakteristika:</h4>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <li>• Auflage: 3 Schützen pro Mannschaft</li>
                      <li>• Freihändig: 5 Schützen pro Mannschaft</li>
                      <li>• Liga-System mit Auf- und Abstieg</li>
                      <li>• Mehrere Runden pro Saison</li>
                      <li>• Hin- und Rückrunde</li>
                      <li>• Tabellenwertung mit Punkten</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Liga-Struktur (nach Landesverband):</h4>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <li>• <strong>Niedersachsen (NSSV):</strong> Kreisliga → Bezirksliga → Verbandsoberliga</li>
                      <li>• <strong>Bayern (BSV):</strong> Kreisliga → Bezirksliga → Landesliga → Bayernliga</li>
                      <li>• <strong>NRW (WSB):</strong> Kreisliga → Bezirksliga → Verbandsliga → Oberliga</li>
                      <li>• <strong>Bundesweit:</strong> 2. Bundesliga → Bundesliga</li>
                      <li className="text-xs italic">• Struktur variiert je nach Landesverband</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-3 rounded">
                    <h4 className="font-semibold mb-1">🎯 Ziel:</h4>
                    <p className="text-sm">Ermittlung der besten Mannschaften und Förderung des Vereinssports.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">🔄 Saisonablauf</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Rundenwettkämpfe:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Sep-Nov</Badge>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Hinrunde</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Dez-Jan</Badge>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Winterpause</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Feb-Apr</Badge>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Rückrunde</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Mai</Badge>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Saisonabschluss</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Meisterschaften:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Jan-Feb</Badge>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Kreismeisterschaften</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Mär-Apr</Badge>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Bezirksmeisterschaften</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Mai-Jun</Badge>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Landesmeisterschaften</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Jul-Aug</Badge>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Deutsche Meisterschaften</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'nachwuchs':
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-6 text-primary">Nachwuchs & Kadersystem im deutschen Schießsport</h2>
            
            {/* Einführung Nachwuchsförderung */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-l-4 border-l-green-500">
              <h3 className="text-2xl font-semibold mb-4 text-green-800">Nachwuchsförderung - Die Zukunft des Schießsports</h3>
              <p className="text-gray-700 mb-4">
                Deutschland hat eines der weltweit erfolgreichsten Nachwuchsfördersysteme im Schießsport. Von der ersten 
                Berührung mit dem Sport bis zur Weltspitze gibt es ein durchdachtes System, das Talente systematisch entwickelt.
              </p>
              <p className="text-gray-700">
                Das Kadersystem beginnt bereits im Jugendbereich und führt über verschiedene Stufen bis zur Nationalmannschaft. 
                Dabei stehen nicht nur sportliche Leistungen im Vordergrund, sondern auch Persönlichkeitsentwicklung und Bildung.
              </p>
            </div>

            {/* Altersklassen im Detail */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">Altersklassen und Entwicklungsstufen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-yellow-700">👶 Schüler (bis 14 Jahre)</h4>
                    <ul className="text-sm space-y-2">
                      <li>• <strong>Einstiegsalter:</strong> Ab 6 Jahren möglich (Lichtpunkt 6-11 Jahre)</li>
                      <li>• <strong>Waffen:</strong> Lichtgewehr (6-11 Jahre), Luftgewehr mit Sondererlaubnis ab 12</li>
                      <li>• <strong>Schusszahl:</strong> 10-20 Schuss pro Training</li>
                      <li>• <strong>Fokus:</strong> Spaß, Grundtechnik, Sicherheit</li>
                      <li>• <strong>Wettkampf:</strong> Vereinsmeisterschaften, Kreisebene</li>
                      <li>• <strong>Training:</strong> 1-2x pro Woche, spielerisch</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-orange-700">🧒 Jugend (15-16 Jahre)</h4>
                    <ul className="text-sm space-y-2">
                      <li>• <strong>Waffen:</strong> Vollwertige Luftgewehre/Luftpistolen</li>
                      <li>• <strong>Schusszahl:</strong> 20 Schuss Wettkampf</li>
                      <li>• <strong>Fokus:</strong> Technikverfeinerung, erste Wettkampferfahrung</li>
                      <li>• <strong>Wettkampf:</strong> Bis Landesmeisterschaften</li>
                      <li>• <strong>Training:</strong> 2-3x pro Woche, strukturiert</li>
                      <li>• <strong>Besonderheit:</strong> Erste Kader-Sichtungen</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-blue-700">🏅 Junioren (17-20 Jahre)</h4>
                    <ul className="text-sm space-y-2">
                      <li>• <strong>Waffen:</strong> Alle Disziplinen möglich</li>
                      <li>• <strong>Schusszahl:</strong> Erwachsenen-Format (40 Schuss)</li>
                      <li>• <strong>Fokus:</strong> Leistungssport, Wettkampfhärte</li>
                      <li>• <strong>Wettkampf:</strong> Deutsche Meisterschaften, international</li>
                      <li>• <strong>Training:</strong> 4-6x pro Woche, professionell</li>
                      <li>• <strong>Kader:</strong> Landes- und Bundeskader möglich</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Kadersystem Deutschland */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4 text-blue-800">Das deutsche Kadersystem</h3>
              <p className="text-gray-700 mb-4">
                Das Kadersystem ist die Spitze der Nachwuchsförderung. Es identifiziert, fördert und entwickelt die besten Talente 
                systematisch zu Weltklasse-Athleten. Die Auswahl erfolgt nach strengen Kriterien und die Förderung ist umfassend.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-blue-700">🏆 Kaderstufen (Bund)</h4>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border-l-4 border-l-red-500">
                      <h5 className="font-semibold text-red-700">A-Kader (Nationalmannschaft)</h5>
                      <p className="text-sm text-gray-600">Top 3-5 Schützen pro Disziplin, Olympia-Anwärter</p>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-l-orange-500">
                      <h5 className="font-semibold text-orange-700">B-Kader (Perspektivkader)</h5>
                      <p className="text-sm text-gray-600">Nachwuchstalente mit Weltklasse-Potenzial</p>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-l-yellow-500">
                      <h5 className="font-semibold text-yellow-700">C-Kader (Nachwuchskader)</h5>
                      <p className="text-sm text-gray-600">Talentierte Junioren, erste Bundeskader-Erfahrung</p>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-l-green-500">
                      <h5 className="font-semibold text-green-700">D/C-Kader (Schülerkader)</h5>
                      <p className="text-sm text-gray-600">Nachwuchstalente ab 14 Jahren</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-blue-700">🎯 Auswahlkriterien</h4>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded">
                      <h5 className="font-semibold mb-1">Sportliche Leistung (60%)</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Wettkampfergebnisse (DM, internationale Wettkämpfe)</li>
                        <li>• Leistungsentwicklung über 2-3 Jahre</li>
                        <li>• Konstanz und Wettkampfhärte</li>
                        <li>• Potenzialeinschätzung durch Trainer</li>
                      </ul>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <h5 className="font-semibold mb-1">Persönlichkeit (25%)</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Trainingsbereitschaft und -fleiß</li>
                        <li>• Teamfähigkeit und soziales Verhalten</li>
                        <li>• Umgang mit Druck und Rückschlägen</li>
                        <li>• Lernbereitschaft und Coachability</li>
                      </ul>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <h5 className="font-semibold mb-1">Rahmenbedingungen (15%)</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Schulische/berufliche Situation</li>
                        <li>• Familiäre Unterstützung</li>
                        <li>• Vereinsstruktur und Trainingsmöglichkeiten</li>
                        <li>• Gesundheitszustand</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kadertraining */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">Kadertraining - Professionelle Entwicklung</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-purple-700">🎯 Technisches Training</h4>
                    <ul className="text-sm space-y-2">
                      <li>• <strong>Schießtechnik:</strong> Videoanalyse, Bewegungsoptimierung</li>
                      <li>• <strong>Trockentraining:</strong> 60-80% der Trainingszeit</li>
                      <li>• <strong>Elektronische Systeme:</strong> SCATT, Noptel für Präzisionsanalyse</li>
                      <li>• <strong>Materialoptimierung:</strong> Waffen- und Ausrüstungsanpassung</li>
                      <li>• <strong>Trainingsplanung:</strong> Periodisierung, Makro-/Mikrozyklen</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-green-700">🧠 Mentaltraining</h4>
                    <ul className="text-sm space-y-2">
                      <li>• <strong>Wettkampfpsychologie:</strong> Druckbewältigung, Routinen</li>
                      <li>• <strong>Konzentrationstraining:</strong> Aufmerksamkeitssteuerung</li>
                      <li>• <strong>Visualisierung:</strong> Mentale Wettkampfvorbereitung</li>
                      <li>• <strong>Stressmanagement:</strong> Entspannungstechniken</li>
                      <li>• <strong>Zielsetzung:</strong> Kurz- und langfristige Ziele</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-red-700">💪 Körperliches Training</h4>
                    <ul className="text-sm space-y-2">
                      <li>• <strong>Stabilitätstraining:</strong> Core-Training, Gleichgewicht</li>
                      <li>• <strong>Ausdauer:</strong> Herz-Kreislauf für Wettkampflänge</li>
                      <li>• <strong>Koordination:</strong> Feinmotorik, Hand-Auge-Koordination</li>
                      <li>• <strong>Regeneration:</strong> Stretching, Massage, Physiotherapie</li>
                      <li>• <strong>Ernährung:</strong> Optimierte Sporternährung</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-blue-700">🎓 Bildung & Entwicklung</h4>
                    <ul className="text-sm space-y-2">
                      <li>• <strong>Schule/Studium:</strong> Eliteschulen des Sports</li>
                      <li>• <strong>Duale Karriere:</strong> Sport und Beruf vereinbaren</li>
                      <li>• <strong>Sprachförderung:</strong> Für internationale Wettkämpfe</li>
                      <li>• <strong>Medientraining:</strong> Öffentlichkeitsarbeit</li>
                      <li>• <strong>Persönlichkeitsentwicklung:</strong> Führungsqualitäten</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Trainingsalltag */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">Trainingsalltag eines Bundeskader-Schützen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">📅 Wochenplan (Beispiel A-Kader)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white p-2 rounded">
                      <strong>Montag:</strong> Trockentraining (2h) + Krafttraining (1h)
                    </div>
                    <div className="bg-white p-2 rounded">
                      <strong>Dienstag:</strong> Schießtraining (3h) + Mentaltraining (1h)
                    </div>
                    <div className="bg-white p-2 rounded">
                      <strong>Mittwoch:</strong> Trockentraining (2h) + Ausdauer (1h)
                    </div>
                    <div className="bg-white p-2 rounded">
                      <strong>Donnerstag:</strong> Schießtraining (3h) + Regeneration
                    </div>
                    <div className="bg-white p-2 rounded">
                      <strong>Freitag:</strong> Wettkampftraining (2h) + Videoanalyse
                    </div>
                    <div className="bg-white p-2 rounded">
                      <strong>Samstag:</strong> Wettkampf oder intensives Training
                    </div>
                    <div className="bg-white p-2 rounded">
                      <strong>Sonntag:</strong> Aktive Erholung oder Ruhetag
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">📊 Jahresplanung</h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white p-2 rounded">
                      <strong>Januar-März:</strong> Grundlagentraining, Technikarbeit
                    </div>
                    <div className="bg-white p-2 rounded">
                      <strong>April-Juni:</strong> Wettkampfvorbereitung, erste Wettkämpfe
                    </div>
                    <div className="bg-white p-2 rounded">
                      <strong>Juli-September:</strong> Hauptwettkampfzeit (WM, EM)
                    </div>
                    <div className="bg-white p-2 rounded">
                      <strong>Oktober-Dezember:</strong> Übergangsperiode, Regeneration
                    </div>
                  </div>
                  
                  <h4 className="font-semibold mb-3 mt-4">🏅 Leistungsziele</h4>
                  <div className="space-y-1 text-sm">
                    <div>• <strong>Schülerkader:</strong> Landesmeister, erste DM-Teilnahme</div>
                    <div>• <strong>Junioren-Kader:</strong> DM-Medaille, EM-Qualifikation</div>
                    <div>• <strong>Perspektivkader:</strong> Weltcup-Punkte, WM-Teilnahme</div>
                    <div>• <strong>A-Kader:</strong> Weltcup-Siege, Olympia-Qualifikation</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Förderung und Unterstützung */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">Förderung und Unterstützung</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 text-green-700">💰 Finanzielle Förderung</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Bundeskader: 400-1.200€/Monat</li>
                      <li>• Landeskader: 100-400€/Monat</li>
                      <li>• Wettkampfkostenerstattung</li>
                      <li>• Ausrüstungszuschüsse</li>
                      <li>• Trainingslagerkostenerstattung</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 text-blue-700">🏫 Bildungsförderung</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Eliteschulen des Sports</li>
                      <li>• Flexible Schulzeiten</li>
                      <li>• Universitäts-Partnerschaften</li>
                      <li>• Duale Karriere-Programme</li>
                      <li>• Nachhilfe und Lernunterstützung</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 text-purple-700">🤝 Betreuung</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Bundestrainer und Landestrainer</li>
                      <li>• Sportpsychologen</li>
                      <li>• Physiotherapeuten</li>
                      <li>• Ernährungsberater</li>
                      <li>• Laufbahnberater</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Erfolgsgeschichten */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="text-2xl font-semibold mb-4 text-orange-800">Deutsche Erfolgsgeschichten</h3>
              <p className="text-gray-700 mb-4">
                Das deutsche Nachwuchssystem hat zahlreiche Weltklasse-Schützen hervorgebracht. Viele heutige Weltmeister 
                und Olympiasieger durchliefen das Kadersystem von der Jugend bis zur Weltspitze.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded">
                  <h4 className="font-semibold mb-2">🏅 Typischer Werdegang</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>8-12 Jahre:</strong> Erste Schritte im Verein</div>
                    <div><strong>13-16 Jahre:</strong> Landeskader, erste Erfolge</div>
                    <div><strong>17-20 Jahre:</strong> Bundeskader, internationale Erfahrung</div>
                    <div><strong>21-25 Jahre:</strong> Weltspitze, Olympia-Teilnahme</div>
                    <div><strong>25+ Jahre:</strong> Etablierter Weltklasse-Athlet</div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded">
                  <h4 className="font-semibold mb-2">🎆 Erfolgsfaktoren</h4>
                  <div className="text-sm space-y-1">
                    <div>• Frühe Talenterkennung und -förderung</div>
                    <div>• Systematischer Leistungsaufbau</div>
                    <div>• Ganzheitliche Betreuung</div>
                    <div>• Langfristige Perspektive (10+ Jahre)</div>
                    <div>• Optimale Rahmenbedingungen</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ausruestung':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Ausrüstung im Schießsport</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>🔫 Sportwaffen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Luftgewehr:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Kaliber: 4,5mm (.177)</li>
                        <li>• Maximale Energie: 7,5 Joule</li>
                        <li>• Einlauf-System oder Pressluft</li>
                        <li>• Diopter-Visierung</li>
                        <li>• Gewicht: ca. 4-5 kg</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Luftpistole:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Kaliber: 4,5mm (.177)</li>
                        <li>• Maximale Energie: 7,5 Joule</li>
                        <li>• Pressluft oder CO2</li>
                        <li>• Präzisions-Visierung</li>
                        <li>• Gewicht: ca. 1-1,5 kg</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Kleinkaliber-Gewehr:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Kaliber: .22 lfB (5,6mm)</li>
                      <li>• Randfeuer-Munition</li>
                      <li>• Repetier- oder Einzellader</li>
                      <li>• Hochpräzise Läufe</li>
                      <li>• Verschiedene Schaftformen je nach Disziplin</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>👕 Schießbekleidung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Schießjacke:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Steife Konstruktion für Stabilität</li>
                        <li>• Leder oder Canvas-Material</li>
                        <li>• Verstellbare Passform</li>
                        <li>• Nur bei bestimmten Disziplinen erlaubt</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Schießhose:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Verstärkung an Knien und Gesäß</li>
                        <li>• Für liegende Positionen</li>
                        <li>• Reguliert durch Wettkampfregeln</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Schießschuhe:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Stabile Sohle für sicheren Stand</li>
                      <li>• Seitliche Verstärkung</li>
                      <li>• Spezielle Sohlen-Profile</li>
                      <li>• Besonders bei Pistolen-Disziplinen wichtig</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🎯 Zubehör & Hilfsmittel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Visierung:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Diopter (Lochblende hinten)</li>
                        <li>• Ringkorn (vorne)</li>
                        <li>• Verstellbare Präzisions-Systeme</li>
                        <li>• Farbfilter für verschiedene Lichtverhältnisse</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Auflage-Zubehör:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Schießauflage (verstellbar)</li>
                        <li>• Sandsäcke oder Auflagebock</li>
                        <li>• Nur bei Auflage-Disziplinen</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Sicherheitsausrüstung:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Gehörschutz (Pflicht)</li>
                        <li>• Schutzbrille</li>
                        <li>• Waffenkoffer für Transport</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Sonstiges:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Schießhandschuh</li>
                        <li>• Augenklappe</li>
                        <li>• Munitionsbox</li>
                        <li>• Reinigungsset</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">⚠️ Wichtige Hinweise</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Sportwaffen unterliegen dem Waffengesetz</li>
                  <li>• Waffenbesitzkarte oder Waffenschein erforderlich</li>
                  <li>• Sichere Aufbewahrung in Waffenschrank vorgeschrieben</li>
                  <li>• Regelmäßige behördliche Kontrollen</li>
                  <li>• Mitgliedschaft in Schützenverein meist Voraussetzung</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Inhalt wird geladen...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sportschießen erklärt</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 hidden lg:block">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-primary">Sportschießen erklärt</h1>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Grundlagen & Wissen</p>
              </div>
            </div>
          </div>
          
          <nav className="p-3 md:p-4">
            <div className="space-y-1 md:space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg text-left transition-colors text-sm md:text-base
                      ${activeSection === section.id 
                        ? 'bg-primary text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                    <span className="font-medium">{section.title}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <div className="max-w-4xl mx-auto p-4 md:p-6 pb-safe-area-bottom">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
