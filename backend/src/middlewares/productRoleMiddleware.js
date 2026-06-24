export const blockManagerProductWrite = (req, res, next) => {
  const role = req.user?.role || req.user?.accountType;

  if (role === 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Managers can only change product status. Contact an administrator to create or edit products.',
    });
  }

  next();
};

export default blockManagerProductWrite;
