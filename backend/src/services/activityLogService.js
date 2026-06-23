import ActivityLog from '../models/ActivityLog.js';

const getActorDetails = (user = {}) => {
  const userName = user.fullName || user.name || 'User';
  const userRole = user.role === 'admin' ? 'Super Admin' : 'Manager';
  return { userName, userRole };
};

export const logActivity = async ({
  user,
  action,
  module,
  description,
}) => {
  try {
    const { userName, userRole } = getActorDetails(user);
    await ActivityLog.create({
      managerId: user?._id || null,
      userId: user?._id || null,
      userRole,
      userName,
      action,
      module,
      description,
    });
  } catch (error) {
    console.error('Activity log write failed:', error.message);
  }
};

export const logManagerActivity = async ({
  user,
  action,
  module,
  description,
  metadata = {},
}) => {
  if (!user || !['manager', 'admin'].includes(user.role)) {
    if (!user) {
      return logActivity({ action, module, description });
    }
    return;
  }

  await logActivity({ user, action, module, description });
};
