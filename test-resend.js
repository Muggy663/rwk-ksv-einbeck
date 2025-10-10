// Test Resend API direkt
const { Resend } = require('resend');

const resend = new Resend('re_WG4PESZR_HB6Lh4ffTjPsPPLuNo37bo5Q');

async function testResend() {
  try {
    console.log('🧪 Teste Resend API...');
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'jjikahle@web.de',
      subject: '🧪 Resend Test',
      text: 'Test-E-Mail von Resend API'
    });
    
    console.log('✅ Erfolg:', result);
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

testResend();