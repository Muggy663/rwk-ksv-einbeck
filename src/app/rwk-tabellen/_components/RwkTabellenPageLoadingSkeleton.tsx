"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TableIcon as TableIconLucide, Loader2, User, Users } from 'lucide-react';

export const RwkTabellenPageLoadingSkeleton: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <TableIconLucide className="h-8 w-8 text-primary" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-[180px]" />
          <Skeleton className="h-10 w-full sm:w-[220px]" />
        </div>
      </div>
      <Tabs defaultValue="mannschaften" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mb-6 shadow-md">
          <TabsTrigger value="mannschaften" className="py-2.5"><Users className="mr-2 h-5 w-5" />Mannschaften</TabsTrigger>
          <TabsTrigger value="einzelschützen" className="py-2.5"><User className="mr-2 h-5 w-5" />Einzelschützen</TabsTrigger>
        </TabsList>
        <TabsContent value="mannschaften">
          <Card className="shadow-lg">
            <CardHeader><Skeleton className="h-7 w-3/4 mb-1" /><Skeleton className="h-4 w-1/2" /></CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground mt-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg">Lade Tabellendaten für {title || 'RWK Tabellen'}...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="einzelschützen">
          <Card className="shadow-lg">
            <CardHeader><Skeleton className="h-7 w-1/2 mb-1" /><Skeleton className="h-4 w-1/3" /></CardHeader>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-1/4 mb-4" />
              <Skeleton className="h-40 w-full" />
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground mt-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg">Lade Einzelrangliste...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
