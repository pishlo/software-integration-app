import { Pool, types, PoolClient } from 'pg';
import logger from '../../middleware/winston';

interface DBConfig {
  user: string | undefined;
  host: string | undefined;
  database: string | undefined;
  password: string | undefined;
  port: number;
  max: number;
  ssl: {
    rejectUnauthorized: boolean;
  };
}

const db_config: DBConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
  max: 10,
  ssl: {
    rejectUnauthorized: false, // Accept self-signed or AWS certs in dev
  },
};

const db_connection = new Pool(db_config);

// Override date parsing (type 1082 = DATE)
types.setTypeParser(1082, (val: string) => val);

// Verify the initial connection
db_connection.connect()
  .then((client: PoolClient) => {
    logger.info('✅ PostgreSQL Connected');
    client.release();
  })
  .catch((err: Error) => {
    logger.error('❌ PostgreSQL Connection Failed: ' + err.message);
  });

// Handle unexpected disconnections
db_connection.on('error', (_err: Error) => {
  logger.error('💥 Unexpected error on idle PostgreSQL client.');
});

export default db_connection;