import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from '@/components/ui/toaster';

// Skript zum Entfernen des Onboarding-Popups
const removeOnboardingScript = `
  (function() {
    function removeOnboardingPopup() {
      // Alle Dialoge mit dem Titel "Willkommen zur RWK App" entfernen
      const dialogs = document.querySelectorAll('div[role="dialog"]');
      dialogs.forEach(dialog => {
        if (dialog.textContent && dialog.textContent.includes('Willkommen zur RWK App')) {
          dialog.remove();
        }
      });
      
      // Alle "Überspringen"-Buttons finden und klicken
      const skipButtons = Array.from(document.querySelectorAll('button'));
      skipButtons.forEach(button => {
        if (button.textContent && button.textContent.includes('Überspringen')) {
          button.click();
        }
      });
    }
    
    // Führe die Funktion sofort aus
    removeOnboardingPopup();
    
    // Und dann alle 100ms, um sicherzustellen, dass das Popup entfernt wird
    setInterval(removeOnboardingPopup, 100);
  })();
`;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <AuthProvider>
        {/* Inline-Script zum Entfernen des Onboarding-Popups */}
        <script dangerouslySetInnerHTML={{ __html: removeOnboardingScript }} />
        <Component {...pageProps} />
        <Toaster />
      </AuthProvider>
    </>
  );
}
