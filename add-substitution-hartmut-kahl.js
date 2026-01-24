/**
 * Script to add substitution data for Hartmut Kahl being replaced by Martin Baselt from DG3
 * This should be run in the Firebase console or through a Firebase admin script
 */

// This is the data structure that needs to be added to the team_substitutions collection
const substitutionData = {
  competitionYear: 2026, // Adjust as needed
  teamId: "SGi_Einbeck_Team_ID", // Replace with actual team ID for SGi Einbeck e.V. I
  originalShooterId: "hartmut_kahl_shooter_id", // Replace with Hartmut Kahl's actual shooter ID
  originalShooterName: "Hartmut Kahl",
  replacementShooterId: "martin_baselt_shooter_id", // Replace with Martin Baselt's actual shooter ID
  replacementShooterName: "Martin Baselt",
  fromRound: 3, // DG3
  reason: "Ersatz ab DG3",
  type: "replaced_shooter", // New type to indicate this is a replaced shooter, not a substitute
  createdAt: new Date(),
  createdBy: "admin"
};

// To add this to Firestore, you would use:
// await db.collection('team_substitutions').add(substitutionData);

console.log("Substitution data to add:", JSON.stringify(substitutionData, null, 2));

// Instructions:
// 1. Find the actual team ID for "SGi Einbeck e.V. I" in the rwk_teams collection
// 2. Find the actual shooter IDs for Hartmut Kahl and Martin Baselt in the shooters collection
// 3. Replace the placeholder IDs above with the actual IDs
// 4. Add this document to the team_substitutions collection in Firestore
// 5. The UI will automatically detect this and show Hartmut Kahl as "replaced" with total score instead of average