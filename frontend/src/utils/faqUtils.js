export const stripLeadingNumberFromQuestion = (question) =>
  String(question ?? '')
    .trim()
    .replace(/^\d+\.\s*/, '');

export const sortFaqsByOrder = (list) =>
  [...(Array.isArray(list) ? list : [])].sort((a, b) => {
    const orderA = Number(a.displayOrder ?? a.order ?? 0);
    const orderB = Number(b.displayOrder ?? b.order ?? 0);
    if (orderA !== orderB) return orderA - orderB;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

export const formatFaqQuestionLabel = (question, index) => {
  const cleanQuestion = stripLeadingNumberFromQuestion(question);
  return `${index + 1}. ${cleanQuestion}`;
};
