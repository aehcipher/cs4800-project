const fs = require('node:fs');
const path = require('node:path');

const databasePath = path.join(__dirname, 'database.json');

function createEmptyDatabase() {
  return {
    users: [],
    sessions: [],
    emailVerifications: [],
    listings: [],
    bookings: [],
    payments: [],
    escrows: [],
    conversations: [],
    messages: [],
    conditionReports: [],
    reviews: [],
    disputes: [],
    notifications: [],
    auditLogs: [],
    settings: {
      commissionRate: 0.1
    }
  };
}

function ensureDatabase() {
  if (!fs.existsSync(databasePath)) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    fs.writeFileSync(databasePath, JSON.stringify(createEmptyDatabase(), null, 2));
  }
}

function readDatabase() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(databasePath, 'utf8'));
}

function writeDatabase(database) {
  ensureDatabase();
  fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));
}

module.exports = { createEmptyDatabase, databasePath, ensureDatabase, readDatabase, writeDatabase };
