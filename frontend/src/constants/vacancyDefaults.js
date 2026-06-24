/** Premium careers recruitment hero — full-width background */
export const VACANCY_HERO_BG =
  'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=2000';

export const DEPARTMENT_CARD_IMAGES = {
  supermarket: '/images/vacancies-dept-supermarket.jpg',
  foodCorner: '/images/vacancies-dept-foodcorner.jpg',
};

export const DEPARTMENT_CARD_BG = {
  supermarket: '/images/vacancies-dept-supermarket-bg.jpg',
  foodCorner: '/images/vacancies-dept-foodcorner-bg.jpg',
};

export const WHY_JOIN_US = [
  { id: 'environment', title: 'Great Work Environment', icon: 'environment' },
  { id: 'growth', title: 'Career Growth Opportunities', icon: 'growth' },
  { id: 'training', title: 'Training & Development', icon: 'training' },
  { id: 'team', title: 'Friendly Team', icon: 'team' },
  { id: 'benefits', title: 'Employee Benefits', icon: 'benefits' },
  { id: 'balance', title: 'Work-Life Balance', icon: 'balance' },
];

const baseVacancy = {
  location: 'Hilversum, Netherlands',
  status: 'Open',
  workingDays: 'Monday – Saturday',
  workingHours: '08:00 AM – 10:00 PM',
  cvRequired: true,
};

export const SUPERMARKET_VACANCIES = [
  {
    ...baseVacancy,
    id: 'sm-cashier',
    department: 'supermarket',
    departmentLabel: 'Supermarket',
    icon: 'cashier',
    title: 'Supermarket Cashier (Part Time)',
    employmentType: 'Part Time',
    cvRequired: true,
    type: 'Part-time',
    posted: '2025-06-10',
    closingDate: '2025-07-15',
    summary:
      'Provide friendly checkout service, handle payments accurately, and create a welcoming experience for every customer.',
    description:
      'We are looking for a reliable cashier to support daily supermarket operations. You will assist customers at checkout, maintain a tidy counter area, and work closely with the front-end team during busy periods.',
    responsibilities: [
      'Operate POS systems and process payments',
      'Assist customers with enquiries at checkout',
      'Maintain a clean and organised checkout area',
    ],
    requirements: [
      'Customer-focused attitude',
      'Basic numeracy and attention to detail',
      'Flexible availability including weekends',
    ],
  },
  {
    ...baseVacancy,
    id: 'sm-stock',
    department: 'supermarket',
    departmentLabel: 'Supermarket',
    icon: 'stock',
    title: 'Stock & Shelf Assistant',
    employmentType: 'Full Time',
    cvRequired: false,
    type: 'Full-time',
    posted: '2025-06-05',
    closingDate: '2025-07-20',
    workingHours: '07:00 AM – 04:00 PM',
    summary:
      'Keep shelves fully stocked, rotated, and labelled while maintaining excellent store presentation.',
    description:
      'Join our supermarket operations team to receive deliveries, replenish shelves, and help maintain a well-organised shopping environment for customers.',
    responsibilities: [
      'Receive, unpack, and shelve incoming deliveries',
      'Monitor expiry dates and product rotation',
      'Support inventory checks and aisle organisation',
    ],
    requirements: [
      'Physically active role with lifting up to 15 kg',
      'Organised and reliable work ethic',
      'Retail or warehousing experience is a plus',
    ],
  },
  {
    ...baseVacancy,
    id: 'sm-produce',
    department: 'supermarket',
    departmentLabel: 'Supermarket',
    icon: 'produce',
    title: 'Fresh Produce Specialist',
    employmentType: 'Full Time',
    type: 'Full-time',
    posted: '2025-05-28',
    closingDate: '2025-07-10',
    workingHours: '06:00 AM – 02:00 PM',
    summary:
      'Maintain vibrant fresh produce displays and advise customers on quality fruits and vegetables.',
    description:
      'Play a key role in our fresh department by preparing displays, checking quality, and helping customers choose the best produce for their needs.',
    responsibilities: [
      'Prepare and display fresh fruits and vegetables',
      'Check quality, freshness, and storage conditions',
      'Coordinate with suppliers on daily deliveries',
    ],
    requirements: [
      'Knowledge of fresh produce handling',
      'Eye for quality and presentation',
      'Early morning availability preferred',
    ],
  },
];

export const FOOD_CORNER_VACANCIES = [
  {
    ...baseVacancy,
    id: 'fc-chef',
    department: 'food-corner',
    departmentLabel: 'Food Corner',
    icon: 'chef',
    title: 'Food Corner Chef / Kitchen Staff',
    employmentType: 'Full Time',
    type: 'Full-time',
    posted: '2025-06-12',
    closingDate: '2025-07-25',
    workingDays: 'Wednesday – Sunday',
    workingHours: '02:00 PM – 10:00 PM',
    summary:
      'Prepare authentic Indian and Sri Lankan dishes including biryani, kottu roti, noodles, and daily specials.',
    description:
      'We are looking for an experienced Food Corner Chef / Kitchen Staff member to prepare fresh meals for our takeaway customers. You will work in a busy kitchen preparing Indian and Sri Lankan favourites such as biryani, kottu roti, noodles, and grilled items while maintaining high hygiene and quality standards.',
    responsibilities: [
      'Prepare hot meals, snacks, and daily specials',
      'Follow recipes, portion control, and food safety rules',
      'Maintain kitchen cleanliness and equipment care',
      'Coordinate with counter staff during peak hours',
    ],
    requirements: [
      'Experience in Indian / Sri Lankan cuisine preferred',
      'Food hygiene awareness or certificate is a plus',
      'Ability to work evenings and weekends',
      'Team player in a fast-paced kitchen',
    ],
  },
  {
    ...baseVacancy,
    id: 'fc-cashier',
    department: 'food-corner',
    departmentLabel: 'Food Corner',
    icon: 'cashier',
    title: 'Food Corner Cashier',
    employmentType: 'Part Time',
    type: 'Part-time',
    posted: '2025-06-08',
    closingDate: '2025-07-18',
    workingDays: 'Friday – Sunday',
    workingHours: '04:00 PM – 10:00 PM',
    summary: 'Handle food corner orders, payments, and customer service at the counter.',
    description:
      'Support our food corner team by taking orders, processing payments, and ensuring every customer receives quick and friendly service.',
    responsibilities: [
      'Process orders and payments accurately',
      'Package meals and maintain counter displays',
      'Answer basic menu questions',
    ],
    requirements: [
      'Customer service skills',
      'Comfortable with POS or cash handling',
      'Weekend availability required',
    ],
  },
  {
    ...baseVacancy,
    id: 'fc-service',
    department: 'food-corner',
    departmentLabel: 'Food Corner',
    icon: 'service',
    title: 'Food Corner Service Crew',
    employmentType: 'Part Time',
    type: 'Part-time',
    posted: '2025-06-02',
    closingDate: '2025-07-12',
    workingDays: 'Thursday – Sunday',
    workingHours: '05:00 PM – 11:00 PM',
    summary: 'Serve customers, maintain dining area standards, and support counter operations.',
    description:
      'Join our service crew to deliver warm hospitality, assist with meal packaging, and keep the food corner service area clean and welcoming.',
    responsibilities: [
      'Serve customers and manage order flow',
      'Support packaging and counter presentation',
      'Maintain cleanliness in service areas',
    ],
    requirements: [
      'Friendly and energetic personality',
      'Food service experience is helpful',
      'Flexible evening and weekend hours',
    ],
  },
  {
    ...baseVacancy,
    id: 'fc-counter',
    department: 'food-corner',
    departmentLabel: 'Food Corner',
    icon: 'counter',
    title: 'Food Corner Counter Staff',
    employmentType: 'Full Time',
    type: 'Full-time',
    posted: '2025-05-30',
    closingDate: '2025-07-08',
    workingDays: 'Wednesday – Sunday',
    workingHours: '11:00 AM – 11:00 PM',
    summary: 'Manage food counter operations, customer orders, and daily service routines.',
    description:
      'Work at the heart of our food corner by handling customer orders, coordinating with kitchen staff, and maintaining excellent service standards throughout the day.',
    responsibilities: [
      'Take customer orders and process payments',
      'Coordinate with kitchen on order timing',
      'Keep counters clean and well presented',
    ],
    requirements: [
      'Strong communication skills',
      'Experience in food service preferred',
      'Ability to work in a busy environment',
    ],
  },
  {
    ...baseVacancy,
    id: 'fc-trainee',
    department: 'food-corner',
    departmentLabel: 'Food Corner',
    icon: 'trainee',
    title: 'Store Assistant Supervisor Trainee',
    employmentType: 'Full Time',
    type: 'Full-time',
    posted: '2025-05-22',
    closingDate: '2025-06-30',
    workingDays: 'Monday – Saturday',
    workingHours: '09:00 AM – 06:00 PM',
    summary: 'Train to support store and food corner supervision with leadership development.',
    description:
      'An excellent opportunity for motivated candidates to learn supermarket and food corner operations while developing supervisory skills under experienced team leaders.',
    responsibilities: [
      'Support daily store and food corner operations',
      'Assist with staff coordination and task planning',
      'Learn inventory, service, and quality procedures',
    ],
    requirements: [
      'Leadership potential and positive attitude',
      'Retail or hospitality background preferred',
      'Willingness to learn and grow',
    ],
  },
];

export const ALL_VACANCIES = [...FOOD_CORNER_VACANCIES, ...SUPERMARKET_VACANCIES].sort(
  (a, b) => new Date(b.posted) - new Date(a.posted)
);

export const JOBS_PER_PAGE = 5;
