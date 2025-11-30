"use client";

import * as React from "react";
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props} enableSystem defaultTheme="system">
      {children}
    </NextThemesProvider>
  );
}
