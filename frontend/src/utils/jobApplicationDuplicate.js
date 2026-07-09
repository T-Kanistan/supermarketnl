export const DUPLICATE_APPLICATION_CODE = 'DUPLICATE_APPLICATION';

export const DUPLICATE_APPLICATION_TITLE = "You've Already Applied";

export const DUPLICATE_APPLICATION_MESSAGE =
  "Our records show that you've already submitted an application for this vacancy. Each applicant can apply only once for the same job.";

export const isDuplicateApplicationError = (error) =>
  error?.code === DUPLICATE_APPLICATION_CODE ||
  error?.response?.data?.code === DUPLICATE_APPLICATION_CODE ||
  error?.response?.status === 409;
