import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

dotenv.config({ path: path.resolve(__dirname, '..', envFile) });
dotenv.config();

// Support both custom DB_* vars and Railway's auto-injected MYSQL* vars
const dbName     = process.env.DB_NAME     || process.env.MYSQLDATABASE;
const dbUser     = process.env.DB_USER     || process.env.MYSQLUSER;
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD;
const dbHost     = process.env.DB_HOST     || process.env.MYSQLHOST;
const dbPort     = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306);

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,  // Railway uses self-signed certs
    } : undefined,
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
