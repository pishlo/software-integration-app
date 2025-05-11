// index.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment-specific .env file
const envFile = `.env.${process.env.NODE_ENV || 'dev'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const startApp = require('./boot/setup').startApp;

(() => {
  try {
    startApp();
  } catch (error) {
    console.log('Error in index.js => startApp');
    console.log(`Error; ${JSON.stringify(error, undefined, 2)}`);
  }
})();
