import mongoose from 'mongoose';
import Vacancy from '../models/Vacancy.js';
import JobApplication from '../models/JobApplication.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
const PUBLIC_STATUSES = ['Active', 'Extended', 'Open', 'active', 'open', 'extended'];

const normalizeDepartmentSlug = (department = '') => {
  if (/food\s*corner/i.test(department)) return 'food-corner';
  return 'supermarket';
};

const toPublicVacancy = (doc) => {
  const obj = doc?.toObject ? doc.toObject() : doc;
  const departmentLabel = obj.department || 'Supermarket';
  const departmentSlug = normalizeDepartmentSlug(departmentLabel);

  return {
    id: obj.legacyId || obj._id?.toString(),
    _id: obj._id?.toString(),
    title: obj.title,
    department: departmentSlug,
    departmentLabel,
    employmentType: obj.employmentType,
    status: obj.status,
    location: obj.location,
    workingDays: obj.workingDays,
    workingHours: obj.workingHours,
    closingDate: obj.closingDate,
    summary: obj.summary,
    description: obj.description,
    icon: obj.icon || 'cashier',
    posted: obj.createdAt,
    createdAt: obj.createdAt,
  };
};

export const getPublicVacancies = async ({ filter = 'all', sort } = {}) => {
  const normalizedFilter = String(filter || 'all').toLowerCase().trim();
  const normalizedSort = String(sort || '').toLowerCase().trim();

  const query = { status: { $in: PUBLIC_STATUSES } };

  if (normalizedFilter === 'supermarket') {
    query.department = 'Supermarket';
  } else if (normalizedFilter === 'food-corner' || normalizedFilter === 'foodcorner') {
    query.department = 'Food Corner';
  }

  const sortOption =
    normalizedSort === 'latest' || normalizedFilter === 'latest'
      ? { createdAt: -1 }
      : { createdAt: -1 };

  const vacancies = await Vacancy.find(query).sort(sortOption).lean();
  return vacancies.map(toPublicVacancy);
};

export const getVacancyById = async (id) => {
  const lookup = [{ legacyId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) {
    lookup.unshift({ _id: id });
  }

  const vacancy = await Vacancy.findOne({
    $or: lookup,
    status: { $in: PUBLIC_STATUSES },
  }).lean();

  if (!vacancy) {
    const error = new Error('Vacancy not found');
    error.statusCode = 404;
    throw error;
  }

  return toPublicVacancy(vacancy);
};

const toAdminVacancy = (doc, applicationCount = 0) => {
  const base = toPublicVacancy(doc);
  const openDate = doc.openDate || doc.createdAt;
  return {
    ...base,
    id: doc._id?.toString() || base.id,
    jobTitle: doc.title,
    title: doc.title,
    jobDescription: doc.description,
    description: doc.description,
    openDate,
    closeDate: doc.closingDate,
    closingDate: doc.closingDate,
    applicationCount,
  };
};
const getApplicationCounts = async () => {
  const rows = await JobApplication.aggregate([
    { $group: { _id: '$jobId', count: { $sum: 1 } } },
  ]);
  const map = new Map();
  rows.forEach((row) => {
    map.set(String(row._id), row.count);
  });
  return map;
};

const resolveApplicationCount = (vacancy, countsMap) => {
  const id = vacancy._id?.toString();
  const legacy = vacancy.legacyId;
  return countsMap.get(id) || countsMap.get(legacy) || 0;
};

export const getVacancyStats = async () => {
  const [total, active, inactive, closed, extended, hired] = await Promise.all([
    Vacancy.countDocuments(),
    Vacancy.countDocuments({ status: 'Active' }),
    Vacancy.countDocuments({ status: 'Inactive' }),
    Vacancy.countDocuments({ status: 'Closed' }),
    Vacancy.countDocuments({ status: 'Extended' }),
    Vacancy.countDocuments({ status: 'Hired' }),
  ]);
  return {
    total,
    active,
    inactive,
    closed,
    extended,
    hired,
    totalVacancies: total,
    activeVacancies: active,
    inactiveVacancies: inactive,
    closedVacancies: closed,
    extendedVacancies: extended,
    hiredVacancies: hired,
  };
};

const buildAdminVacancyQuery = ({ department, status, employmentType, search } = {}) => {
  const query = {};
  if (department && department !== 'all') {
    if (department === 'supermarket') query.department = 'Supermarket';
    if (department === 'food-corner') query.department = 'Food Corner';
  }
  if (status && status !== 'all') {
    query.status = status;
  }
  if (employmentType && employmentType !== 'all') {
    query.employmentType = employmentType;
  }
  if (search?.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { title: regex },
      { department: regex },
      { employmentType: regex },
      { location: regex },
    ];
  }
  return query;
};

export const listAdminVacancies = async (filters = {}) => {
  const query = buildAdminVacancyQuery(filters);
  const { page, limit, skip } = parsePagination(filters);

  const [vacancies, total, countsMap] = await Promise.all([
    Vacancy.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Vacancy.countDocuments(query),
    getApplicationCounts(),
  ]);

  const data = vacancies.map((vacancy) =>
    toAdminVacancy(vacancy, resolveApplicationCount(vacancy, countsMap))
  );

  return {
    data,
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};
export const getAdminVacancyById = async (id) => {
  const lookup = [{ legacyId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) lookup.unshift({ _id: id });
  const vacancy = await Vacancy.findOne({ $or: lookup }).lean();
  if (!vacancy) {
    const error = new Error('Vacancy not found');
    error.statusCode = 404;
    throw error;
  }
  const countsMap = await getApplicationCounts();
  return toAdminVacancy(vacancy, resolveApplicationCount(vacancy, countsMap));
};

export const createVacancy = async (payload) => {
  const vacancy = await Vacancy.create({
    title: payload.title,
    department: payload.department,
    employmentType: payload.employmentType,
    status: payload.status || 'Active',
    location: payload.location,
    workingDays: payload.workingDays,
    workingHours: payload.workingHours,
    closingDate: payload.closingDate || null,
    openDate: payload.openDate || new Date(),
    summary: payload.summary,
    description: payload.description,
    icon: payload.icon || 'cashier',
    legacyId: payload.legacyId,
  });
  return toAdminVacancy(vacancy.toObject(), 0);
};

export const updateVacancy = async (id, payload) => {
  const lookup = [{ legacyId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) lookup.unshift({ _id: id });
  const update = {
    title: payload.title,
    department: payload.department,
    employmentType: payload.employmentType,
    status: payload.status,
    location: payload.location,
    workingDays: payload.workingDays,
    workingHours: payload.workingHours,
    closingDate: payload.closingDate,
    summary: payload.summary,
    description: payload.description,
    icon: payload.icon,
  };
  if (payload.openDate) update.openDate = payload.openDate;

  const vacancy = await Vacancy.findOneAndUpdate(
    { $or: lookup },
    update,
    { new: true, runValidators: true }
  ).lean();  if (!vacancy) {
    const error = new Error('Vacancy not found');
    error.statusCode = 404;
    throw error;
  }
  const countsMap = await getApplicationCounts();
  return toAdminVacancy(vacancy, resolveApplicationCount(vacancy, countsMap));
};

export const updateVacancyStatus = async (id, status) => {
  const lookup = [{ legacyId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) lookup.unshift({ _id: id });
  const vacancy = await Vacancy.findOneAndUpdate(
    { $or: lookup },
    { status },
    { new: true, runValidators: true }
  ).lean();
  if (!vacancy) {
    const error = new Error('Vacancy not found');
    error.statusCode = 404;
    throw error;
  }
  const countsMap = await getApplicationCounts();
  return toAdminVacancy(vacancy, resolveApplicationCount(vacancy, countsMap));
};

export const extendVacancyClosingDate = async (id, closingDate) => {
  const lookup = [{ legacyId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) lookup.unshift({ _id: id });
  const vacancy = await Vacancy.findOneAndUpdate(
    { $or: lookup },
    { closingDate, status: 'Extended' },
    { new: true, runValidators: true }
  ).lean();
  if (!vacancy) {
    const error = new Error('Vacancy not found');
    error.statusCode = 404;
    throw error;
  }
  const countsMap = await getApplicationCounts();
  return toAdminVacancy(vacancy, resolveApplicationCount(vacancy, countsMap));
};

export const deleteVacancy = async (id) => {
  const lookup = [{ legacyId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) lookup.unshift({ _id: id });
  const vacancy = await Vacancy.findOneAndDelete({ $or: lookup }).lean();
  if (!vacancy) {
    const error = new Error('Vacancy not found');
    error.statusCode = 404;
    throw error;
  }
  return toAdminVacancy(vacancy, 0);
};
