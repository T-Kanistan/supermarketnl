import mongoose from 'mongoose';

const heroSectionSchema = new mongoose.Schema(
  {
    heroBadge: { type: String, default: 'GET IN TOUCH', trim: true },
    heroTitle: { type: String, default: 'CONTACT US', trim: true },
    heroSubtitle: { type: String, default: "We're here to help. Reach out to us anytime." },
    heroFeature1: { type: String, default: 'Quick Support', trim: true },
    heroFeature2: { type: String, default: 'Fast Response', trim: true },
    heroFeature3: { type: String, default: 'We Care', trim: true },
  },
  { _id: false }
);

const contactFormSettingsSchema = new mongoose.Schema(
  {
    formTitle: { type: String, default: 'SEND US A MESSAGE', trim: true },
    formSubtitle: { type: String, default: 'Fill in the form below and we will get back to you.' },
    submitButtonText: { type: String, default: 'SEND MESSAGE', trim: true },
    fullNameLabel: { type: String, default: 'Full Name', trim: true },
    fullNamePlaceholder: { type: String, default: 'Enter your full name', trim: true },
    emailLabel: { type: String, default: 'Email Address', trim: true },
    emailPlaceholder: { type: String, default: 'Enter your email address', trim: true },
    phoneLabel: { type: String, default: 'Phone Number', trim: true },
    phonePlaceholder: { type: String, default: 'Enter your phone number', trim: true },
    subjectLabel: { type: String, default: 'Subject', trim: true },
    subjectPlaceholder: { type: String, default: 'Enter the subject', trim: true },
    messageLabel: { type: String, default: 'Message', trim: true },
    messagePlaceholder: { type: String, default: 'Write your message here...', trim: true },
    privacyNote: { type: String, default: 'Your information is safe with us. We never share your details.' },
  },
  { _id: false }
);

const helpBoxSchema = new mongoose.Schema(
  {
    helpBoxTitle: { type: String, default: 'Need help?', trim: true },
    helpBoxSubtitle: { type: String, default: 'Call us anytime', trim: true },
  },
  { _id: false }
);

const infoCardSchema = new mongoose.Schema(
  {
    infoCardTitle: { type: String, default: 'Contact Information', trim: true },
    infoCardSubtitle: {
      type: String,
      default: 'Find our phone, email, location, and opening hours below.',
      trim: true,
    },
  },
  { _id: false }
);

const contactCmsSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, default: '+31659046526', trim: true },
    phoneSubtext: { type: String, default: '', trim: true },
    email: { type: String, default: 'info@winswereldwinkel.nl', trim: true },
    emailSubtext: { type: String, default: 'We reply within 24 hours', trim: true },
    storeName: { type: String, default: 'Ins Wereld Winkel', trim: true },
    address: { type: String, default: 'Amsterdam, Netherlands', trim: true },
    supermarketHours: { type: String, default: '8:00 AM - 10:00 PM', trim: true },
    foodCornerHours: { type: String, default: '11:00 AM - 11:00 PM', trim: true },
    holidayNote: { type: String, default: 'Opens as Announced', trim: true },
    heroSection: { type: heroSectionSchema, default: () => ({}) },
    contactFormSettings: { type: contactFormSettingsSchema, default: () => ({}) },
    helpBox: { type: helpBoxSchema, default: () => ({}) },
    infoCard: { type: infoCardSchema, default: () => ({}) },
    googleMapUrl: {
      type: String,
      default:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2436.4673891781285!2d4.8951679!3d52.3702157!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c609c0c20c4333%3A0x8bb8f01c23f2f0!2sAmsterdam%2C%20Netherlands!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus',
    },
  },
  { timestamps: true }
);

export const getDefaultContactCMS = () => ({
  phoneNumber: '+31659046526',
  phoneSubtext: '',
  email: 'info@winswereldwinkel.nl',
  emailSubtext: 'We reply within 24 hours',
  storeName: 'Ins Wereld Winkel',
  address: 'Amsterdam, Netherlands',
  supermarketHours: '8:00 AM - 10:00 PM',
  foodCornerHours: '11:00 AM - 11:00 PM',
  holidayNote: 'Opens as Announced',
  heroSection: {},
  contactFormSettings: {},
  helpBox: {},
  googleMapUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2436.4673891781285!2d4.8951679!3d52.3702157!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c609c0c20c4333%3A0x8bb8f01c23f2f0!2sAmsterdam%2C%20Netherlands!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus',
});

const ContactCMS = mongoose.model('ContactCMS', contactCmsSchema, 'contactsettings');

export default ContactCMS;
