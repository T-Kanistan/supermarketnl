import * as accountService from '../services/accountService.js';
import { getRequestMetadata } from '../utils/requestMetadata.js';

const handleServiceError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

export const getAccountProfile = async (req, res, next) => {
  try {
    const data = await accountService.getAccountProfile(req.user);
    return res.status(200).json({
      success: true,
      data,
      ...data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const changeAccountPassword = async (req, res, next) => {
  try {
    const metadata = getRequestMetadata(req);
    const result = await accountService.changeAccountPassword(req.user, req.body, metadata);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};
