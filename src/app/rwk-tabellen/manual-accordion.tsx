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
}

export function ManualAccordion({ items, className }: ManualAccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
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