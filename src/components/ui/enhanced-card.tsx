"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EnhancedCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  titleId?: string;
}

export function EnhancedCard({ title, description, children, className, titleId }: EnhancedCardProps) {
  return (
    <Card className={cn("shadow-md", className)}>
      <CardHeader>
        <CardTitle id={titleId} className="text-primary font-bold scroll-mt-24">{title}</CardTitle>
        {description && <CardDescription className="text-muted-foreground font-medium">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}