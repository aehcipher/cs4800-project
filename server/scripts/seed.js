const { databasePath, writeDatabase } = require('../data/storage');
const { makeSeedDatabase } = require('../data/seedData');

const database = makeSeedDatabase();
writeDatabase(database);
console.log(`Seeded demo data at ${databasePath}`);
