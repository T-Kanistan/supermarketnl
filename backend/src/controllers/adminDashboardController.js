import { getRecentJobApplications } from '../services/jobApplicationService.js';

export const getRecentApplications = async (req, res, next) => {
  try {
    const limit = req.query.limit || 10;
    const data = await getRecentJobApplications(limit);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};
