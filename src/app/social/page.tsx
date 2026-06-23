"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Social Training wurde deaktiviert — Weiterleitung zur Startseite
export default function SocialPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/'); }, [router]);
  return null;
}
