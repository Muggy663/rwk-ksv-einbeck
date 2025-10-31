const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: "AIzaSyD7MYDG91s3-m5dN-pI22KGx7RwqiYWSek" });

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hallo, funktionierst du?"
    });
    console.log("✅ Gemini funktioniert:", response.text);
  } catch (error) {
    console.error("❌ Gemini Fehler:", error.message);
  }
}

main();