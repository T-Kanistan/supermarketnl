/**
 * Parse admin-entered opening hours into display rows without rewriting
 * day names, times, or other text. Only splits structure (parentheses / newlines).
 */
export const parseBusinessHours = (raw) => {
  const text = String(raw || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (!text) return [];

  const parenthesizedPattern = /([^(]+?)\s*\(([^)]+)\)/g;
  const parenthesizedMatches = [...text.matchAll(parenthesizedPattern)];

  if (parenthesizedMatches.length) {
    return parenthesizedMatches.map((match) => ({
      days: match[1].trim(),
      hours: match[2].trim(),
    }));
  }

  if (text.includes('\n')) {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const schedules = [];

    for (let index = 0; index < lines.length; index += 1) {
      const current = lines[index];
      const inlineMatch = current.match(/^(.+?)\s*\(([^)]+)\)\s*$/);

      if (inlineMatch) {
        schedules.push({
          days: inlineMatch[1].trim(),
          hours: inlineMatch[2].trim(),
        });
        continue;
      }

      const next = lines[index + 1];
      const currentLooksLikeDays = /^[A-Za-z]/.test(current) && !/\d/.test(current);
      const nextLooksLikeHours = next && /\d/.test(next) && !/^[A-Za-z]+(?:\s*-\s*[A-Za-z]+)?$/.test(next);

      if (currentLooksLikeDays && nextLooksLikeHours) {
        schedules.push({ days: current, hours: next });
        index += 1;
        continue;
      }

      schedules.push({ days: '', hours: current });
    }

    if (schedules.length) return schedules;
  }

  return [{ days: '', hours: text }];
};
