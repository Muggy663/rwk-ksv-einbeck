import React from 'react';
import { cn } from '@/lib/utils';

interface NativeSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  onValueChange?: (value: string) => void;
}

export function NativeSelect({ 
  placeholder = "Auswählen...", 
  options, 
  className,
  onValueChange,
  ...props 
}: NativeSelectProps) {
  return (
    <select
      className={cn(
        "w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:max-h-48 [&>option]:overflow-y-auto",
        className
      )}
      onChange={(e) => onValueChange?.(e.target.value)}
      {...props}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((option) => (
        <option 
          key={option.value} 
          value={option.value} 
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}