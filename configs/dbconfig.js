require('dotenv').config()
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

client.connect();

module.exports = client