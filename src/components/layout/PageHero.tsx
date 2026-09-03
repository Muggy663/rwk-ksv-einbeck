import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PageHeroAccent = 'primary' | 'emerald' | 'amber' | 'blue' | 'purple' | 'red';

interface PageHeroProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  accent?: PageHeroAccent;
  /** Rechte Seite: z.B. Zurück-Button oder Aktionen */
  actions?: React.ReactNode;
  className?: string;
}

// Einheitlicher, moderner Seitenkopf (Gradient-Hero) für die gesamte App.
// Sorgt für konsistente Optik statt vieler unterschiedlicher Header.
const ACCENTS: Record<PageHeroAccent, { wrap: string; box: string; text: string; blob: string }> = {
  primary: {
    wrap: 'from-primary/10',
    box: 'from-primary to-emerald-600',
    text: 'from-primary via-emerald-600 to-primary',
    blob: 'bg-primary/10',
  },
  emerald: {
    wrap: 'from-emerald-500/10',
    box: 'from-emerald-500 to-teal-600',
    text: 'from-emerald-600 via-teal-600 to-emerald-600',
    blob: 'bg-emerald-500/10',
  },
  amber: {
    wrap: 'from-amber-500/10',
    box: 'from-amber-500 to-orange-600',
    text: 'from-amber-600 via-orange-600 to-amber-600',
    blob: 'bg-amber-500/10',
  },
  blue: {
    wrap: 'from-blue-500/10',
    box: 'from-blue-500 to-indigo-600',
    text: 'from-blue-600 via-indigo-600 to-blue-600',
    blob: 'bg-blue-500/10',
  },
  purple: {
    wrap: 'from-purple-500/10',
    box: 'from-purple-500 to-fuchsia-600',
    text: 'from-purple-600 via-fuchsia-600 to-purple-600',
    blob: 'bg-purple-500/10',
  },
  red: {
    wrap: 'from-red-500/10',
    box: 'from-red-500 to-rose-600',
    text: 'from-red-600 via-rose-600 to-red-600',
    blob: 'bg-red-500/10',
  },
};

export function PageHero({
  icon: Icon,
  title,
  description,
  accent = 'primary',
  actions,
  className,
}: PageHeroProps) {
  const a = ACCENTS[accent];
  return (
    <div
      className={cn(
        'relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br via-background to-background p-6 animate-fade-in',
        a.wrap,
        className
      )}
    >
      <div className={cn('absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl', a.blob)} />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-xl bg-gradient-to-br p-2.5 text-white shadow-lg', a.box)}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className={cn('bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent sm:text-3xl', a.text)}>
              {title}
            </h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions && <div className="w-full sm:w-auto">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHero;
