import { NextResponse } from 'next/server';
import packageJson from '../../../../package.json';

// Version wird automatisch aus package.json gelesen
export async function GET() {
  return NextResponse.json({ version: packageJson.version });
}
