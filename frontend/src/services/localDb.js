// localDb.js - High-fidelity local database fallback for development and offline testing

const STORAGE_KEYS = {
  SETTINGS: 'supermarket_settings',
  BANNERS: 'supermarket_banners',
  CATEGORIES: 'supermarket_categories',
  PRODUCTS: 'supermarket_products',
  FAQS: 'supermarket_faqs',
  TESTIMONIALS: 'supermarket_testimonials',
  ANNOUNCEMENTS: 'supermarket_announcements',
  MESSAGES: 'supermarket_messages',
  MANAGERS: 'supermarket_managers',
};

import { defaultAboutPage } from '../constants/aboutPageDefaults';
import { defaultContactPage } from '../constants/contactPageDefaults';
import { defaultFooterPage } from '../constants/footerPageDefaults';

// Seed data based on existing static UI structures
const defaultSettings = {
  storeName: 'Ins Wereld Winkel',
  logo: '/logo.png',
  contactEmail: 'info@winswereldwinkel.nl',
  contactPhone: '+31659046526',
  address: 'Amsterdam, Netherlands',
  aboutUs: 'Your premium destination for high-quality groceries and fresh daily produce. We bring the world to your shopping cart with hand-picked items from across the globe, ensuring exceptional quality and value in every aisle.',
  footerDescription: 'Your premium destination for high-quality groceries and fresh daily produce. We bring the world to your shopping cart with hand-picked items from across the globe.',
  supermarketTimings: '8:00 AM - 10:00 PM',
  foodCornerTimings: '11:00 AM - 11:00 PM',
  aboutPage: defaultAboutPage,
  contactPage: defaultContactPage,
  footerPage: defaultFooterPage,
  socials: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    whatsapp: 'https://wa.me/31659046526',
    tiktok: 'https://tiktok.com',
    youtube: 'https://youtube.com',
  }
};

const defaultBanners = [
  {
    id: '1',
    title: 'FRESH PRODUCTS',
    highlightText: 'BETTER LIVING',
    subtitle: 'Your one-stop supermarket for quality products and great offers.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
    buttonText: 'EXPLORE PRODUCTS',
    buttonLink: '/products',
    buttonText2: 'EXPLORE FOOD CORNER',
    buttonLink2: '/food-corner',
    status: 'active',
  }
];

const defaultCategories = [
  { id: 'beverages-tea', name: 'Beverages & Tea', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=400', status: 'active' },
  { id: 'frozen-ready-to-eat', name: 'Frozen Ready to Eat', image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2a09c?auto=format&fit=crop&q=80&w=400', status: 'active' },
  { id: 'meat-seafoods', name: 'Meat & Seafoods', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=400', status: 'active' },
  { id: 'spices-masalas', name: 'Spices & Masalas', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400', status: 'active' },
  { id: 'vegetables-fruits', name: 'Vegetables & Fruits', image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&q=80&w=400', status: 'active' },
];

const defaultProducts = [
  // Grocery
  { id: '1', categoryId: 'vegetables-fruits', name: 'Premium Basmati Rice', weight: '5KG', price: 12.99, oldPrice: 15.99, image: '/images/basmati_rice.png', stock: 50, status: 'active', isFeatured: true, type: 'grocery' },
  { id: '2', categoryId: 'vegetables-fruits', name: 'Organic Cooking Oil', weight: '1L', price: 8.49, oldPrice: null, image: '/images/sunflower_oil.png', stock: 0, status: 'active', isFeatured: true, type: 'grocery' },
  { id: '3', categoryId: 'vegetables-fruits', name: 'Fresh Yellow Lentils', weight: '1KG', price: 4.99, oldPrice: 5.99, image: '/images/toor_dal.png', stock: 20, status: 'active', isFeatured: true, type: 'grocery' },
  { id: '4', categoryId: 'vegetables-fruits', name: 'Red Lentils', weight: '1KG', price: 5.49, oldPrice: null, image: '/images/red_lentils.png', stock: 30, status: 'active', isFeatured: false, type: 'grocery' },
  { id: '5', categoryId: 'vegetables-fruits', name: 'Wheat Flour', weight: '5KG', price: 6.99, oldPrice: 7.99, image: '/images/wheat_flour.png', stock: 15, status: 'active', isFeatured: false, type: 'grocery' },
  { id: '6', categoryId: 'vegetables-fruits', name: 'White Sugar', weight: '1KG', price: 2.49, oldPrice: null, image: '/images/white_sugar.png', stock: 0, status: 'active', isFeatured: false, type: 'grocery' },
  
  // Masala
  { id: '7', categoryId: 'spices-masalas', name: 'Curry Powder', weight: '500G', price: 3.99, oldPrice: 4.99, image: '/images/curry_powder.png', stock: 40, status: 'active', isFeatured: false, type: 'grocery' },
  { id: '8', categoryId: 'spices-masalas', name: 'Chili Powder', weight: '500G', price: 3.49, oldPrice: null, image: '/images/chili_powder.png', stock: 25, status: 'active', isFeatured: false, type: 'grocery' },
  { id: '9', categoryId: 'spices-masalas', name: 'Turmeric Powder', weight: '500G', price: 2.99, oldPrice: null, image: '/images/turmeric_powder.png', stock: 60, status: 'active', isFeatured: false, type: 'grocery' },

  // Vegetables
  { id: '10', categoryId: 'vegetables-fruits', name: 'Fresh Tomatoes', weight: '1KG', price: 1.99, oldPrice: 2.49, image: '/images/fresh_tomatoes.png', stock: 15, status: 'active', isFeatured: true, type: 'grocery' },
  { id: '11', categoryId: 'vegetables-fruits', name: 'Fresh Potatoes', weight: '1KG', price: 1.49, oldPrice: null, image: '/images/fresh_potatoes.png', stock: 20, status: 'active', isFeatured: false, type: 'grocery' },
  { id: '12', categoryId: 'vegetables-fruits', name: 'Fresh Onions', weight: '1KG', price: 1.79, oldPrice: null, image: '/images/fresh_onions.png', stock: 30, status: 'active', isFeatured: false, type: 'grocery' },

  // Sweets
  { id: '13', categoryId: 'beverages-tea', name: 'Premium Laddoos', weight: '500G', price: 7.99, oldPrice: 9.99, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400', stock: 20, status: 'active', isFeatured: true, type: 'grocery' },

  // Frozen
  { id: '14', categoryId: 'frozen-ready-to-eat', name: 'Fresh Seer Fish', weight: '1KG', price: 14.99, oldPrice: 17.99, image: '/images/fresh_potatoes.png', stock: 10, status: 'active', isFeatured: true, type: 'grocery' },

  // Food Corner Items (mapped to food type)
  { 
    id: 'fc1', name: 'Classic English Breakfast', price: 12.99, categoryId: 'Breakfast', 
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=600',
    rating: 4.8, reviews: 124, badge: 'Best Seller',
    startTime: '07:00', endTime: '11:00', displayTime: '7:00 AM - 11:00 AM', status: 'active', isFeatured: true, type: 'food'
  },
  { 
    id: 'fc2', name: 'Grilled Salmon Plate', price: 19.99, categoryId: 'Lunch', 
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=600',
    rating: 4.9, reviews: 89, badge: "Today's Special",
    startTime: '11:30', endTime: '15:00', displayTime: '11:30 AM - 3:00 PM', status: 'active', isFeatured: true, type: 'food'
  },
  { 
    id: 'fc3', name: 'Spicy Chicken Burger', price: 8.99, categoryId: 'Lunch', 
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
    rating: 4.6, reviews: 215, badge: 'Popular',
    startTime: '11:00', endTime: '22:00', displayTime: '11:00 AM - 10:00 PM', status: 'active', isFeatured: true, type: 'food'
  },
  { 
    id: 'fc4', name: 'Steak & Garlic Mash', price: 24.99, categoryId: 'Dinner', 
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
    rating: 4.9, reviews: 67, badge: 'Premium',
    startTime: '18:00', endTime: '23:00', displayTime: '6:00 PM - 11:00 PM', status: 'active', isFeatured: false, type: 'food'
  },
  { 
    id: 'fc5', name: 'Margherita Pizza', price: 14.99, categoryId: 'Dinner', 
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600',
    rating: 4.7, reviews: 342, badge: 'Limited Time Offer',
    startTime: '16:00', endTime: '23:00', displayTime: '4:00 PM - 11:00 PM', status: 'active', isFeatured: false, type: 'food'
  },
  { 
    id: 'fc6', name: 'Crispy French Fries', price: 4.99, categoryId: 'Snacks', 
    image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=600',
    rating: 4.5, reviews: 430, badge: null,
    startTime: '10:00', endTime: '22:00', displayTime: '10:00 AM - 10:00 PM', status: 'active', isFeatured: false, type: 'food'
  },
  { 
    id: 'fc7', name: 'Fresh Orange Juice', price: 3.49, categoryId: 'Beverages', 
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=600',
    rating: 4.8, reviews: 156, badge: null,
    startTime: '07:00', endTime: '22:00', displayTime: '7:00 AM - 10:00 PM', status: 'active', isFeatured: false, type: 'food'
  },
  { 
    id: 'fc8', name: 'Chocolate Lava Cake', price: 6.99, categoryId: 'Desserts', 
    image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&q=80&w=600',
    rating: 4.9, reviews: 201, badge: 'Best Seller',
    startTime: '12:00', endTime: '23:00', displayTime: '12:00 PM - 11:00 PM', status: 'active', isFeatured: false, type: 'food'
  }
];

const defaultFaqs = [
  { id: '1', question: '1. What are your store opening hours?', answer: 'Our store is open from Monday to Saturday 08:00 AM to 08:00 PM and on Sunday 10:00 AM to 06:00 PM.', status: 'active' },
  { id: '2', question: '2. Do you offer home delivery?', answer: 'Yes, we offer home delivery within a 10km radius of our store. Delivery charges may apply based on the distance.', status: 'active' },
  { id: '3', question: '3. What payment methods do you accept?', answer: 'We accept Cash, Debit/Credit Cards, Apple Pay, Google Pay, and other major contactless payment methods.', status: 'active' },
  { id: '4', question: '4. Can I place an order online?', answer: 'Yes, you can place an order online through our website or mobile app for both pickup and home delivery.', status: 'active' },
  { id: '5', question: '5. Do you have parking facilities?', answer: 'Yes, we have a dedicated parking lot for our customers right in front of the store.', status: 'active' },
];

const defaultTestimonials = [
  { id: '1', customerName: 'Sarah Johnson', rating: 5, review: 'Amazing quality! The fresh produce is always top-notch and delivery is super fast. Highly recommend this supermarket.', image: 'https://i.pravatar.cc/150?img=1', status: 'active' },
  { id: '2', customerName: 'Michael Chen', rating: 5, review: 'Great variety of international products. I can always find ingredients for any recipe here. The store is clean and well-organized.', image: 'https://i.pravatar.cc/150?img=11', status: 'active' },
  { id: '3', customerName: 'Emma Williams', rating: 4, review: 'Customer service is excellent. They helped me find exactly what I was looking for. Will definitely be coming back!', image: 'https://i.pravatar.cc/150?img=5', status: 'active' },
];

const defaultAnnouncements = [
  { id: '1', title: 'WEEKLY DEALS', description: 'Stock up on your daily essentials with our exclusive supermarket deals. Freshness guaranteed!', image: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80', offerPercentage: 30, startDate: '2026-06-01', endDate: '2026-06-30', status: 'active' },
  { id: '2', title: 'WEEKEND SPECIAL OFFER', description: 'Flat 30% OFF on Select Products', image: '', offerPercentage: 30, startDate: '2026-06-01', endDate: '2026-06-30', status: 'active' }
];

const defaultMessages = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+31600000000', subject: 'Inquiry about bulk order', message: 'Hello, do you support wholesale orders of basmati rice?', date: '2026-06-16T12:00:00.000Z', isRead: false }
];

const defaultManagers = [
  { id: '1', name: 'System Admin', email: 'admin@supermarket.com', password: 'admin123', role: 'admin' },
  { id: '2', name: 'John Manager', email: 'manager@supermarket.com', password: 'manager123', role: 'manager' }
];

const initDb = () => {
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BANNERS)) {
    localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(defaultBanners));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCategories));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FAQS)) {
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(defaultFaqs));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TESTIMONIALS)) {
    localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(defaultTestimonials));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(defaultAnnouncements));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(defaultMessages));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MANAGERS)) {
    localStorage.setItem(STORAGE_KEYS.MANAGERS, JSON.stringify(defaultManagers));
  }
};

// Initialize DB immediately
initDb();

const getCollection = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setCollection = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const localDb = {
  // Site settings
  getSettings: () => getCollection(STORAGE_KEYS.SETTINGS),
  saveSettings: (data) => {
    setCollection(STORAGE_KEYS.SETTINGS, data);
    return data;
  },

  // Banners
  getBanners: () => getCollection(STORAGE_KEYS.BANNERS),
  saveBanners: (data) => setCollection(STORAGE_KEYS.BANNERS, data),

  // Categories
  getCategories: () => getCollection(STORAGE_KEYS.CATEGORIES),
  saveCategories: (data) => setCollection(STORAGE_KEYS.CATEGORIES, data),

  // Products & Food Items
  getProducts: () => getCollection(STORAGE_KEYS.PRODUCTS),
  saveProducts: (data) => setCollection(STORAGE_KEYS.PRODUCTS, data),

  // FAQs
  getFaqs: () => getCollection(STORAGE_KEYS.FAQS),
  saveFaqs: (data) => setCollection(STORAGE_KEYS.FAQS, data),

  // Testimonials
  getTestimonials: () => getCollection(STORAGE_KEYS.TESTIMONIALS),
  saveTestimonials: (data) => setCollection(STORAGE_KEYS.TESTIMONIALS, data),

  // Announcements
  getAnnouncements: () => getCollection(STORAGE_KEYS.ANNOUNCEMENTS),
  saveAnnouncements: (data) => setCollection(STORAGE_KEYS.ANNOUNCEMENTS, data),

  // Messages
  getMessages: () => getCollection(STORAGE_KEYS.MESSAGES),
  saveMessages: (data) => setCollection(STORAGE_KEYS.MESSAGES, data),

  // Managers
  getManagers: () => getCollection(STORAGE_KEYS.MANAGERS),
  saveManagers: (data) => setCollection(STORAGE_KEYS.MANAGERS, data),
};
