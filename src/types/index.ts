// Zentrale Exportdatei für alle Typdefinitionen
export * from './rwk';
export * from './documents';
export * from './updates';
export * from './km';
export * from './mannschaftsregeln';

// Allgemeine Typen, die projektübergreifend verwendet werden
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// Utility-Typen
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P];
};

// Typen für UI-Komponenten
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type Size = 'default' | 'sm' | 'lg' | 'icon';

// Typen für Formulare
export interface FormError {
  message: string;
  field?: string;
}

// Typen für API-Antworten
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Typen für React-Komponenten
export type ReactChildren = {
  children: React.ReactNode;
};

// Typen für Event-Handler
export type EventHandler<E extends React.SyntheticEvent = React.SyntheticEvent> = (
  event: E
) => void;

// Typen für asynchrone Funktionen
export type AsyncFunction<T = void> = () => Promise<T>;
export type AsyncFunctionWithParam<P, T = void> = (param: P) => Promise<T>;