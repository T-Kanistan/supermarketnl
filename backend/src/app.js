import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import homeBannerRoutes from './routes/homeBannerRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import contactSettingsRoutes from './routes/contactSettingsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import aboutRoutes from './routes/aboutRoutes.js';
import aboutUsRoutes from './routes/aboutUsRoutes.js';
import productRoutes from './routes/productRoutes.js';
import foodCornerRoutes from './routes/foodCornerRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import footerRoutes from './routes/footerRoutes.js';
import homepageAboutRoutes from './routes/homepageAboutRoutes.js';
import legalPagesRoutes from './routes/legalPagesRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import adminEnquiryRoutes from './routes/adminEnquiryRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import managerDashboardRoutes from './routes/managerDashboardRoutes.js';
import quickActionRoutes from './routes/quickActionRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import storefrontRoutes from './routes/storefrontRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import jobApplicationRoutes from './routes/jobApplicationRoutes.js';
import adminJobApplicationRoutes from './routes/adminJobApplicationRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import adminApplicationRoutes from './routes/adminApplicationRoutes.js';
import adminDashboardRoutes from './routes/adminDashboardRoutes.js';
import managerJobApplicationRoutes from './routes/managerJobApplicationRoutes.js';
import vacancyRoutes from './routes/vacancyRoutes.js';
import adminVacancyRoutes from './routes/adminVacancyRoutes.js';
import jobEnquiryRoutes from './routes/jobEnquiryRoutes.js';
import adminJobEnquiryRoutes from './routes/adminJobEnquiryRoutes.js';
import managerJobEnquiryRoutes from './routes/managerJobEnquiryRoutes.js';
import careersRoutes from './routes/careersRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';
import { isMongoConnected } from './config/mongo.js';
import { UPLOAD_ROOT } from './config/paths.js';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

const corsOrigins = new Set(
  (process.env.CORS_ORIGINS || defaultCorsOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logger (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Serve uploaded assets statically
app.use('/uploads', express.static(UPLOAD_ROOT));

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/manager', managerDashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api', quickActionRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/home-banner', homeBannerRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contact-settings', contactSettingsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/about-us', aboutUsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/food-corner', foodCornerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/footer', footerRoutes);
app.use('/api/homepage-about', homepageAboutRoutes);
app.use('/api/legal-pages', legalPagesRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/admin/enquiries', adminEnquiryRoutes);
app.use('/api/job-applications', jobApplicationRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin/job-applications', adminJobApplicationRoutes);
app.use('/api/admin/applications', adminApplicationRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/manager/job-applications', managerJobApplicationRoutes);
app.use('/api/vacancies', vacancyRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/admin/vacancies', adminVacancyRoutes);
app.use('/api/job-enquiries', jobEnquiryRoutes);
app.use('/api/admin/job-enquiries', adminJobEnquiryRoutes);
app.use('/api/manager/job-enquiries', managerJobEnquiryRoutes);

app.get('/api/db-status', (req, res) => {
  const connected = isMongoConnected();
  const readyState = mongoose.connection.readyState;
  const message = connected ? 'Database Connected' : 'Database Disconnected';

  res.status(connected ? 200 : 503).json({
    success: connected,
    message,
    readyState,
    host: mongoose.connection.host || null,
    database: mongoose.connection.name || null,
  });
});

// Base health-check route (used by Railway/Render probes)
app.get('/', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus =
    mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected';

  res.status(200).json({
    success: true,
    message: 'Wins Wereld Winkel Supermarket API is running',
    mongo: mongoStatus,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get('/health', (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  res.status(mongoReady ? 200 : 503).json({
    success: mongoReady,
    mongo: mongoReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
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
