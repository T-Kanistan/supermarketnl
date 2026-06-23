import Product from '../models/Product.js';
import {
  getActiveCategories,
  buildCategoryLookupMap,
  findCategoryByParam,
} from '../services/foodCornerCategoryService.js';

const mapFoodItem = (doc, categoryMap) => {
  const item = doc.toObject ? doc.toObject() : doc;
  const categoryKey = String(item.categoryId);
  const category =
    categoryMap.get(categoryKey) ||
    categoryMap.get(item.categoryName) ||
    categoryMap.get(item.categoryId);

  return {
    id: item._id?.toString() || item.id,
    name: item.name,
    description: item.description || '',
    categoryId: item.categoryId,
    categorySlug: category?.slug || '',
    categoryName: item.categoryName || category?.categoryName || '',
    price: item.price,
    image: item.image,
    displayTime: item.displayTime || 'All Day',
    badge: item.badge || '',
    stock: item.stock ?? 0,
    isAvailable: (item.stock ?? 0) > 0,
    status: item.status,
    rating: item.rating,
    reviews: item.reviews,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

/**
 * @desc    Get active Food Corner items
 * @route   GET /api/food-corner/items
 * @query   category — category slug or ObjectId
 */
export const getFoodCornerItems = async (req, res, next) => {
  try {
    const activeCategories = await getActiveCategories();
    const categoryMap = buildCategoryLookupMap(activeCategories);
    const activeCategoryIds = new Set(
      activeCategories.flatMap((cat) => [
        String(cat._id),
        cat.slug,
        cat.categoryName,
      ])
    );

    // Food Corner menu items should be driven by `productType`,
    // but we keep legacy `type` support for older/migrating records.
    const filter = {
      status: 'active',
      $and: [
        {
          $or: [
            { productType: 'food-corner' },
            { type: 'food' },
            { type: 'food-corner' },
          ],
        },
      ],
    };

    if (req.query.category) {
      const category = await findCategoryByParam(req.query.category);
      if (!category || !category.status) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive category',
        });
      }
      filter.$and.push({
        $or: [
          { categoryId: category._id },
          { categoryId: category._id.toString() },
          { categoryName: category.categoryName },
        ],
      });
    }

    const items = await Product.find(filter).sort({ categoryName: 1, name: 1 });

    const visibleItems = items.filter((item) =>
      activeCategoryIds.has(String(item.categoryId)) ||
      activeCategoryIds.has(item.categoryName)
    );

    res.status(200).json({
      success: true,
      count: visibleItems.length,
      data: visibleItems.map((item) => mapFoodItem(item, categoryMap)),
      categories: activeCategories.map((cat) => ({
        _id: cat._id,
        id: cat._id.toString(),
        categoryName: cat.categoryName,
        slug: cat.slug,
        icon: cat.icon || '',
        description: cat.description || '',
        displayOrder: cat.displayOrder,
        status: cat.status,
      })),
    });
  } catch (error) {
    next(error);
  }
};
