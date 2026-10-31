import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

// Module Routes
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import plansRoutes from './modules/plans/plans.routes';
import discountsRoutes from './modules/discounts/discounts.routes';
import subscriptionsRoutes from './modules/subscriptions/subscriptions.routes';
import invoicesRoutes from './modules/invoices/invoices.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import jobsRoutes from './modules/jobs/jobs.routes';

export const createApp = (): Application => {
  const app = express();

  // Security & Utility Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: [env.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // System Health Check Endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Brightloop Subscription Management System API',
      version: '1.0.0',
    });
  });

  // API v1 Routing
  const apiRouter = express.Router();
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/products', productsRoutes);
  apiRouter.use('/plans', plansRoutes);
  apiRouter.use('/discounts', discountsRoutes);
  apiRouter.use('/subscriptions', subscriptionsRoutes);
  apiRouter.use('/invoices', invoicesRoutes);
  apiRouter.use('/payments', paymentsRoutes);
  apiRouter.use('/analytics', analyticsRoutes);
  apiRouter.use('/jobs', jobsRoutes);

  app.use('/api/v1', apiRouter);

  // 404 & Global Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
