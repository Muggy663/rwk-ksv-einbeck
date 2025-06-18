"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

export function UserSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Benutzereinstellungen</CardTitle>
        <CardDescription>Passen Sie das Erscheinungsbild der Anwendung an Ihre Bedürfnisse an.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Erscheinungsbild</h3>
          </div>
          <Separator />
          <RadioGroup 
            value={theme} 
            onValueChange={setTheme}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem 
                value="light" 
                id="theme-light" 
                className="sr-only peer" 
                aria-label="Helles Design"
              />
              <Label 
                htmlFor="theme-light" 
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <div className="rounded-md border border-border bg-background p-2 w-full mb-2">
                  <div className="h-2 w-full rounded-lg bg-primary mb-2"></div>
                  <div className="h-2 w-3/4 rounded-lg bg-muted"></div>
                </div>
                <span>Hell</span>
              </Label>
            </div>
            
            <div>
              <RadioGroupItem 
                value="dark" 
                id="theme-dark" 
                className="sr-only peer" 
                aria-label="Dunkles Design"
              />
              <Label 
                htmlFor="theme-dark" 
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <div className="rounded-md border border-border bg-black p-2 w-full mb-2">
                  <div className="h-2 w-full rounded-lg bg-primary mb-2"></div>
                  <div className="h-2 w-3/4 rounded-lg bg-muted"></div>
                </div>
                <span>Dunkel</span>
              </Label>
            </div>
            
            <div>
              <RadioGroupItem 
                value="system" 
                id="theme-system" 
                className="sr-only peer" 
                aria-label="Systemeinstellung"
              />
              <Label 
                htmlFor="theme-system" 
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <div className="rounded-md border border-border bg-gradient-to-r from-background to-black p-2 w-full mb-2">
                  <div className="h-2 w-full rounded-lg bg-primary mb-2"></div>
                  <div className="h-2 w-3/4 rounded-lg bg-muted"></div>
                </div>
                <span>System</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}