const formatTimeToken = (raw) => {
  const token = String(raw || '').trim();
  const compact = token.match(/^(\d{1,2}:\d{2})(AM|PM)$/i);
  if (compact) return `${compact[1]} ${compact[2].toUpperCase()}`;

  const spaced = token.match(/^(\d{1,2}:\d{2})\s+(AM|PM)$/i);
  if (spaced) return `${spaced[1]} ${spaced[2].toUpperCase()}`;

  return token;
};

const formatHoursRange = (hours) => {
  const cleaned = String(hours || '').trim();
  if (!cleaned) return '';

  const rangeMatch = cleaned.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (rangeMatch) {
    return `${formatTimeToken(rangeMatch[1])} - ${formatTimeToken(rangeMatch[2])}`;
  }

  return cleaned.replace(
    /(\d{1,2}:\d{2})\s*(AM|PM)/gi,
    (_, time, period) => `${time} ${period.toUpperCase()}`
  );
};

const normalizeSchedule = (schedule) => ({
  days: schedule.days,
  hours: formatHoursRange(schedule.hours),
});

const parseLineSchedules = (line) => {
  const current = line.trim();
  if (!current) return [];

  const inlineMatch = current.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (inlineMatch) {
    return [
      normalizeSchedule({
        days: inlineMatch[1].trim(),
        hours: inlineMatch[2].trim(),
      }),
    ];
  }

  return [normalizeSchedule({ days: '', hours: current })];
};

const appendRemainingLines = (schedules, remainder) => {
  const extraLines = remainder
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  extraLines.forEach((line) => {
    schedules.push(...parseLineSchedules(line));
  });
};

/**
 * Parse admin-entered opening hours into display rows. Splits day/time
 * structure from parentheses or newlines and normalizes time formatting.
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
    const schedules = parenthesizedMatches.map((match) =>
      normalizeSchedule({
        days: match[1].trim(),
        hours: match[2].trim(),
      })
    );

    const remainder = text.replace(parenthesizedPattern, '').trim();
    appendRemainingLines(schedules, remainder);
    return schedules;
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
        schedules.push(
          normalizeSchedule({
            days: inlineMatch[1].trim(),
            hours: inlineMatch[2].trim(),
          })
        );
        continue;
      }

      const next = lines[index + 1];
      const currentLooksLikeDays = /^[A-Za-z]/.test(current) && !/\d/.test(current);
      const nextLooksLikeHours =
        next && /\d/.test(next) && !/^[A-Za-z]+(?:\s*-\s*[A-Za-z]+)?$/.test(next);

      if (currentLooksLikeDays && nextLooksLikeHours) {
        schedules.push(normalizeSchedule({ days: current, hours: next }));
        index += 1;
        continue;
      }

      schedules.push(normalizeSchedule({ days: '', hours: current }));
    }

    if (schedules.length) return schedules;
  }

  return [normalizeSchedule({ days: '', hours: text })];
};
