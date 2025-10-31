// Schneller Test ob Gemini API Key funktioniert
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = 'AIzaSyD7MYDG91s3-m5dN-pI22KGx7RwqiYWSek';
const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-pro' });
    const result = await model.generateContent('Hallo, funktionierst du?');
    console.log('✅ Gemini funktioniert:', result.response.text());
  } catch (error) {
    console.error('❌ Gemini Fehler:', error.message);
  }
}

testGemini();