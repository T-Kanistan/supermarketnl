import * as offerShareService from '../services/offerShareService.js';
import { renderOfferShareHtml } from '../utils/offerShareMeta.js';

const handleServiceError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

export const getOfferShareMeta = async (req, res, next) => {
  try {
    const data = await offerShareService.getOfferShareMeta(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const renderOfferSharePage = async (req, res, next) => {
  try {
    const meta = await offerShareService.getOfferShareMeta(req.params.id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    return res.status(200).send(renderOfferShareHtml(meta));
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};
