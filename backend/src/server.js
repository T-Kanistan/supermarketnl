import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error(`[UNCAUGHT EXCEPTION] Error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error(`[UNHANDLED REJECTION] Error: ${err.message}`);
  console.error(err.stack);
  server.close(() => {
    process.exit(1);
  });
});
