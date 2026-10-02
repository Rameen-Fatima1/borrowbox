require('dotenv').config();
const { Pool, types } = require('pg');
types.setTypeParser(1082, v => v); // keep DATE as 'YYYY-MM-DD' string
module.exports = new Pool({ connectionString: process.env.DATABASE_URL });
