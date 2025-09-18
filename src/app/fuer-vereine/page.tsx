"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/ui/back-button';
import { 
  Trophy, 
  Users, 
  Smartphone, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { features } from './_data';

interface FeatureCardProps {
  title: string;
  items: string[];
}

const FeatureCard = ({ title, items }: FeatureCardProps) => (
  <Card className="flex flex-col shadow-lg hover:shadow-xl transition-all">
    <CardHeader>
      <CardTitle className="text-2xl text-accent">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
      <ul className="space-y-4">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
            <span className="text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export default function FuerVereinePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen overflow-x-hidden">
      <div className="flex items-center space-x-3 mb-8">
        <BackButton className="mr-2" fallbackHref="/" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Für Vereine</h1>
          <p className="text-lg text-muted-foreground">
            Digitalisieren Sie Ihren Schützenverein - Einfach, Modern und Effizient
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="relative mb-8">
          <Image
            src="/images/logo.png"
            alt="KSV Einbeck Logo"
            width={120}
            height={120}
            className="mx-auto rounded-lg shadow-xl"
            priority
          />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent mb-6">
          Digitalisieren Sie Ihren Schützenverein
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto">
          <strong>Einfach, Modern und Effizient.</strong><br />
          Haben Sie es satt, Rundenwettkämpfe (RWK) und Kreismeisterschaften (KM) mit unzähligen Excel-Listen und Papierkram zu verwalten?
        </p>
        
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg mb-8">
          <p className="text-lg font-medium">
            Die <strong>RWK KSV Einbeck - Live Tabellen & Wettkampf-Management</strong> ist Ihre All-in-One-Lösung, entwickelt von Schützen für Schützen, 
            um Ihren Vereinsalltag radikal zu vereinfachen.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/login">
              Jetzt anmelden
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/support">
              Support kontaktieren
            </Link>
          </Button>
        </div>
      </section>

      <Separator className="my-12" />

      {/* Main Features */}
      <section aria-labelledby="features-heading" className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <h2 id="features-heading" className="sr-only">Hauptfunktionen</h2>
        {Object.entries(features).map(([title, items]) => (
          <FeatureCard key={title} title={title} items={items} />
        ))}
      </section>

      {/* Technology Features */}
      <Card className="shadow-lg mb-16">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Zap className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Moderne Technologie, die begeistert</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Smartphone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <strong>Überall verfügbar:</strong> Nutzen Sie die App als moderne Web-Anwendung auf dem PC oder als native App auf Android-Smartphones.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Target className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <strong>Einfache Bedienung:</strong> Dank Features wie Spracheingabe ("185 Ringe" sagen statt tippen) ist die Ergebniserfassung schneller als je zuvor.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <strong>Immer aktuell:</strong> Dank Echtzeit-Synchronisation sehen alle Mitglieder und Vorstände Änderungen sofort.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-8 rounded-lg mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Ihr Vorteil</h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Zeit sparen</h3>
            <p>Sparen Sie wertvolle Zeit bei der Verwaltung</p>
          </div>
          <div>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Fehler reduzieren</h3>
            <p>Reduzieren Sie Fehler durch Automatisierung</p>
          </div>
          <div>
            <Award className="h-12 w-12 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Professionell auftreten</h3>
            <p>Präsentieren Sie Ihren Verein professionell und zukunftssicher</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <footer className="text-center bg-gradient-to-r from-primary to-secondary p-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-4 text-black !text-black">
          Steigen Sie jetzt um und bringen Sie Ihren Verein ins digitale Zeitalter!
        </h2>
        <p className="text-xl mb-6 text-black">
          Diese App ist weit mehr als nur ein Tool für Tabellen – sie macht Ihren Verein für neue Mitglieder besonders attraktiv.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href="/login">
              Jetzt starten
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg px-8 border-black/20 text-black hover:bg-black/10">
            <Link href="/support">
              Beratung anfordern
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}