import AuditLog from '../models/AuditLog.js';

export const logAuditEvent = async ({
  userId,
  accountType = 'manager',
  action,
  module,
  description,
  ipAddress = '',
  browser = '',
  device = '',
  userAgent = '',
}) => {
  try {
    await AuditLog.create({
      userId: userId || null,
      accountType,
      action,
      module,
      description,
      ipAddress,
      browser,
      device,
      userAgent,
    });
  } catch (error) {
    console.error('Audit log write failed:', error.message);
  }
};
