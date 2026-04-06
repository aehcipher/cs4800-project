const crypto = require('node:crypto');

function generateId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function nowIso() {
  return new Date().toISOString();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  if (!storedValue || !storedValue.includes(':')) return false;
  const [salt, hash] = storedValue.split(':');
  const compare = crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return hash === compare;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, mfaSecret, ...safeUser } = user;
  return safeUser;
}

function average(numbers) {
  if (!numbers.length) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function calculateQuantity(startAt, endAt, pricingUnit) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const diffMs = Math.max(end - start, 0);
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  const week = 7 * day;
  if (pricingUnit === 'hourly') return Math.max(1, Math.ceil(diffMs / hour));
  if (pricingUnit === 'weekly') return Math.max(1, Math.ceil(diffMs / week));
  return Math.max(1, Math.ceil(diffMs / day));
}

module.exports = { average, calculateQuantity, generateId, hashPassword, nowIso, sanitizeUser, verifyPassword };
