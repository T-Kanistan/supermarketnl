import express from 'express';
import { getStorefrontAnnouncements } from '../controllers/announcementController.js';
import { getStorefrontHomeBanner } from '../controllers/homeBannerController.js';
import { getStorefrontHomepageAbout } from '../controllers/homepageAboutController.js';
import { getStorefrontFaqs } from '../controllers/faqController.js';
import { getStorefrontTestimonials } from '../controllers/testimonialController.js';

const router = express.Router();

router.get('/announcements', getStorefrontAnnouncements);
router.get('/home-banner', getStorefrontHomeBanner);
router.get('/homepage-about', getStorefrontHomepageAbout);
router.get('/faqs', getStorefrontFaqs);
router.get('/testimonials', getStorefrontTestimonials);

export default router;
