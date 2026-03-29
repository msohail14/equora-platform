import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import './models/index.js';
import { applySchemaUpdates } from './config/schema-updates.js';
import { generalRateLimiter } from './middleware/rate-limit.middleware.js';
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
import paymentRoutes from './routes/payment.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import horseAvailabilityRoutes from './routes/horse-availability.routes.js';
import courseTemplateRoutes from './routes/course-template.routes.js';
import sessionFeedbackRoutes from './routes/session-feedback.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import lessonPackageRoutes from './routes/lesson-package.routes.js';
import stableDashboardRoutes from './routes/stable-dashboard.routes.js';
import coachDashboardRoutes from './routes/coach-dashboard.routes.js';
import placesRoutes from './routes/places.routes.js';
import obstacleTypeRoutes from './routes/obstacle-type.routes.js';
import firebaseAuthRoutes from './routes/firebase-auth.routes.js';
import magicLinkRoutes from './routes/magic-link.routes.js';
import invitationRoutes from './routes/invitation.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';
import initializeFirebase from './config/firebase.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || 6060);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const HOST = process.env.HOST || '0.0.0.0';

// Only use HTTPS when explicitly enabled and cert files exist (self-hosted VPS).
// Platforms like Railway handle SSL termination at the proxy level.
const CERT_PATH = process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/horse.atlasits.cloud/fullchain.pem';
const KEY_PATH = process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/horse.atlasits.cloud/privkey.pem';
const USE_HTTPS = process.env.USE_HTTPS === 'true' && fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH);

const FRONTEND_URL = IS_PRODUCTION
  ? (process.env.FRONTEND_URL_PROD || 'https://horse.atlasits.cloud')
  : (process.env.FRONTEND_URL_DEV || 'http://localhost:5173');

const allowedOrigins = [
  FRONTEND_URL,
  process.env.FRONTEND_URL_PROD,
  process.env.LANDING_URL,
  'https://admin.equorariding.com',
  'https://equorariding.com',
  'https://www.equorariding.com',
  'https://equestrian-platform.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
].filter(Boolean);
const uniqueOrigins = [...new Set(allowedOrigins)];

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(generalRateLimiter);
app.use(
  cors({
    origin: uniqueOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
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
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/horse-availability', horseAvailabilityRoutes);
app.use('/api/v1/course-templates', courseTemplateRoutes);
app.use('/api/v1/session-feedback', sessionFeedbackRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/packages', lessonPackageRoutes);
app.use('/api/v1/stable-dashboard', stableDashboardRoutes);
app.use('/api/v1/coach-dashboard', coachDashboardRoutes);
app.use('/api/v1/places', placesRoutes);
app.use('/api/v1/obstacle-types', obstacleTypeRoutes);
app.use('/api/v1/auth/firebase', firebaseAuthRoutes);
app.use('/api/v1/auth/magic-link', magicLinkRoutes);
app.use('/api/v1/invitations', invitationRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);

app.get('/', (req, res) => {
  res.send('Equestrian Backend API is running.');
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
    await sequelize.sync({ alter: true });
    console.log('Database tables synced.');
    await applySchemaUpdates();
    console.log('Schema updates applied successfully.');

    // Initialize Firebase Admin SDK (non-blocking — logs warning if no credentials)
    try {
      initializeFirebase();
      console.log('Firebase Admin SDK initialized.');
    } catch (e) {
      console.warn('Firebase Admin SDK not initialized:', e.message);
      console.warn('Firebase auth endpoints will not work until credentials are configured.');
    }

    if (USE_HTTPS) {
      const options = {
        key: fs.readFileSync(KEY_PATH),
        cert: fs.readFileSync(CERT_PATH),
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
