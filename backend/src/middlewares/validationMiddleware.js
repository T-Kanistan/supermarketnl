import { validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array();
    console.log('VALIDATION ERRORS', errorList);
    const message =
      errorList[0]?.msg ||
      errorList[0]?.message ||
      'Validation failed';

    return res.status(400).json({
      success: false,
      message,
      errors: errorList.map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};
