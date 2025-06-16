/**
 * Utility-Funktionen für die Memoization von Komponenten und Funktionen
 */
import { useMemo, useCallback, DependencyList } from 'react';

/**
 * Memoize eine Funktion mit expliziten Typen
 * @param fn Die zu memoisierte Funktion
 * @param deps Abhängigkeiten für die Memoization
 * @returns Die memoizierte Funktion
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  fn: T,
  deps: DependencyList
): T {
  return useCallback(fn, deps);
}

/**
 * Memoize einen Wert mit expliziten Typen
 * @param factory Die Factory-Funktion, die den zu memoizierenden Wert erzeugt
 * @param deps Abhängigkeiten für die Memoization
 * @returns Der memoizierte Wert
 */
export function useMemoizedValue<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(factory, deps);
}

/**
 * Memoize eine teure Berechnung
 * @param computeFunc Die Berechnungsfunktion
 * @param inputs Die Eingabewerte für die Berechnung
 * @param deps Zusätzliche Abhängigkeiten
 * @returns Das Ergebnis der Berechnung
 */
export function useMemoizedComputation<TInputs extends any[], TResult>(
  computeFunc: (...inputs: TInputs) => TResult,
  inputs: TInputs,
  deps: DependencyList = []
): TResult {
  return useMemo(() => computeFunc(...inputs), [...inputs, ...deps]);
}

/**
 * Memoize eine Komponente mit React.memo und expliziten Props
 * @param Component Die zu memoisierte Komponente
 * @param propsAreEqual Optionale Funktion zum Vergleich der Props
 * @returns Die memoizierte Komponente
 */
export function memoizeComponent<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component, propsAreEqual);
}