const ACCESS_DENIED_MESSAGE =
  'Access Denied. You do not have permission to access this module.';

export const managerOrAdmin = (req, res, next) => {
  const role = req.user?.role || req.user?.accountType;

  if (!['admin', 'manager'].includes(role)) {
    return res.status(403).json({
      success: false,
      message: ACCESS_DENIED_MESSAGE,
    });
  }

  next();
};

export default managerOrAdmin;
