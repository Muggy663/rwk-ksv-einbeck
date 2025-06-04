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