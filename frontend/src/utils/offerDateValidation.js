export const OFFER_END_DATE_RANGE_ERROR =
  'End Date must be the same as or later than the Start Date.';

export const OFFER_START_DATE_PAST_ERROR =
  'Start Date cannot be earlier than today.';

export const pad2 = (n) => String(n).padStart(2, '0');

/** Local browser calendar day as YYYY-MM-DD (aligned with typical server local day). */
export const getTodayYmd = (now = new Date()) => {
  const y = now.getFullYear();
  const m = pad2(now.getMonth() + 1);
  const d = pad2(now.getDate());
  return `${y}-${m}-${d}`;
};

export const toYmd = (value) => {
  if (!value) return '';
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  // Prefer UTC day for API Date strings (stored as UTC calendar bounds).
  if (typeof value === 'string' && /T|Z|\+/.test(value)) {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

export const compareYmd = (a, b) => {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

export const maxYmd = (a, b) => (compareYmd(a, b) >= 0 ? a : b);

/**
 * Prefer serverToday from the API so storefront filtering matches backend timezone.
 */
export const resolveOfferTodayYmd = (offersOrOffer, fallback = getTodayYmd()) => {
  if (Array.isArray(offersOrOffer)) {
    const fromList = offersOrOffer.find((o) => o?.serverToday)?.serverToday;
    return fromList || fallback;
  }
  return offersOrOffer?.serverToday || fallback;
};

/**
 * Defensive storefront check — mirrors backend date-window rules.
 * Prefer lifecycleStatus / isLive from the API when present.
 */
export const isOfferActiveForStorefront = (offer, todayYmd = getTodayYmd()) => {
  if (!offer) return false;

  const status = String(offer.lifecycleStatus || offer.status || '').toLowerCase();
  if (['inactive', 'draft', 'deleted', 'scheduled', 'expired'].includes(status)) {
    return false;
  }

  if (typeof offer.isLive === 'boolean') return offer.isLive;
  if (typeof offer.active === 'boolean' && status === 'active') return offer.active;

  const start = toYmd(offer.startDate);
  const end = toYmd(offer.endDate);
  if (!start || !end) return false;
  if (compareYmd(todayYmd, start) < 0) return false;
  if (compareYmd(todayYmd, end) > 0) return false;
  return true;
};

export const filterActiveStorefrontOffers = (offers = []) => {
  const today = resolveOfferTodayYmd(offers);
  return (Array.isArray(offers) ? offers : []).filter((offer) =>
    isOfferActiveForStorefront(offer, today)
  );
};

/**
 * @param {string} startDate
 * @param {string} endDate
 * @param {{ today?: string, existingStartDate?: string }} [options]
 */
export const validateOfferDates = (startDate, endDate, options = {}) => {
  const start = String(startDate || '').trim();
  const end = String(endDate || '').trim();
  const today = options.today || getTodayYmd();
  const existingStart = toYmd(options.existingStartDate || '');

  let startDateError = '';
  let endDateError = '';

  if (!start) {
    startDateError = 'Start Date is required.';
  } else {
    const startUnchanged = Boolean(existingStart && start === existingStart);
    const minStart = existingStart ? maxYmd(existingStart, today) : today;
    if (!startUnchanged && compareYmd(start, minStart) < 0) {
      startDateError = OFFER_START_DATE_PAST_ERROR;
    }
  }

  if (!end) {
    endDateError = 'End Date is required.';
  } else if (start && end < start) {
    endDateError = OFFER_END_DATE_RANGE_ERROR;
  }

  return {
    valid: !startDateError && !endDateError,
    startDateError,
    endDateError,
    minStartDate: existingStart ? maxYmd(existingStart, today) : today,
    today,
  };
};

/** Minimum selectable start date for the date picker (native min attribute). */
export const getOfferStartMinDate = ({ today, existingStartDate } = {}) => {
  const day = today || getTodayYmd();
  const existing = toYmd(existingStartDate || '');
  // Past saved start stays visible in the input value, but selectable min is today.
  // For future existing starts, lock earlier picks via max(existing, today).
  if (existing && compareYmd(existing, day) > 0) {
    return existing;
  }
  return day;
};
