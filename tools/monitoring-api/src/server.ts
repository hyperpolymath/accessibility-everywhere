import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createArangoDBService } from '@accessibility-everywhere/core';
import { createScanner } from '@accessibility-everywhere/scanner';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import { scanRouter } from './routes/scan';
import { violationsRouter } from './routes/violations';
import { leaderboardRouter } from './routes/leaderboard';
import { badgeRouter } from './routes/badge';
import { statsRouter } from './routes/stats';
import { dashboardRouter } from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/v1/', limiter);

// Initialize database
export const db = createArangoDBService();
export const scanner = createScanner();

// Initialize database connection
async function initializeDatabase() {
  try {
    await db.initialize();
    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    process.exit(1);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API version info
app.get('/v1', (req, res) => {
  res.json({
    name: 'Accessibility Everywhere Monitoring API',
    version: '1.0.0',
    description: 'Accessibility violation reporting and analytics API',
    endpoints: {
      scan: '/v1/scan',
      violations: '/v1/violations',
      leaderboard: '/v1/leaderboard',
      badge: '/v1/badge/:domain',
      stats: '/v1/stats',
      dashboard: '/v1/dashboard/:orgId',
    },
    documentation: 'https://docs.accessibility-everywhere.org/api',
  });
});

// Routes
app.use('/v1/scan', scanRouter);
app.use('/v1/violations', violationsRouter);
app.use('/v1/leaderboard', leaderboardRouter);
app.use('/v1/badge', badgeRouter);
app.use('/v1/stats', statsRouter);
app.use('/v1/dashboard', dashboardRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404,
    },
  });
});

// Start server
async function startServer() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`✓ Accessibility Everywhere API listening on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log(`✓ API docs: http://localhost:${PORT}/v1`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
