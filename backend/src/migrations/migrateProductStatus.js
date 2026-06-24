import Product from '../models/Product.js';

let migrationRan = false;

export const migrateProductStatus = async () => {
  if (migrationRan) return;

  try {
    const result = await Product.updateMany(
      {
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: '' },
        ],
      },
      { $set: { status: 'active' } }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[migration] Product status: set ${result.modifiedCount} product(s) to "active"`
      );
    } else {
      console.log('[migration] Product status: all products already have a status value');
    }

    migrationRan = true;
  } catch (error) {
    console.error(`[migration] Product status migration failed: ${error.message}`);
    throw error;
  }
};

export default migrateProductStatus;
