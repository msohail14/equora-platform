import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import { applySchemaUpdates } from './config/schema-updates.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import mailRoutes from './routes/mail.routes.js';
import disciplineRoutes from './routes/discipline.routes.js';
import stableRoutes from './routes/stable.routes.js';
import arenaRoutes from './routes/arena.routes.js';
import horseRoutes from './routes/horse.routes.js';
import courseRoutes from './routes/course.routes.js';
import coachRoutes from './routes/coach.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import sessionRoutes from './routes/session.routes.js';
import coachAvailabilityRoutes from './routes/coach-availability.routes.js';
import riderRoutes from './routes/rider.routes.js';
import coachReviewRoutes from './routes/coach-review.routes.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 6060);

// Automatically configure based on NODE_ENV
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const HOST = IS_PRODUCTION ? (process.env.HOST || '0.0.0.0') : '0.0.0.0';
const USE_HTTPS = IS_PRODUCTION;

// SSL certificate paths (only used in production)
const CERT_PATH = process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/horse.atlasits.cloud/fullchain.pem';
const KEY_PATH = process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/horse.atlasits.cloud/privkey.pem';

// Frontend URL based on environment
const FRONTEND_URL = IS_PRODUCTION
  ? (process.env.FRONTEND_URL_PROD || 'https://horse.atlasits.cloud')
  : (process.env.FRONTEND_URL_DEV || 'http://localhost:5173');

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://192.168.43.2:5173',
  'http://192.168.29.2:5173',
  'https://horse.atlasits.cloud'
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(bodyParser.json());
app.use('/upload', express.static(path.join(process.cwd(), 'upload')));
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/disciplines', disciplineRoutes);
app.use('/api/v1/stables', stableRoutes);
app.use('/api/v1/arenas', arenaRoutes);
app.use('/api/v1/horses', horseRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/coaches', coachRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/coach-availability', coachAvailabilityRoutes);
app.use('/api/v1/riders', riderRoutes);
app.use('/api/v1/coach-reviews', coachReviewRoutes);
app.use('/api/v1/mail', mailRoutes);

app.get('/', (req, res) => {
  res.send('Horse Riding Backend API is running.');
});

app.use((error, _req, res, _next) => {
  if (error) {
    return res.status(400).json({ message: error.message || 'Request failed.' });
  }
  return res.status(500).json({ message: 'Internal server error.' });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    await applySchemaUpdates();
    console.log('Schema updates applied successfully.');

    if (USE_HTTPS) {
      const options = {
        key: fs.readFileSync(KEY_PATH),
        cert: fs.readFileSync(CERT_PATH),
        // ca: fs.readFileSync(CA_BUNDLE_PATH),
      };

      https.createServer(options, app).listen(PORT, () => {
        console.log(`HTTPS server running at https://horse.atlasits.cloud:${PORT}`);
        console.log(`Allowed frontend origin: ${FRONTEND_URL}`);
      });
      return;
    }

    app.listen(PORT, HOST, () => {
      console.log(`HTTP server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

startServer();
