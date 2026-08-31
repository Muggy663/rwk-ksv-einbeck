/**
 * Hook für barrierefreie Tastaturinteraktionen
 */
"use client";

import { useCallback } from 'react';
import type { KeyboardEvent } from 'react';

type KeyboardEventHandler = (event: KeyboardEvent) => void;

interface A11yKeyboardOptions {
  onEnter?: KeyboardEventHandler;
  onSpace?: KeyboardEventHandler;
  onEscape?: KeyboardEventHandler;
  onArrowUp?: KeyboardEventHandler;
  onArrowDown?: KeyboardEventHandler;
  onArrowLeft?: KeyboardEventHandler;
  onArrowRight?: KeyboardEventHandler;
  preventDefault?: boolean;
}

/**
 * Hook für barrierefreie Tastaturinteraktionen
 * @param options - Konfigurationsoptionen
 * @returns KeyDown-Handler
 */
export function useA11yKeyboard(options: A11yKeyboardOptions = {}): KeyboardEventHandler {
  const {
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    preventDefault = true
  } = options;
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        if (onEnter) {
          if (preventDefault) event.preventDefault();
          onEnter(event);
        }
        break;
      case ' ':
        if (onSpace) {
          if (preventDefault) event.preventDefault();
          onSpace(event);
        }
        break;
      case 'Escape':
        if (onEscape) {
          if (preventDefault) event.preventDefault();
          onEscape(event);
        }
        break;
      case 'ArrowUp':
        if (onArrowUp) {
          if (preventDefault) event.preventDefault();
          onArrowUp(event);
        }
        break;
      case 'ArrowDown':
        if (onArrowDown) {
          if (preventDefault) event.preventDefault();
          onArrowDown(event);
        }
        break;
      case 'ArrowLeft':
        if (onArrowLeft) {
          if (preventDefault) event.preventDefault();
          onArrowLeft(event);
        }
        break;
      case 'ArrowRight':
        if (onArrowRight) {
          if (preventDefault) event.preventDefault();
          onArrowRight(event);
        }
        break;
      default:
        break;
    }
  }, [onEnter, onSpace, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, preventDefault]);
  
  return handleKeyDown;
}
