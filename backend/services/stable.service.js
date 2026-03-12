import { Op } from 'sequelize';
import Stable from '../models/stable.model.js';
import { deleteFileIfExists, toAbsolutePathFromPublic } from '../utils/file.util.js';

const normalizePagination = ({ page, limit }) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 10;
  return { page: safePage, limit: safeLimit };
};

const buildPaginationMeta = ({ currentPage, limit, totalRecords }) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  return {
    totalRecords,
    currentPage,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    limit,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

const normalizeOptionalNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
  return parsed;
};

export const createStable = async ({ adminId, payload }) => {
  const {
    name,
    location_address,
    city,
    state,
    country,
    pincode,
    latitude,
    longitude,
    contact_phone,
    contact_email,
    logo_url,
    description,
    is_active,
  } =
    payload;

  if (!name || !city || !state || !country || !pincode) {
    throw new Error('name, city, state, country, and pincode are required.');
  }

  const builtLocationAddress =
    location_address ||
    `${String(city).trim()}, ${String(state).trim()}, ${String(country).trim()} - ${String(pincode).trim()}`;

  const stable = await Stable.create({
    name,
    location_address: builtLocationAddress,
    city: String(city).trim(),
    state: String(state).trim(),
    country: String(country).trim(),
    pincode: String(pincode).trim(),
    latitude: normalizeOptionalNumber(latitude, 'latitude'),
    longitude: normalizeOptionalNumber(longitude, 'longitude'),
    contact_phone: contact_phone || null,
    contact_email: contact_email || null,
    logo_url: logo_url || null,
    description: description || null,
    is_active: is_active ?? true,
    admin_id: adminId,
  });

  return stable;
};

export const getAllStables = async ({ adminId, include_inactive, search, page, limit }) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;
  const where = { admin_id: adminId };
  if (!include_inactive) {
    where.is_active = true;
  }
  const keyword = String(search || '').trim();
  if (keyword) {
    where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { city: { [Op.like]: `%${keyword}%` } },
      { state: { [Op.like]: `%${keyword}%` } },
      { country: { [Op.like]: `%${keyword}%` } },
      { pincode: { [Op.like]: `%${keyword}%` } },
      { contact_email: { [Op.like]: `%${keyword}%` } },
      { contact_phone: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const { rows, count } = await Stable.findAndCountAll({
    where,
    order: [['id', 'DESC']],
    offset,
    limit: pagination.limit,
  });

  return {
    data: rows,
    pagination: buildPaginationMeta({
      currentPage: pagination.page,
      limit: pagination.limit,
      totalRecords: count,
    }),
  };
};

export const getStableById = async ({ adminId, stableId }) => {
  const stable = await Stable.findOne({
    where: {
      id: stableId,
      admin_id: adminId,
    },
  });

  if (!stable) {
    throw new Error('Stable not found.');
  }

  return stable;
};

export const updateStable = async ({ adminId, stableId, payload }) => {
  const stable = await Stable.findOne({
    where: {
      id: stableId,
      admin_id: adminId,
    },
  });

  if (!stable) {
    throw new Error('Stable not found.');
  }

  const previousLogoUrl = stable.logo_url;

  stable.name = payload.name ?? stable.name;
  stable.city = payload.city ?? stable.city;
  stable.state = payload.state ?? stable.state;
  stable.country = payload.country ?? stable.country;
  stable.pincode = payload.pincode ?? stable.pincode;
  const hasAllAddressParts =
    stable.city && stable.state && stable.country && stable.pincode;
  stable.location_address = payload.location_address ??
    (hasAllAddressParts
      ? `${String(stable.city).trim()}, ${String(stable.state).trim()}, ${String(stable.country).trim()} - ${String(
          stable.pincode
        ).trim()}`
      : stable.location_address);
  stable.latitude = payload.latitude !== undefined ? normalizeOptionalNumber(payload.latitude, 'latitude') : stable.latitude;
  stable.longitude =
    payload.longitude !== undefined ? normalizeOptionalNumber(payload.longitude, 'longitude') : stable.longitude;
  stable.contact_phone = payload.contact_phone ?? stable.contact_phone;
  stable.contact_email = payload.contact_email ?? stable.contact_email;
  stable.logo_url = payload.logo_url ?? stable.logo_url;
  stable.description = payload.description ?? stable.description;
  stable.is_active = payload.is_active ?? stable.is_active;
  await stable.save();

  if (payload.logo_url && previousLogoUrl && previousLogoUrl !== payload.logo_url) {
    try {
      await deleteFileIfExists(toAbsolutePathFromPublic(previousLogoUrl));
    } catch (_error) {
      // Do not fail update if old file cleanup fails.
    }
  }

  return stable;
};

export const deleteStable = async ({ adminId, stableId }) => {
  const stable = await Stable.findOne({
    where: {
      id: stableId,
      admin_id: adminId,
    },
  });

  if (!stable) {
    throw new Error('Stable not found.');
  }

  const previousLogoUrl = stable.logo_url;

  await stable.destroy();

  if (previousLogoUrl) {
    try {
      await deleteFileIfExists(toAbsolutePathFromPublic(previousLogoUrl));
    } catch (_error) {
      // Do not fail delete if file cleanup fails.
    }
  }

  return { message: 'Stable deleted successfully.' };
};
