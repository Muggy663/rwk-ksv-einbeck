"use client";

import React, { useState } from 'react';
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualAccordionProps {
  items: {
    id: string;
    title: React.ReactNode;
    content: React.ReactNode;
  }[];
  className?: string;
  value?: string[];
  onValueChange?: (value: string[]) => void;
}

export function ManualAccordion({ items, className, value, onValueChange }: ManualAccordionProps) {
  const [internalOpenItems, setInternalOpenItems] = useState<string[]>([]);
  const openItems = value ?? internalOpenItems;

  const toggleItem = (id: string) => {
    const newOpenItems = openItems.includes(id) 
      ? openItems.filter(item => item !== id) 
      : [...openItems, id];
    
    if (onValueChange) {
      onValueChange(newOpenItems);
    } else {
      setInternalOpenItems(newOpenItems);
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {items.map(item => (
        <div key={item.id} className="border bg-card shadow-lg rounded-lg overflow-hidden">
          <div 
            className="bg-accent/10 hover:bg-accent/20 px-6 py-4 flex justify-between items-center cursor-pointer"
            onClick={() => toggleItem(item.id)}
          >
            <h3 className="text-xl font-semibold text-accent">{item.title}</h3>
            <ChevronDown 
              className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-200",
                openItems.includes(item.id) ? "transform rotate-180" : ""
              )} 
            />
          </div>
          {openItems.includes(item.id) && (
            <div className="pt-0 pb-0">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
