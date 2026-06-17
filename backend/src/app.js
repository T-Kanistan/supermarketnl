import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse requests of content-type - application/json and application/x-www-form-urlencoded
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Simple logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Serve uploaded assets statically
app.use('/uploads', express.static(path.join(process.cwd(), 'src/uploads')));

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base health-check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Wins Wereld Winkel Supermarket API is running',
  });
});

// Handle non-existent endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at endpoint: ${req.originalUrl}`,
  });
});

// Global central exception formatter
app.use(errorHandler);

export default app;
