export const successResponse = (res, statusCode, message, data = null) => {
  const payload = { success: true, message };
  if (data !== null && data !== undefined) {
    payload.data = data;
  }
  return res.status(statusCode).json(payload);
};

export const errorResponse = (res, statusCode, message, errors = null) => {
  const payload = { success: false, message };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};
