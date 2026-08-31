"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

export function Heading({ 
  level = 2, 
  className, 
  children, 
  ...props 
}: HeadingProps) {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Component 
      className={cn(
        "text-primary font-bold",
        level === 1 && "text-3xl md:text-4xl",
        level === 2 && "text-2xl md:text-3xl",
        level === 3 && "text-xl md:text-2xl",
        level === 4 && "text-lg md:text-xl",
        level === 5 && "text-base md:text-lg",
        level === 6 && "text-sm md:text-base",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function SectionTitle({ className, ...props }: HeadingProps) {
  return (
    <Heading 
      level={2} 
      className={cn("border-b pb-2 mb-4", className)} 
      {...props} 
    />
  );
}

export function CardHeading({ className, ...props }: HeadingProps) {
  return (
    <Heading 
      level={3} 
      className={cn("text-primary font-bold", className)} 
      {...props} 
    />
  );
}

export function SubHeading({ className, ...props }: HeadingProps) {
  return (
    <Heading 
      level={4} 
      className={cn("text-primary font-semibold", className)} 
      {...props} 
    />
  );
}
