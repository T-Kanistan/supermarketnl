import aboutModuleService from '../services/aboutModuleService.js';
import { successResponse } from '../utils/apiResponse.js';

const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const getPublicPage = wrap(async (req, res) => {
  const data = await aboutModuleService.getPublicPage();
  return successResponse(res, 200, 'About page content retrieved', data);
});

export const getAdminPage = wrap(async (req, res) => {
  const data = await aboutModuleService.getAdminPage();
  return successResponse(res, 200, 'About admin content retrieved', data);
});

export const getIntroduction = wrap(async (req, res) => {
  const activeOnly = !req.user;
  const data = await aboutModuleService.getIntroduction(activeOnly);
  return successResponse(res, 200, 'Introduction retrieved', data);
});

export const updateIntroduction = wrap(async (req, res) => {
  const data = await aboutModuleService.updateIntroduction(req.body, req.user);
  return successResponse(res, 200, 'Introduction updated successfully', data);
});

export const uploadIntroductionImage = wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required' });
  const data = await aboutModuleService.uploadIntroductionImage(req.file, req.user);
  return successResponse(res, 200, 'Introduction image uploaded', data);
});

export const getStory = wrap(async (req, res) => {
  const activeOnly = !req.user;
  const data = await aboutModuleService.getStory(activeOnly);
  return successResponse(res, 200, 'Story retrieved', data);
});

export const updateStory = wrap(async (req, res) => {
  const data = await aboutModuleService.updateStory(req.body, req.user);
  return successResponse(res, 200, 'Story updated successfully', data);
});

export const uploadStoryImage = wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required' });
  const data = await aboutModuleService.uploadStoryImage(req.file, req.user);
  return successResponse(res, 200, 'Story image uploaded', data);
});

export const getTimeline = wrap(async (req, res) => {
  const activeOnly = !req.user;
  const data = await aboutModuleService.listTimeline(req.query.search, activeOnly);
  return successResponse(res, 200, 'Timeline retrieved', data);
});

export const createTimeline = wrap(async (req, res) => {
  const data = await aboutModuleService.createTimeline(req.body, req.user);
  return successResponse(res, 201, 'Timeline item created', data);
});

export const updateTimeline = wrap(async (req, res) => {
  const data = await aboutModuleService.updateTimeline(req.params.id, req.body, req.user);
  return successResponse(res, 200, 'Timeline item updated', data);
});

export const deleteTimeline = wrap(async (req, res) => {
  await aboutModuleService.deleteTimeline(req.params.id, req.user);
  return successResponse(res, 200, 'Timeline item deleted');
});

export const reorderTimeline = wrap(async (req, res) => {
  const data = await aboutModuleService.reorderTimeline(req.body.orders, req.user);
  return successResponse(res, 200, 'Timeline reordered', data);
});

export const getValues = wrap(async (req, res) => {
  const activeOnly = !req.user;
  const data = await aboutModuleService.listValues(req.query.search, activeOnly);
  return successResponse(res, 200, 'Values retrieved', data);
});

export const createValue = wrap(async (req, res) => {
  const data = await aboutModuleService.createValue(req.body, req.user);
  return successResponse(res, 201, 'Value card created', data);
});

export const updateValue = wrap(async (req, res) => {
  const data = await aboutModuleService.updateValue(req.params.id, req.body, req.user);
  return successResponse(res, 200, 'Value card updated', data);
});

export const deleteValue = wrap(async (req, res) => {
  await aboutModuleService.deleteValue(req.params.id, req.user);
  return successResponse(res, 200, 'Value card deleted');
});

export const reorderValues = wrap(async (req, res) => {
  const data = await aboutModuleService.reorderValues(req.body.orders, req.user);
  return successResponse(res, 200, 'Values reordered', data);
});

export const getOffers = wrap(async (req, res) => {
  const activeOnly = !req.user;
  const data = await aboutModuleService.listOffers(req.query.search, activeOnly);
  return successResponse(res, 200, 'Offers retrieved', data);
});

export const createOffer = wrap(async (req, res) => {
  const data = await aboutModuleService.createOffer(req.body, req.user);
  return successResponse(res, 201, 'Offer created', data);
});

export const updateOffer = wrap(async (req, res) => {
  const data = await aboutModuleService.updateOffer(req.params.id, req.body, req.user);
  return successResponse(res, 200, 'Offer updated', data);
});

export const deleteOffer = wrap(async (req, res) => {
  await aboutModuleService.deleteOffer(req.params.id, req.user);
  return successResponse(res, 200, 'Offer deleted');
});

export const uploadOfferImage = wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required' });
  const data = await aboutModuleService.uploadOfferImage(req.params.id, req.file, req.user);
  return successResponse(res, 200, 'Offer image uploaded', data);
});

export const reorderOffers = wrap(async (req, res) => {
  const data = await aboutModuleService.reorderOffers(req.body.orders, req.user);
  return successResponse(res, 200, 'Offers reordered', data);
});

export const getStatistics = wrap(async (req, res) => {
  const activeOnly = !req.user;
  const data = await aboutModuleService.listStatistics(req.query.search, activeOnly);
  return successResponse(res, 200, 'Statistics retrieved', data);
});

export const createStatistic = wrap(async (req, res) => {
  const data = await aboutModuleService.createStatistic(req.body, req.user);
  return successResponse(res, 201, 'Statistic created', data);
});

export const updateStatistic = wrap(async (req, res) => {
  const data = await aboutModuleService.updateStatistic(req.params.id, req.body, req.user);
  return successResponse(res, 200, 'Statistic updated', data);
});

export const deleteStatistic = wrap(async (req, res) => {
  await aboutModuleService.deleteStatistic(req.params.id, req.user);
  return successResponse(res, 200, 'Statistic deleted');
});

export const reorderStatistics = wrap(async (req, res) => {
  const data = await aboutModuleService.reorderStatistics(req.body.orders, req.user);
  return successResponse(res, 200, 'Statistics reordered', data);
});

export const getOwner = wrap(async (req, res) => {
  const activeOnly = !req.user;
  const data = await aboutModuleService.getOwner(activeOnly);
  return successResponse(res, 200, 'Owner retrieved', data);
});

export const updateOwner = wrap(async (req, res) => {
  const data = await aboutModuleService.updateOwner(req.body, req.user);
  return successResponse(res, 200, 'Owner updated successfully', data);
});

export const uploadOwnerPhoto = wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required' });
  const data = await aboutModuleService.uploadOwnerPhoto(req.file, req.user);
  return successResponse(res, 200, 'Owner photo uploaded', data);
});

export const syncAdminPage = wrap(async (req, res) => {
  const data = await aboutModuleService.syncAdminPage(req.body, req.user);
  return successResponse(res, 200, 'About page synced successfully', data);
});
