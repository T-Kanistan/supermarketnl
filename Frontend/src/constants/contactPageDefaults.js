export const defaultContactPage = {
  heroBadge: 'GET IN TOUCH',
  heroTitle: 'Contact Us',
  heroSubtitle: "We're here to help. Reach out to us anytime for any assistance.",
  heroFeature1: 'Quick Support',
  heroFeature2: 'Fast Response',
  heroFeature3: 'We Care',
  infoCardTitle: 'Contact Information',
  infoCardSubtitle: 'Find our phone, email, location, and opening hours below.',
  phoneSubtext: '',
  emailNote: 'We reply within 24 hours',
  formTitle: 'Send Us a Message',
  formSubtitle: 'Fill in the form below and we will get back to you.',
  nameLabel: 'Full Name',
  namePlaceholder: 'Enter your full name',
  emailLabel: 'Email Address',
  emailPlaceholder: 'Enter your email address',
  phoneLabel: 'Phone Number',
  phonePlaceholder: 'Enter your phone number',
  subjectLabel: 'Subject',
  subjectPlaceholder: 'Enter the subject',
  messageLabel: 'Message',
  messagePlaceholder: 'Write your message here...',
  submitButtonText: 'Send Message',
  privacyNote: 'Your information is safe with us. We never share your details.',
  holidayHours: 'Opens as Announced',
  helpBoxText: 'Need help?',
  helpBoxSubtext: 'Call us anytime',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2436.4673891781285!2d4.8951679!3d52.3702157!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c609c0c20c4333%3A0x8bb8f01c23f2f0!2sAmsterdam%2C%20Netherlands!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus',
};

export const mergeContactPage = (data) => ({
  ...defaultContactPage,
  ...data,
});

export const emptyContactPageForm = () => ({ ...defaultContactPage });
