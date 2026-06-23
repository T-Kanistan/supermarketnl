import * as vacancyService from '../services/vacancyService.js';

export const getVacancies = async (req, res, next) => {
  try {
    const { filter = 'all', sort } = req.query;
    const data = await vacancyService.getPublicVacancies({ filter, sort });
    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getVacancyById = async (req, res, next) => {
  try {
    const data = await vacancyService.getVacancyById(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};
