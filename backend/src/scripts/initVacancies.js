import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import Vacancy from '../models/Vacancy.js';
import { VACANCY_SEED_DATA } from '../constants/vacancySeed.js';

dotenv.config();

const seedVacancies = async () => {
  await connectMongo();

  let created = 0;
  let skipped = 0;

  for (const item of VACANCY_SEED_DATA) {
    const exists = await Vacancy.findOne({
      $or: [{ legacyId: item.legacyId }, { title: item.title, department: item.department }],
    });

    if (exists) {
      skipped += 1;
      continue;
    }

    await Vacancy.create({
      ...item,
      createdAt: item.createdAt || new Date(),
      updatedAt: item.createdAt || new Date(),
    });
    created += 1;
  }

  console.log(`Vacancies seed complete. Created: ${created}, Skipped: ${skipped}`);
  process.exit(0);
};

seedVacancies().catch((err) => {
  console.error(err);
  process.exit(1);
});
