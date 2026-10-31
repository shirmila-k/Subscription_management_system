import { createApp } from './app';
import { env } from './config/env';
import { CronJobManager } from './modules/jobs/cron.jobs';
import prisma from './config/db';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log('====================================================');
  console.log(`🚀 Brightloop Subscription Backend is running!`);
  console.log(`📡 Environment: ${env.nodeEnv}`);
  console.log(`🔗 API Base: http://localhost:${env.port}/api/v1`);
  console.log(`🩺 Health:   http://localhost:${env.port}/health`);
  console.log('====================================================');

  // Start cron jobs in non-test environments
  if (env.nodeEnv !== 'test') {
    CronJobManager.init();
  }
});

// Graceful Shutdown Handler
const handleShutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

  // Stop cron tasks
  CronJobManager.stopAll();

  // Close HTTP server
  server.close(async () => {
    console.log('[Server] HTTP server closed.');

    // Disconnect Prisma
    await prisma.$disconnect();
    console.log('[Database] Prisma client disconnected.');

    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('[Server] Forceful shutdown initiated due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;

