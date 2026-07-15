/** Calendar-day (YYYY-MM-DD) helpers for offer scheduling using the server's local date. */

export const pad2 = (n) => String(n).padStart(2, '0');

export const getServerTodayYmd = (now = new Date()) => {
  const y = now.getFullYear();
  const m = pad2(now.getMonth() + 1);
  const d = pad2(now.getDate());
  return `${y}-${m}-${d}`;
};

/** Read YYYY-MM-DD from a stored Date (UTC calendar day) or date string. */
export const toOfferYmd = (value) => {
  if (!value) return '';
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
};

export const compareYmd = (a, b) => {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

export const maxYmd = (a, b) => (compareYmd(a, b) >= 0 ? a : b);

export const normalizeOfferStartDate = (value) => {
  if (!value) return null;
  const ymd = toOfferYmd(value);
  if (!ymd) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
};

export const normalizeOfferEndDate = (value) => {
  if (!value) return null;
  const ymd = toOfferYmd(value);
  if (!ymd) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
};

/**
 * Schedule window from calendar days (server today).
 * - Scheduled: today < start
 * - Expired: today > end
 * - Active window: start <= today <= end
 */
export const getOfferScheduleState = (offer, now = new Date()) => {
  const today = getServerTodayYmd(now);
  const startYmd = toOfferYmd(offer?.startDate);
  const endYmd = toOfferYmd(offer?.endDate);

  const isScheduled = Boolean(startYmd && compareYmd(today, startYmd) < 0);
  const isExpired = Boolean(endYmd && compareYmd(today, endYmd) > 0);
  const isInWindow = !isScheduled && !isExpired;

  return {
    today,
    startYmd,
    endYmd,
    isScheduled,
    isExpired,
    isInWindow,
  };
};

/** Manual overrides that should not be overwritten by schedule sync. */
export const isManualOfferStatus = (status) =>
  status === 'inactive' || status === 'draft' || status === 'deleted';

/**
 * Resolve display / persisted schedule status.
 * Manual inactive/draft take priority; otherwise date window decides.
 */
export const resolveOfferLifecycleStatus = (offer, now = new Date()) => {
  const status = offer?.status || 'active';
  if (status === 'deleted') return 'deleted';
  if (status === 'draft') return 'draft';
  if (status === 'inactive') return 'inactive';

  const { isScheduled, isExpired } = getOfferScheduleState(offer, now);
  if (isScheduled) return 'scheduled';
  if (isExpired) return 'expired';
  return 'active';
};

export const isOfferPubliclyVisible = (offer, now = new Date()) =>
  resolveOfferLifecycleStatus(offer, now) === 'active';

/** Mongo filter: publicly Active offers for the current server calendar day. */
export const buildPublicOfferScheduleFilter = (now = new Date()) => {
  const todayYmd = getServerTodayYmd(now);
  const todayStart = normalizeOfferStartDate(todayYmd);
  const todayEnd = normalizeOfferEndDate(todayYmd);

  return {
    $and: [
      {
        $or: [
          { startDate: null },
          { startDate: { $exists: false } },
          { startDate: { $lte: todayEnd } },
        ],
      },
      {
        $or: [
          { endDate: null },
          { endDate: { $exists: false } },
          { endDate: { $gte: todayStart } },
        ],
      },
    ],
  };
};

export const mergeScheduleFilter = (filter, now = new Date()) => {
  const schedule = buildPublicOfferScheduleFilter(now);
  filter.$and = [...(filter.$and || []), ...schedule.$and];
  return filter;
};

export const OFFER_END_DATE_RANGE_ERROR =
  'End Date must be the same as or later than the Start Date.';

export const OFFER_START_DATE_PAST_ERROR =
  'Start Date cannot be earlier than today.';
