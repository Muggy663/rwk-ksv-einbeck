// src/app/admin/teams/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Users, Loader2, AlertTriangle, InfoIcon, UserPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { TeamStatusBadge } from '@/components/ui/team-status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDescriptionComponent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';
import type { Season, League, Club, Team, Shooter, TeamValidationInfo, FirestoreLeagueSpecificDiscipline, UIDisciplineSelection, TeamCompetitionStatus } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, leagueDisciplineOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query,
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayUnion, arrayRemove, Timestamp,
  setDoc, limit
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SubstitutionDialog } from '@/components/admin/SubstitutionDialog';
import { BackButton } from '@/components/ui/back-button';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const CLUBS_COLLECTION = "clubs";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "shooters";
const ALL_CLUBS_FILTER_VALUE = "__ALL_CLUBS__";
const ALL_LEAGUES_FILTER_VALUE = "__ALL_LEAGUES__";

export default function AdminTeamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  if (!user) {
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Lade...</p></div>;
  }

  return (
    <div className="px-2 md:px-4 space-y-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BackButton className="mr-2" fallbackHref="/admin" />
            <h1 className="text-xl md:text-2xl font-semibold text-primary">Mannschaftsverwaltung</h1>
          </div>
          <Link href="/admin" className="md:hidden">
            <Button variant="outline" size="sm">
              Zurück
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Mannschaftsverwaltung</CardTitle>
          <CardDescription>
            Verwalten Sie Mannschaften für den Rundenwettkampf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Die vollständige Mannschaftsverwaltung wird in Kürze verfügbar sein.</p>
        </CardContent>
      </Card>
    </div>
  );
}