import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/theme-provider';

/**
 * Interface für die erweiterten Render-Optionen
 */
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  initialState?: Record<string, unknown>;
}

/**
 * Benutzerdefinierter Wrapper für Tests mit allen benötigten Providern
 */
const AllTheProviders = ({ 
  children,
  route = '/',
  initialState = {}
}: { 
  children: React.ReactNode;
  route?: string;
  initialState?: Record<string, unknown>;
}) => {
  // Mock router path if needed
  if (typeof window !== 'undefined') {
    window.history.pushState({}, 'Test page', route);
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="rwk-theme">
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
};

/**
 * Benutzerdefinierte Render-Funktion für Tests mit allen benötigten Providern
 */
const customRender = (
  ui: ReactElement,
  options: ExtendedRenderOptions = {}
) => {
  const { route, initialState, ...renderOptions } = options;
  
  return {
    user: userEvent.setup(),
    ...render(ui, { 
      wrapper: (props) => AllTheProviders({ 
        ...props, 
        route, 
        initialState 
      }), 
      ...renderOptions 
    })
  };
};

// Re-export alles von testing-library
export * from '@testing-library/react';

// Überschreibe die render-Methode
export { customRender as render };
