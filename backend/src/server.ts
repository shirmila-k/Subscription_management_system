import app from './app';
import { env } from './config/env';
import prisma from './config/prisma';
import { initCronJobs } from './modules/jobs/cronScheduler';

const server = app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(`Brightloop Subscription Management Backend API`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Server running at: http://localhost:${env.PORT}`);
  console.log(`Health endpoint:   http://localhost:${env.PORT}/health`);
  console.log(`=======================================================`);

  // Initialize automated background cron tasks
  initCronJobs();
});

// Graceful Shutdown Handlers
const handleShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Prisma database client disconnected.');
    process.exit(0);
  });

  // Force shutdown after 10s if stuck
  setTimeout(() => {
    console.error('Forcefully terminating process after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
