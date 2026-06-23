import * as vacancyService from '../services/vacancyService.js';
import { sanitizeVacancyInput } from '../utils/sanitize.js';

const handleError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

export const getAdminVacancyStats = async (req, res, next) => {
  try {
    const data = await vacancyService.getVacancyStats();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const listAdminVacancies = async (req, res, next) => {
  try {
    const result = await vacancyService.listAdminVacancies(req.query);
    return res.status(200).json({
      success: true,
      count: result.data.length,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminVacancy = async (req, res, next) => {
  try {
    const data = await vacancyService.getAdminVacancyById(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const createAdminVacancy = async (req, res, next) => {
  try {
    const data = await vacancyService.createVacancy(sanitizeVacancyInput(req.body));
    return res.status(201).json({ success: true, message: 'Vacancy created successfully', data });
  } catch (error) {
    return next(error);
  }
};

export const updateAdminVacancy = async (req, res, next) => {
  try {
    const data = await vacancyService.updateVacancy(req.params.id, sanitizeVacancyInput(req.body));
    return res.status(200).json({ success: true, message: 'Vacancy updated successfully', data });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const updateAdminVacancyStatus = async (req, res, next) => {
  try {
    const data = await vacancyService.updateVacancyStatus(req.params.id, req.body.status);
    return res.status(200).json({ success: true, message: 'Vacancy status updated', data });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const extendAdminVacancy = async (req, res, next) => {
  try {
    const data = await vacancyService.extendVacancyClosingDate(req.params.id, req.body.closingDate);
    return res.status(200).json({ success: true, message: 'Vacancy closing date extended', data });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const deleteAdminVacancy = async (req, res, next) => {
  try {
    const data = await vacancyService.deleteVacancy(req.params.id);
    return res.status(200).json({ success: true, message: 'Vacancy deleted', data });
  } catch (error) {
    return handleError(error, res, next);
  }
};
