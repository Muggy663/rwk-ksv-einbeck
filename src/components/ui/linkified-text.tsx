"use client";

import React from 'react';

/**
 * Zeigt Freitext an und ersetzt darin enthaltene URLs durch kurze, klickbare
 * Links. Damit läuft z. B. eine sehr lange Google-Maps-URL nicht mehr aus dem
 * Kasten, sondern erscheint als kompakter Link ("📍 Karte öffnen").
 *
 * Sicherheit: Es wird KEIN dangerouslySetInnerHTML verwendet. Der Nicht-URL-Text
 * wird als reiner React-Textknoten gerendert; nur echte http(s)-URLs werden zu
 * Links. Fremde Links erhalten rel="noopener noreferrer" und target="_blank".
 */
export function LinkifiedText({ text, className }: { text?: string | null; className?: string }) {
  const value = String(text || '');
  if (!value) return null;

  // URLs (http/https) finden. Bewusst simpel gehalten; erfasst die typischen
  // Kartenlinks. Nachfolgende schließende Klammern/Satzzeichen werden nicht
  // mit in die URL gezogen.
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const isMapLink = (url: string): boolean =>
    /google\.[^/]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl|\/maps\/place/i.test(url);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = urlRegex.exec(value)) !== null) {
    const url = match[0];
    const start = match.index;

    // Text vor der URL
    if (start > lastIndex) {
      parts.push(<span key={`t-${key++}`}>{value.slice(lastIndex, start)}</span>);
    }

    parts.push(
      <a
        key={`l-${key++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline break-all"
      >
        {isMapLink(url) ? '📍 Karte öffnen' : '🔗 Link öffnen'}
      </a>
    );

    lastIndex = start + url.length;
  }

  // Restlicher Text nach der letzten URL
  if (lastIndex < value.length) {
    parts.push(<span key={`t-${key++}`}>{value.slice(lastIndex)}</span>);
  }

  return <span className={className}>{parts}</span>;
}
