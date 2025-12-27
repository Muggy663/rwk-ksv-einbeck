#!/bin/bash
# Setze Environment Variables in Vercel
vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_ID production
# Eingabe: restored-main

vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_ID preview  
# Eingabe: restored-main

vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_ID development
# Eingabe: restored-main

# Redeploy
vercel --prod