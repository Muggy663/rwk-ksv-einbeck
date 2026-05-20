import { NextResponse } from 'next/server';

// Diese Route war ein einmaliger Datenreparatur-Fix (Substitution kSFh1TtpCIQjheWJRO1q)
// und wurde am 2025-05-19 deaktiviert.
// Für zukünftige Datenreparaturen bitte direkt die Firebase Admin Console
// oder ein separates Admin-Script verwenden.

export async function POST() {
  return NextResponse.json(
    { error: 'Diese Route ist deaktiviert.' },
    { status: 410 }
  );
}
