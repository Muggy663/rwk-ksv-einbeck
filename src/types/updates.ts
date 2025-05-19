// src/types/updates.ts

export interface ChangelogEntry {
  version: string;
  date: string; // e.g., "31. Juli 2024"
  title: string;
  descriptionPoints: string[];
}
