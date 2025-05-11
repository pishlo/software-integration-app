import * as dotenv from 'dotenv';
import * as path from 'path';

const envFile = `.env.${process.env.NODE_ENV || 'dev'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

import { startApp } from './boot/setup';

(() => {
  try {
    startApp();
  } catch (error) {
    console.error('Error in index.ts => startApp');
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
  }
})();
