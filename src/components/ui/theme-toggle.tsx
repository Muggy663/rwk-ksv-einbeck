"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Nach dem ersten Render setzen wir mounted auf true
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Render nur das Icon ohne Text, bis die Komponente client-seitig gemounted ist
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Theme wechseln</span>
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={theme === "light" ? "Dunkelmodus aktivieren" : "Hellmodus aktivieren"}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Theme wechseln</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{theme === "light" ? "Dunkelmodus aktivieren" : "Hellmodus aktivieren"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
