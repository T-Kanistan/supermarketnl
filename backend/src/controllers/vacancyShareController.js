import * as vacancyShareService from '../services/vacancyShareService.js';
import { renderVacancyShareHtml } from '../utils/vacancyShareMeta.js';

const handleServiceError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

export const getVacancyShareMeta = async (req, res, next) => {
  try {
    const data = await vacancyShareService.getVacancyShareMeta(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const renderVacancySharePage = async (req, res, next) => {
  try {
    const meta = await vacancyShareService.getVacancyShareMeta(req.params.id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderVacancyShareHtml(meta));
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};
