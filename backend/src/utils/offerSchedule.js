/** Calendar-day (YYYY-MM-DD) helpers for offer scheduling using the server's local date. */

export const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Server/application "today" as YYYY-MM-DD.
 * Uses the process local timezone (not the browser).
 */
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
 * - Active window: both dates present AND start <= today <= end
 *
 * Missing start/end dates are never treated as Active.
 */
export const getOfferScheduleState = (offer, now = new Date()) => {
  const today = getServerTodayYmd(now);
  const startYmd = toOfferYmd(offer?.startDate);
  const endYmd = toOfferYmd(offer?.endDate);
  const hasCompleteSchedule = Boolean(startYmd && endYmd);

  const isScheduled = Boolean(startYmd && compareYmd(today, startYmd) < 0);
  const isExpired = Boolean(endYmd && compareYmd(today, endYmd) > 0);
  const isInWindow = hasCompleteSchedule && !isScheduled && !isExpired;

  return {
    today,
    startYmd,
    endYmd,
    hasCompleteSchedule,
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
 * Manual inactive/draft/deleted take priority; otherwise the date window decides.
 * Stored "active" never overrides dates (requirement: dates always win).
 */
export const resolveOfferLifecycleStatus = (offer, now = new Date()) => {
  const status = offer?.status || 'active';
  if (status === 'deleted') return 'deleted';
  if (status === 'draft') return 'draft';
  if (status === 'inactive') return 'inactive';

  const { isScheduled, isExpired, isInWindow, hasCompleteSchedule } = getOfferScheduleState(
    offer,
    now
  );

  if (isScheduled) return 'scheduled';
  if (isExpired) return 'expired';
  if (isInWindow) return 'active';

  // Incomplete schedule (missing start and/or end) cannot be Active on the storefront.
  if (!hasCompleteSchedule) return 'expired';

  return 'active';
};

/** Public storefront visibility — only true Active offers in their date window. */
export const isOfferPubliclyVisible = (offer, now = new Date()) =>
  resolveOfferLifecycleStatus(offer, now) === 'active';

/**
 * Mongo filter for publicly Active offers on the current server calendar day.
 * Requires both startDate and endDate (null / missing dates are excluded).
 *
 * Equivalent to:
 *   startDate <= CURRENT_DATE AND endDate >= CURRENT_DATE
 * plus excluding manual inactive/draft/deleted (applied by callers).
 */
export const buildPublicOfferScheduleFilter = (now = new Date()) => {
  const todayYmd = getServerTodayYmd(now);
  const todayStart = normalizeOfferStartDate(todayYmd);
  const todayEnd = normalizeOfferEndDate(todayYmd);

  return {
    startDate: { $ne: null, $lte: todayEnd },
    endDate: { $ne: null, $gte: todayStart },
  };
};

/** Statuses that must never appear on public storefront APIs (manual / soft-delete). */
export const PUBLIC_OFFER_EXCLUDED_STATUSES = ['inactive', 'draft', 'deleted'];

/**
 * Base Mongo filter for public offer reads.
 * Date window is the source of truth; status exclusion only drops manual hides.
 * Callers should still post-filter with isOfferPubliclyVisible after sync.
 */
export const buildPublicOfferFilter = (now = new Date()) => ({
  status: { $nin: PUBLIC_OFFER_EXCLUDED_STATUSES },
  ...buildPublicOfferScheduleFilter(now),
});

export const mergeScheduleFilter = (filter, now = new Date()) => {
  const schedule = buildPublicOfferScheduleFilter(now);
  Object.assign(filter, schedule);
  return filter;
};

export const OFFER_END_DATE_RANGE_ERROR =
  'End Date must be the same as or later than the Start Date.';

export const OFFER_START_DATE_PAST_ERROR =
  'Start Date cannot be earlier than today.';
