const ACCESS_DENIED_MESSAGE =
  'Access Denied. You do not have permission to access this module.';

export const adminOnly = (req, res, next) => {
  const role = req.user?.role || req.user?.accountType;

  if (role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: ACCESS_DENIED_MESSAGE,
    });
  }

  next();
};

export default adminOnly;
