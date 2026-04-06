const fs = require('node:fs');
const path = require('node:path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const [key, ...rest] = line.split('=');
    if (!process.env[key]) process.env[key] = rest.join('=').trim();
  }
}

loadEnvFile(path.join(process.cwd(), '.env'));
loadEnvFile(path.join(process.cwd(), 'server', '.env'));

module.exports = {
  port: Number(process.env.PORT || 3001),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowedStudentDomains: (process.env.ALLOWED_STUDENT_DOMAINS || '.edu,cpp.edu').split(',').map((value) => value.trim()).filter(Boolean),
  paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
  emailProvider: process.env.EMAIL_PROVIDER || 'mock',
  pushProvider: process.env.PUSH_PROVIDER || 'mock',
  universityProvider: process.env.UNIVERSITY_PROVIDER || 'mock',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeCurrency: process.env.STRIPE_CURRENCY || 'usd',
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'no-reply@example.edu',
  fcmServerKey: process.env.FCM_SERVER_KEY || '',
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS || 72)
};
