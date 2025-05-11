import { Pool, types, PoolClient } from 'pg';
import logger from '../../middleware/winston';

interface DBConfig {
  user: string | undefined;
  host: string | undefined;
  database: string | undefined;
  password: string | undefined;
  port: number;
  max: number;
}

const db_config: DBConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
  max: 10,
};

let db_connection: Pool;

// Start the PostgreSQL connection
function startConnection(): void {
  // Override date parsing (type 1082 = DATE)
  types.setTypeParser(1082, (val: string) => val);

  db_connection = new Pool(db_config);

  db_connection.connect((err: Error, _client: PoolClient) => {
    if (!err) {
      logger.info('PostgreSQL Connected');
    } else {
      logger.error('PostgreSQL Connection Failed: ' + err.message);
    }
  });

  db_connection.on('error', (_err: Error, _client: PoolClient) => {
    logger.error('Unexpected error on idle PostgreSQL client, reconnecting...');
    startConnection();
  });
}

startConnection();

export default db_connection;