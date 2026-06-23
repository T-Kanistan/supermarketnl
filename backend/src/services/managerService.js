import Manager from '../models/Manager.js';

const normalizeEmail = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed.toLowerCase() : null;
};

const normalizePhone = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const toPublicManager = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { passwordHash, ...rest } = obj;
  return {
    ...rest,
    id: rest._id?.toString?.() ?? rest.id,
    statusLabel: rest.status ? 'active' : 'inactive',
  };
};

export const listManagers = async ({ search = '', status } = {}) => {
  const filter = {};
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { fullName: regex },
      { email: regex },
      { username: regex },
      { phoneNumber: regex },
    ];
  }
  if (status === 'active') filter.status = true;
  if (status === 'inactive') filter.status = false;

  const managers = await Manager.find(filter).sort({ createdAt: -1 });
  return managers.map(toPublicManager);
};

export const getManagerById = async (id) => {
  const manager = await Manager.findById(id);
  if (!manager) {
    const err = new Error('Manager not found');
    err.statusCode = 404;
    throw err;
  }
  return toPublicManager(manager);
};

export const createManager = async (data, createdBy) => {
  const passwordHash = await Manager.hashPassword(data.password);
  const manager = await Manager.create({
    fullName: data.fullName.trim(),
    email: normalizeEmail(data.email),
    username: data.username.trim().toLowerCase(),
    phoneNumber: normalizePhone(data.phoneNumber),
    passwordHash,
    status: data.status !== false,
    createdBy: createdBy || null,
  });
  return toPublicManager(manager);
};

export const updateManager = async (id, data) => {
  const manager = await Manager.findById(id);
  if (!manager) {
    const err = new Error('Manager not found');
    err.statusCode = 404;
    throw err;
  }

  if (data.fullName !== undefined) manager.fullName = data.fullName.trim();
  if (data.email !== undefined) manager.email = normalizeEmail(data.email);
  if (data.username !== undefined) manager.username = data.username.trim().toLowerCase();
  if (data.phoneNumber !== undefined) manager.phoneNumber = normalizePhone(data.phoneNumber);
  if (data.profileImage !== undefined) manager.profileImage = data.profileImage;
  if (data.status !== undefined) manager.status = Boolean(data.status);

  await manager.save();
  return toPublicManager(manager);
};

export const deleteManager = async (id) => {
  const manager = await Manager.findByIdAndDelete(id);
  if (!manager) {
    const err = new Error('Manager not found');
    err.statusCode = 404;
    throw err;
  }
  return { success: true };
};

export const setManagerStatus = async (id, status) => {
  const manager = await Manager.findById(id);
  if (!manager) {
    const err = new Error('Manager not found');
    err.statusCode = 404;
    throw err;
  }
  manager.status = Boolean(status);
  await manager.save();
  return toPublicManager(manager);
};

export const findManagerForLogin = async (login) => {
  const normalized = login.trim().toLowerCase();
  return Manager.findOne({
    $or: [{ email: normalized }, { username: normalized }],
  }).select('+passwordHash');
};

export const changeManagerPassword = async (id, oldPassword, newPassword) => {
  const manager = await Manager.findById(id).select('+passwordHash');
  if (!manager) {
    const err = new Error('Manager not found');
    err.statusCode = 404;
    throw err;
  }
  const isMatch = await manager.comparePassword(oldPassword);
  if (!isMatch) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 400;
    throw err;
  }
  manager.passwordHash = await Manager.hashPassword(newPassword);
  await manager.save();
  return { success: true, message: 'Password changed successfully' };
};
