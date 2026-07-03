export const FOOTER_VISIBLE_CATEGORY_LIMIT = 7;

export const sortFooterCategoryLinks = (items = []) =>
  [...items].sort((a, b) => {
    const orderA = Number(a.order);
    const orderB = Number(b.order);

    if (Number.isFinite(orderA) && Number.isFinite(orderB) && orderA !== orderB) {
      return orderA - orderB;
    }
    if (Number.isFinite(orderA) && !Number.isFinite(orderB)) return -1;
    if (!Number.isFinite(orderA) && Number.isFinite(orderB)) return 1;

    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;

    return String(a.label || a.name || '').localeCompare(String(b.label || b.name || ''));
  });

export const limitFooterCategoryLinks = (
  items = [],
  limit = FOOTER_VISIBLE_CATEGORY_LIMIT
) => sortFooterCategoryLinks(items).slice(0, limit);

export const mapProductCategoriesToFooterLinks = (categories = []) =>
  limitFooterCategoryLinks(
    (Array.isArray(categories) ? categories : [])
      .filter((category) => category.status === 'active')
      .map((category) => ({
        id: category.id || category.slug,
        label: category.name,
        createdAt: category.createdAt,
        order: category.sortOrder,
      }))
  );
