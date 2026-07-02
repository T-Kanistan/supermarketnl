const DAY_LABELS = {
  mon: 'Mon',
  monday: 'Mon',
  tue: 'Tue',
  tues: 'Tue',
  tuesday: 'Tue',
  wed: 'Wed',
  wednesday: 'Wed',
  thu: 'Thu',
  thur: 'Thu',
  thurs: 'Thu',
  thursday: 'Thu',
  fri: 'Fri',
  friday: 'Fri',
  sat: 'Sat',
  saturday: 'Sat',
  sun: 'Sun',
  sunday: 'Sun',
};

const formatDayToken = (token) => {
  const normalized = String(token || '').trim().toLowerCase();
  if (!normalized) return '';
  return DAY_LABELS[normalized] || normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatDayRange = (days) => {
  const value = String(days || '').trim();
  if (!value) return '';

  if (value.includes('-')) {
    const [start, end] = value.split(/\s*-\s*/);
    return `${formatDayToken(start)} - ${formatDayToken(end)}`;
  }

  if (/[,\/]/.test(value)) {
    return value
      .split(/[,\/]/)
      .map((part) => formatDayToken(part))
      .filter(Boolean)
      .join(', ');
  }

  return formatDayToken(value);
};

const normalizeTimeToken = (time, meridiem) => {
  let normalizedTime = String(time || '').trim();
  if (/^\d{1,2}$/.test(normalizedTime)) {
    normalizedTime = `${normalizedTime}:00`;
  } else if (/^\d{1,2}:\d$/.test(normalizedTime)) {
    normalizedTime = `${normalizedTime}0`;
  }

  const suffix = meridiem ? ` ${String(meridiem).toUpperCase()}` : '';
  return `${normalizedTime}${suffix}`.trim();
};

export const formatTimeRange = (range) => {
  let value = String(range || '').trim().replace(/\s+/g, ' ');
  if (!value) return '';

  value = value.replace(/(\d)(AM|PM)/gi, '$1 $2');

  const rangeMatch = value.match(
    /^(\d{1,2}(?::\d{2})?)\s*(AM|PM)?\s*[-–]\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM)?$/i
  );

  if (rangeMatch) {
    return `${normalizeTimeToken(rangeMatch[1], rangeMatch[2])} – ${normalizeTimeToken(
      rangeMatch[3],
      rangeMatch[4]
    )}`;
  }

  return value.replace(/\s*-\s*/g, ' – ');
};

const parseSingleSegment = (segment) => {
  const trimmed = String(segment || '').trim();
  if (!trimmed) return null;

  const labeledMatch = trimmed.match(/^([A-Za-z]+(?:\s*-\s*[A-Za-z]+)?)\s+(.+)$/i);
  if (labeledMatch) {
    return {
      days: formatDayRange(labeledMatch[1]),
      hours: formatTimeRange(labeledMatch[2]),
    };
  }

  if (/\d/.test(trimmed)) {
    return {
      days: '',
      hours: formatTimeRange(trimmed),
    };
  }

  return null;
};

const parseParenthesizedSchedules = (text) => {
  const pattern = /([A-Za-z]+(?:\s*-\s*[A-Za-z]+)?)\s*\(([^)]+)\)/gi;
  const matches = [...text.matchAll(pattern)];

  if (!matches.length) return [];

  return matches.map((match) => ({
    days: formatDayRange(match[1]),
    hours: formatTimeRange(match[2]),
  }));
};

const parseSpacedSchedules = (text) => {
  const pattern =
    /([A-Za-z]+(?:\s*-\s*[A-Za-z]+)?)\s+((?:\d{1,2}(?::\d{2})?\s*(?:AM|PM)\s*[-–]\s*)+\d{1,2}(?::\d{2})?\s*(?:AM|PM))/gi;
  const matches = [...text.matchAll(pattern)];

  if (!matches.length) return [];

  return matches.map((match) => ({
    days: formatDayRange(match[1]),
    hours: formatTimeRange(match[2]),
  }));
};

export const parseBusinessHours = (raw) => {
  const text = String(raw || '')
    .trim()
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n/g, '\n');

  if (!text) return [];

  const parenthesized = parseParenthesizedSchedules(text);
  if (parenthesized.length) return parenthesized;

  if (text.includes(',')) {
    const commaSegments = text
      .split(/\s*,\s*/)
      .map(parseSingleSegment)
      .filter(Boolean);
    if (commaSegments.length) return commaSegments;
  }

  const spacedSchedules = parseSpacedSchedules(text);
  if (spacedSchedules.length) return spacedSchedules;

  if (text.includes('\n')) {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const lineSchedules = [];
    for (let index = 0; index < lines.length; index += 1) {
      const current = lines[index];
      const next = lines[index + 1];

      if (next && /^[A-Za-z]/.test(current) && /\d/.test(next) && !/\d/.test(current)) {
        lineSchedules.push({
          days: formatDayRange(current),
          hours: formatTimeRange(next),
        });
        index += 1;
        continue;
      }

      const parsed = parseSingleSegment(current);
      if (parsed) lineSchedules.push(parsed);
    }

    if (lineSchedules.length) return lineSchedules;
  }

  const single = parseSingleSegment(text);
  if (single) return [single];

  return [{ days: '', hours: text }];
};
