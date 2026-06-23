import dotenv from 'dotenv';
import connectMongo from './config/mongo.js';
import app from './app.js';
import { startAnnouncementExpiryJob } from './jobs/announcementExpiryJob.js';

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error(`[UNCAUGHT EXCEPTION] Error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

// Load environment variables
dotenv.config();

const startServer = async () => {
  await connectMongo();

  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    startAnnouncementExpiryJob();
  });

  process.on('unhandledRejection', (err) => {
    console.error(`[UNHANDLED REJECTION] Error: ${err.message}`);
    console.error(err.stack);
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer().catch((err) => {
  console.error(`[SERVER STARTUP FAILED] ${err.message}`);
  process.exit(1);
});
