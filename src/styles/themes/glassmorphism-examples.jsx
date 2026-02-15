/**
 * 🎨 Glassmorphism Design System - Verwendungsbeispiele
 * 
 * Diese Datei zeigt, wie du die neuen Glassmorphism-Effekte in deinen Komponenten verwendest.
 */

// ============================================
// 1. GLASS CARDS - Verschiedene Stärken
// ============================================

// Subtile Glass Card (leicht durchsichtig)
<div className="glass-subtle rounded-xl p-6">
  <h3>Subtile Glass Card</h3>
  <p>Perfekt für Hintergrund-Elemente</p>
</div>

// Medium Glass Card (Standard - empfohlen)
<div className="glass-medium rounded-xl p-6">
  <h3>Medium Glass Card</h3>
  <p>Beste Balance zwischen Transparenz und Lesbarkeit</p>
</div>

// Strong Glass Card (stark sichtbar)
<div className="glass-strong rounded-xl p-6">
  <h3>Strong Glass Card</h3>
  <p>Für wichtige Inhalte mit hoher Priorität</p>
</div>

// ============================================
// 2. GLASS BUTTONS
// ============================================

<button className="glass-button px-6 py-3 rounded-lg font-medium">
  Glass Button
</button>

<button className="glass-button glass-lift px-6 py-3 rounded-lg font-medium">
  Glass Button mit Hover-Lift
</button>

// ============================================
// 3. GLASS INPUTS
// ============================================

<input 
  type="text" 
  className="glass-input w-full px-4 py-3 rounded-lg"
  placeholder="Glass Input Field"
/>

<textarea 
  className="glass-input w-full px-4 py-3 rounded-lg"
  placeholder="Glass Textarea"
  rows={4}
/>

// ============================================
// 4. GLASS HEADER/NAVIGATION
// ============================================

<header className="glass-header sticky top-0 z-50 px-6 py-4">
  <nav className="flex items-center justify-between">
    <div className="text-xl font-bold">RWK Einbeck</div>
    <div className="flex gap-4">
      <a href="#" className="glass-button px-4 py-2 rounded-lg">Home</a>
      <a href="#" className="glass-button px-4 py-2 rounded-lg">RWK</a>
    </div>
  </nav>
</header>

// ============================================
// 5. GLASS MODAL/DIALOG
// ============================================

<div className="glass-modal rounded-2xl p-8 max-w-md mx-auto">
  <h2 className="text-2xl font-bold mb-4">Glass Modal</h2>
  <p className="mb-6">Perfekt für Dialoge und Overlays</p>
  <div className="flex gap-3">
    <button className="glass-button px-6 py-2 rounded-lg">Abbrechen</button>
    <button className="bg-primary text-white px-6 py-2 rounded-lg">Bestätigen</button>
  </div>
</div>

// ============================================
// 6. FROSTED GLASS (Extra Blur)
// ============================================

<div className="frosted-glass rounded-xl p-6">
  <h3>Frosted Glass</h3>
  <p>Maximaler Blur-Effekt für besondere Bereiche</p>
</div>

// ============================================
// 7. GRADIENT GLASS
// ============================================

<div className="gradient-glass rounded-xl p-6">
  <h3>Gradient Glass</h3>
  <p>Kombiniert Glaseffekt mit Farbverlauf</p>
</div>

// ============================================
// 8. GLASS MIT SHIMMER-EFFEKT
// ============================================

<div className="glass-medium glass-shimmer rounded-xl p-6">
  <h3>Glass mit Shimmer</h3>
  <p>Animierter Glanz-Effekt</p>
</div>

// ============================================
// 9. GLASS MIT GLOW-EFFEKT
// ============================================

<div className="glass-medium glass-glow rounded-xl p-6">
  <h3>Glass mit Glow</h3>
  <p>Leuchtender Schatten-Effekt</p>
</div>

// ============================================
// 10. KOMBINIERTE EFFEKTE
// ============================================

// Glass Card mit Hover-Lift und Shimmer
<div className="glass-medium glass-lift glass-shimmer rounded-xl p-6 cursor-pointer">
  <h3>Interaktive Glass Card</h3>
  <p>Kombiniert mehrere Effekte</p>
</div>

// Glass Button mit Glow
<button className="glass-button glass-glow px-6 py-3 rounded-lg font-medium">
  Glowing Glass Button
</button>

// ============================================
// 11. UTILITY CLASSES FÜR CUSTOM BLUR
// ============================================

<div className="bg-white/60 blur-sm rounded-xl p-6">
  <p>Custom Blur Small</p>
</div>

<div className="bg-white/60 blur-md rounded-xl p-6">
  <p>Custom Blur Medium</p>
</div>

<div className="bg-white/60 blur-lg rounded-xl p-6">
  <p>Custom Blur Large</p>
</div>

<div className="bg-white/60 blur-xl rounded-xl p-6">
  <p>Custom Blur Extra Large</p>
</div>

// ============================================
// 12. SATURATION UTILITIES
// ============================================

<div className="glass-medium saturate-150 rounded-xl p-6">
  <p>Erhöhte Farbsättigung (150%)</p>
</div>

<div className="glass-medium saturate-200 rounded-xl p-6">
  <p>Maximale Farbsättigung (200%)</p>
</div>

// ============================================
// 13. PRAKTISCHE BEISPIELE
// ============================================

// Feature Card mit Glass-Effekt
<div className="glass-medium glass-lift rounded-2xl p-8 cursor-pointer">
  <div className="text-4xl mb-4">🎯</div>
  <h3 className="text-xl font-bold mb-2">Social Training</h3>
  <p className="text-muted-foreground">
    Trainiere gemeinsam mit Freunden in Live-Wettkämpfen
  </p>
</div>

// Statistik-Card mit Glass
<div className="glass-strong rounded-xl p-6">
  <div className="flex items-center justify-between mb-4">
    <h4 className="font-semibold">Durchschnitt</h4>
    <span className="text-2xl font-bold text-primary">9.8</span>
  </div>
  <div className="h-2 bg-muted rounded-full overflow-hidden">
    <div className="h-full bg-primary w-[98%]"></div>
  </div>
</div>

// Navigation mit Glass Header
<nav className="glass-header fixed top-0 left-0 right-0 z-50">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-8">
        <span className="text-xl font-bold">🎯 RWK Einbeck</span>
        <div className="hidden md:flex gap-4">
          <a href="#" className="glass-button px-4 py-2 rounded-lg">RWK</a>
          <a href="#" className="glass-button px-4 py-2 rounded-lg">KM</a>
          <a href="#" className="glass-button px-4 py-2 rounded-lg">Training</a>
        </div>
      </div>
      <button className="glass-button px-4 py-2 rounded-lg">
        Anmelden
      </button>
    </div>
  </div>
</nav>

// Dashboard Grid mit Glass Cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="glass-medium glass-lift rounded-xl p-6">
    <h3 className="text-lg font-semibold mb-2">Aktive Wettkämpfe</h3>
    <p className="text-3xl font-bold text-primary">12</p>
  </div>
  
  <div className="glass-medium glass-lift rounded-xl p-6">
    <h3 className="text-lg font-semibold mb-2">Trainingsgruppen</h3>
    <p className="text-3xl font-bold text-accent">8</p>
  </div>
  
  <div className="glass-medium glass-lift rounded-xl p-6">
    <h3 className="text-lg font-semibold mb-2">Schützen Online</h3>
    <p className="text-3xl font-bold text-green-600">45</p>
  </div>
</div>

// Form mit Glass Inputs
<form className="glass-modal rounded-2xl p-8 max-w-md mx-auto space-y-4">
  <h2 className="text-2xl font-bold mb-6">Anmelden</h2>
  
  <div>
    <label className="block text-sm font-medium mb-2">E-Mail</label>
    <input 
      type="email" 
      className="glass-input w-full px-4 py-3 rounded-lg"
      placeholder="deine@email.de"
    />
  </div>
  
  <div>
    <label className="block text-sm font-medium mb-2">Passwort</label>
    <input 
      type="password" 
      className="glass-input w-full px-4 py-3 rounded-lg"
      placeholder="••••••••"
    />
  </div>
  
  <button className="glass-button glass-glow w-full py-3 rounded-lg font-medium">
    Anmelden
  </button>
</form>

// ============================================
// 14. DARK MODE BEISPIELE
// ============================================

// Alle Klassen funktionieren automatisch im Dark Mode!
// Die Farben und Transparenzen passen sich automatisch an.

<div className="dark">
  <div className="glass-medium rounded-xl p-6">
    <h3>Automatischer Dark Mode</h3>
    <p>Alle Glass-Effekte passen sich automatisch an!</p>
  </div>
</div>

// ============================================
// 15. RESPONSIVE BEISPIELE
// ============================================

// Mobile: Subtil, Desktop: Medium
<div className="glass-subtle md:glass-medium rounded-xl p-4 md:p-6">
  <h3>Responsive Glass</h3>
  <p>Passt sich der Bildschirmgröße an</p>
</div>

// ============================================
// TIPPS & BEST PRACTICES
// ============================================

/**
 * 1. Verwende glass-medium als Standard für Cards
 * 2. glass-subtle für Hintergrund-Elemente
 * 3. glass-strong für wichtige Inhalte
 * 4. Kombiniere glass-lift für interaktive Elemente
 * 5. glass-shimmer für besondere Highlights
 * 6. glass-glow für Call-to-Action Buttons
 * 7. glass-header für Navigation/Header
 * 8. glass-modal für Dialoge und Overlays
 * 9. Alle Effekte funktionieren automatisch im Dark Mode
 * 10. Kombiniere mehrere Klassen für einzigartige Effekte
 */
