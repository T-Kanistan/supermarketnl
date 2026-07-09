export const normalizeOfferStartDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0, 0)
    );
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const normalizeOfferEndDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59, 999)
    );
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

export const getOfferScheduleState = (offer, now = new Date()) => {
  const nowTime = now.getTime();
  const startTime = offer?.startDate ? new Date(offer.startDate).getTime() : null;
  const endTime = offer?.endDate ? new Date(offer.endDate).getTime() : null;

  return {
    isScheduled: startTime !== null && nowTime < startTime,
    isExpired: endTime !== null && nowTime > endTime,
  };
};

export const isOfferPubliclyVisible = (offer, now = new Date()) => {
  if ((offer?.status || 'active') !== 'active') return false;
  const { isScheduled, isExpired } = getOfferScheduleState(offer, now);
  return !isScheduled && !isExpired;
};

export const buildPublicOfferScheduleFilter = (now = new Date()) => ({
  $and: [
    {
      $or: [
        { startDate: null },
        { startDate: { $exists: false } },
        { startDate: { $lte: now } },
      ],
    },
    {
      $or: [
        { endDate: null },
        { endDate: { $exists: false } },
        { endDate: { $gte: now } },
      ],
    },
  ],
});

export const mergeScheduleFilter = (filter, now = new Date()) => {
  const schedule = buildPublicOfferScheduleFilter(now);
  filter.$and = [...(filter.$and || []), ...schedule.$and];
  return filter;
};
