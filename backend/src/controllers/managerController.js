import * as managerService from '../services/managerService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getManagers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const data = await managerService.listManagers({ search, status });
    return successResponse(res, 200, 'Managers retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getManager = async (req, res, next) => {
  try {
    const data = await managerService.getManagerById(req.params.id);
    return successResponse(res, 200, 'Manager retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createManager = async (req, res, next) => {
  try {
    const data = await managerService.createManager(req.body, req.user?._id);
    return successResponse(res, 201, 'Manager created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateManager = async (req, res, next) => {
  try {
    const data = await managerService.updateManager(req.params.id, req.body);
    return successResponse(res, 200, 'Manager updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteManager = async (req, res, next) => {
  try {
    await managerService.deleteManager(req.params.id);
    return successResponse(res, 200, 'Manager deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const updateManagerStatus = async (req, res, next) => {
  try {
    const status =
      req.body.status !== undefined
        ? Boolean(req.body.status)
        : !req.body.currentStatus;
    const data = await managerService.setManagerStatus(req.params.id, status);
    const message = data.status ? 'Manager activated successfully' : 'Manager deactivated successfully';
    return successResponse(res, 200, message, data);
  } catch (error) {
    next(error);
  }
};
