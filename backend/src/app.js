import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import homeBannerRoutes from './routes/homeBannerRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import contactSettingsRoutes from './routes/contactSettingsRoutes.js';
import aboutUsRoutes from './routes/aboutUsRoutes.js';
import productRoutes from './routes/productRoutes.js';
import foodCornerRoutes from './routes/foodCornerRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import footerRoutes from './routes/footerRoutes.js';
import homepageAboutRoutes from './routes/homepageAboutRoutes.js';
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

const app = express();

const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://wins-wereld-winkel.netlify.app',
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
      if (!origin || corsOrigins.has(origin) || origin.endsWith('.netlify.app')) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Simple logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Serve uploaded assets statically
app.use('/uploads', express.static(path.join(process.cwd(), 'src/uploads')));

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
app.use('/api/about-us', aboutUsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/food-corner', foodCornerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/footer', footerRoutes);
app.use('/api/homepage-about', homepageAboutRoutes);
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
