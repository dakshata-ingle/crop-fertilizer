export const normalizeSearchTerm = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

export const buildTextSearch = (searchValue, fields = []) => {
  const normalizedTerm = normalizeSearchTerm(searchValue);

  if (!normalizedTerm || !fields.length) {
    return {};
  }

  const escapedTerm = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return {
    $or: fields.map((field) => ({ [field]: { $regex: escapedTerm, $options: 'i' } })),
  };
};

export const buildBooleanFilter = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
};

export const buildSortOptions = ({ sortBy, sortOrder, fallbackField = 'createdAt', allowedFields = [] }) => {
  const normalizedSortBy = allowedFields.includes(sortBy) ? sortBy : fallbackField;
  const normalizedSortOrder = sortOrder === 'asc' ? 1 : -1;

  return {
    [normalizedSortBy]: normalizedSortOrder,
  };
};

export const parsePagination = (query = {}) => {
  const hasPaginationRequest = [query.page, query.limit].some((value) => value !== undefined && value !== null && value !== '');
  const parsedPage = Number.parseInt(query.page, 10);
  const parsedLimit = Number.parseInt(query.limit, 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

  return {
    page,
    limit,
    hasPaginationRequest,
  };
};

export const buildPaginationMeta = ({ page, limit, totalItems, hasPaginationRequest = true }) => {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.max(1, Number(limit) || 10);
  const effectiveLimit = hasPaginationRequest ? normalizedLimit : Math.max(totalItems, 1);
  const totalPages = hasPaginationRequest ? Math.max(1, Math.ceil(totalItems / effectiveLimit)) : 1;

  return {
    page: normalizedPage,
    limit: effectiveLimit,
    totalItems,
    totalPages,
    hasNextPage: hasPaginationRequest ? normalizedPage < totalPages : false,
    hasPrevPage: hasPaginationRequest ? normalizedPage > 1 : false,
  };
};
