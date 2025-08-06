"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ImprovedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
}

export function ImprovedCard({
  title,
  description,
  children,
  footer,
  className,
  titleClassName,
  descriptionClassName,
  contentClassName,
  footerClassName,
  ...props
}: ImprovedCardProps) {
  return (
    <Card className={cn("shadow-md hover:shadow-lg transition-all", className)} {...props}>
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className={cn("text-primary font-bold", titleClassName)}>
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className={cn("text-muted-foreground font-medium", descriptionClassName)}>
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      {children && (
        <CardContent className={cn(contentClassName)}>
          {children}
        </CardContent>
      )}
      {footer && (
        <CardFooter className={cn(footerClassName)}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
