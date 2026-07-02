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

    return String(a.label || a.name || '').localeCompare(String(b.label || b.name || ''));
  });

export const limitFooterCategoryLinks = (
  items = [],
  limit = FOOTER_VISIBLE_CATEGORY_LIMIT
) => sortFooterCategoryLinks(items).slice(0, limit);
