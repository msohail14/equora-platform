import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

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
});

export default sequelize;
