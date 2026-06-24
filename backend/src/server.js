import { logStartupEnvironment } from './config/env.js';
import connectMongo, { disconnectMongo } from './config/mongo.js';
import { migrateProductStatus } from './migrations/migrateProductStatus.js';
import { migrateShowOnHomepage } from './migrations/migrateShowOnHomepage.js';
import { seedPageBanners } from './migrations/migratePageBanners.js';
import { verifySmtpConnection } from './services/emailService.js';
import { isCloudinaryConfigured } from './services/uploadService.js';
import app from './app.js';
import { startAnnouncementExpiryJob } from './jobs/announcementExpiryJob.js';

logStartupEnvironment();

let server;

process.on('uncaughtException', (err) => {
  console.error(`[UNCAUGHT EXCEPTION] Error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

const startServer = async () => {
  const PORT = Number(process.env.PORT) || 5000;
  const HOST = '0.0.0.0';

  console.log('[Server] Starting Wins Wereld Winkel API...');

  await new Promise((resolve, reject) => {
    server = app.listen(PORT, HOST, () => {
      console.log(`[Server] Listening on http://${HOST}:${PORT}`);
      console.log(`[Server] Health check: http://${HOST}:${PORT}/`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      resolve();
    });

    server.on('error', (error) => {
      console.error(`[Server] Failed to bind to ${HOST}:${PORT}`);
      console.error(`[Server] Error: ${error.message}`);
      reject(error);
    });
  });

  try {
    console.log('[Server] Attempting MongoDB Atlas connection via MONGODB_URI...');
    await connectMongo();
    console.log('[Server] MongoDB Atlas connection established — database is ready.');
    await migrateProductStatus();
    await migrateShowOnHomepage();
    await seedPageBanners();
    startAnnouncementExpiryJob();
    await verifySmtpConnection();
    if (isCloudinaryConfigured()) {
      console.log('[Server] Cloudinary configured — uploads will persist to cloud storage.');
    } else {
      console.warn('[Server] Cloudinary not configured — uploads stored locally (not persistent on ephemeral hosts).');
    }
    console.log('[Server] Startup complete — MongoDB connected and routes ready.');
  } catch (error) {
    console.error('[SERVER STARTUP FAILED] MongoDB connection could not be established.');
    console.error(`[SERVER STARTUP FAILED] ${error.message}`);
    await new Promise((resolve) => {
      if (server) {
        server.close(() => resolve());
        return;
      }
      resolve();
    });
    process.exit(1);
  }

  const gracefulShutdown = async (signal) => {
    console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
    if (!server) {
      process.exit(0);
      return;
    }

    server.close(async () => {
      try {
        await disconnectMongo();
      } catch (error) {
        console.error(`[Server] Error during MongoDB disconnect: ${error.message}`);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    console.error(`[UNHANDLED REJECTION] Error: ${err.message}`);
    console.error(err.stack);
    if (server) {
      server.close(() => process.exit(1));
      return;
    }
    process.exit(1);
  });
};

startServer().catch((err) => {
  console.error(`[SERVER STARTUP FAILED] ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});
