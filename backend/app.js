import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import feeRoutes from './routes/fee.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import reportRoutes from './routes/report.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import supabase from './config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration - Supports same-origin production as well as localhost dev
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. same-origin, curl, server-to-server)
      if (!origin) return callback(null, true);
      // In development or if explicitly configured
      if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow any vercel deployment preview / production domain if from the same deployment
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Rate Limiting (Serverless & Proxy aware)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);

// Health check & diagnostic endpoint
app.get('/api/health', async (req, res) => {
  try {
    const hasUrl = !!process.env.SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasJwt = !!process.env.JWT_SECRET;

    if (!hasUrl || !hasKey) {
      return res.status(500).json({
        status: 'error',
        message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.',
        envStatus: { SUPABASE_URL: hasUrl, SUPABASE_SERVICE_ROLE_KEY: hasKey, JWT_SECRET: hasJwt }
      });
    }

    const { data: userCount, error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    
    if (error) {
      return res.status(500).json({
        status: 'db_error',
        message: error.message,
        hint: 'Check if Supabase database tables (users table) have been created.',
        envStatus: { SUPABASE_URL: hasUrl, SUPABASE_SERVICE_ROLE_KEY: hasKey }
      });
    }

    res.json({
      status: 'ok',
      database: 'Supabase PostgreSQL connected',
      usersFound: userCount ?? 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'exception',
      message: err.message
    });
  }
});

// Base API route
app.get('/api', (req, res) => {
  res.json({
    message: 'Fun N Learn Smart School API (Supabase PostgreSQL) is operational',
    version: '1.0.0'
  });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
