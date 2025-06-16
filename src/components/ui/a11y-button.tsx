/**
 * Barrierefreier Button für nicht-Button-Elemente
 */
"use client";

import React, { KeyboardEvent, MouseEvent } from 'react';

interface A11yButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  label?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Macht ein Element zu einem barrierefreien Button
 */
export function A11yButton({
  onClick,
  label,
  disabled = false,
  children,
  className = '',
  ...props
}: A11yButtonProps) {
  // Tastatur-Handler für Enter und Space
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick && onClick(e as unknown as MouseEvent<HTMLDivElement>);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      {...props}
    >
      {children}
    </div>
  );
}