"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

import { Moon, Sun, Monitor } from "lucide-react";

export function ModeToggle() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Theme wechseln</span>
      </Button>
    );
  }

  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="w-9 h-9"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Theme wechseln</span>
      </Button>
      
      {isOpen && (
        <div className="absolute top-10 right-0 w-32 bg-background border border-border rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              setTheme("light");
              setIsOpen(false);
            }}
            className="flex items-center w-full p-2 hover:bg-accent rounded-t-lg"
          >
            <Sun className="mr-2 h-4 w-4" />
            <span>Hell</span>
          </button>
          <button
            onClick={() => {
              setTheme("dark");
              setIsOpen(false);
            }}
            className="flex items-center w-full p-2 hover:bg-accent"
          >
            <Moon className="mr-2 h-4 w-4" />
            <span>Dunkel</span>
          </button>
          <button
            onClick={() => {
              setTheme("system");
              setIsOpen(false);
            }}
            className="flex items-center w-full p-2 hover:bg-accent rounded-b-lg"
          >
            <Monitor className="mr-2 h-4 w-4" />
            <span>System</span>
          </button>
        </div>
      )}
    </div>
  );
}
