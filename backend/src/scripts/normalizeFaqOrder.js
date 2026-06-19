import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import {
  normalizeFaqOrdersByLeadingNumber,
  normalizeFaqOrdersByCreatedAt,
} from '../services/faqService.js';

dotenv.config();

const run = async () => {
  await connectMongo();
  const byNumber = await normalizeFaqOrdersByLeadingNumber();
  const faqs = byNumber || (await normalizeFaqOrdersByCreatedAt());
  const mode = byNumber ? 'leading question number' : 'creation date';
  console.log(`Normalized ${faqs.length} FAQs by ${mode} (order 1 shown first).`);
  faqs.forEach((f) => console.log(`  ${f.order}. ${f.question.slice(0, 60)}...`));
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to normalize FAQ order:', err.message);
  process.exit(1);
});
