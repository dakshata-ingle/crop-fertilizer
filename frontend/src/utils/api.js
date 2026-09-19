export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  ...jsonHeaders,
});

const parseResponse = async (response) => {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }
  return data;
};

const buildRequestHeaders = (payload) => {
  if (payload instanceof FormData) {
    return {};
  }

  return jsonHeaders;
};

const buildBody = (payload) => (payload instanceof FormData ? payload : JSON.stringify(payload));

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

export const signupUser = async (name, email, password, confirmPassword, phone, village, registerUnder = 'individual', loginType = 'farmer') => {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ name, email, password, confirmPassword, phone, village, registerUnder, loginType }),
  });
  return parseResponse(response);
};

export const loginUser = async (email, password, loginType = 'farmer') => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email, password, loginType }),
  });
  return parseResponse(response);
};

export const fetchCurrentUser = async (token) => {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchCatalog = async () => {
  const response = await fetch(`${API_URL}/api/catalog`);
  return parseResponse(response);
};

export const fetchActiveClientsForSignup = async () => {
  const response = await fetch(`${API_URL}/api/clients/public/active`);
  return parseResponse(response);
};

export const saveRecommendation = async (token, recommendationData) => {
  const response = await fetch(`${API_URL}/api/recommendations`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ token, ...recommendationData }),
  });
  return parseResponse(response);
};

export const fetchRecommendations = async (token) => {
  const response = await fetch(`${API_URL}/api/recommendations`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const toggleRecommendationBookmark = async (token, id, isBookmarked) => {
  const response = await fetch(`${API_URL}/api/recommendations/${id}/bookmark`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ isBookmarked }),
  });
  return parseResponse(response);
};

export const fetchNotifications = async (token) => {
  const response = await fetch(`${API_URL}/api/notifications`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const markNotificationAsRead = async (token, id) => {
  const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const markAllNotificationsAsRead = async (token) => {
  const response = await fetch(`${API_URL}/api/notifications/read-all`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchAuditLogs = async (token) => {
  const response = await fetch(`${API_URL}/api/audit-logs`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchClients = async (token, params = {}) => {
  const response = await fetch(`${API_URL}/api/clients${buildQueryString(params)}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchClientAdmins = async (token, params = {}) => {
  const response = await fetch(`${API_URL}/api/client-admins${buildQueryString(params)}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchClientAdminById = async (token, id) => {
  const response = await fetch(`${API_URL}/api/client-admins/${id}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const updateClientAdmin = async (token, id, adminData) => {
  const response = await fetch(`${API_URL}/api/client-admins/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(adminData),
  });
  return parseResponse(response);
};

export const updateClientAdminStatus = async (token, id, status) => {
  const response = await fetch(`${API_URL}/api/client-admins/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
};

export const fetchClientFertilizers = async (token, params = {}) => {
  const response = await fetch(`${API_URL}/api/fertilizers${buildQueryString(params)}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchFertilizerById = async (token, id) => {
  const response = await fetch(`${API_URL}/api/fertilizers/${id}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchFertilizerPriceHistory = async (token, id) => {
  const response = await fetch(`${API_URL}/api/fertilizers/${id}/price-history`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchFertilizerChangeHistory = async (token, id) => {
  const response = await fetch(`${API_URL}/api/fertilizers/${id}/change-history`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchClientCrops = async (token, params = {}) => {
  const response = await fetch(`${API_URL}/api/crops${buildQueryString(params)}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchClientCropById = async (token, id) => {
  const response = await fetch(`${API_URL}/api/crops/${id}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const createClientCrop = async (token, cropData) => {
  const response = await fetch(`${API_URL}/api/crops`, {
    method: 'POST',
    headers: {
      ...(cropData instanceof FormData ? {} : jsonHeaders),
      Authorization: `Bearer ${token}`,
    },
    body: buildBody(cropData),
  });
  return parseResponse(response);
};

export const updateClientCrop = async (token, id, cropData) => {
  const response = await fetch(`${API_URL}/api/crops/${id}`, {
    method: 'PUT',
    headers: {
      ...(cropData instanceof FormData ? {} : jsonHeaders),
      Authorization: `Bearer ${token}`,
    },
    body: buildBody(cropData),
  });
  return parseResponse(response);
};

export const softDeleteClientCrop = async (token, id) => {
  const response = await fetch(`${API_URL}/api/crops/${id}/soft-delete`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const updateCropActiveStatus = async (token, id, isActive) => {
  const response = await fetch(`${API_URL}/api/crops/${id}/active-status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ isActive }),
  });
  return parseResponse(response);
};

export const fetchCropVarieties = async (token, cropId, params = {}) => {
  const response = await fetch(`${API_URL}/api/crop-varieties/crop/${cropId}${buildQueryString(params)}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchCropVarietyById = async (token, id) => {
  const response = await fetch(`${API_URL}/api/crop-varieties/${id}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const createCropVariety = async (token, varietyData) => {
  const response = await fetch(`${API_URL}/api/crop-varieties`, {
    method: 'POST',
    headers: {
      ...(varietyData instanceof FormData ? {} : jsonHeaders),
      Authorization: `Bearer ${token}`,
    },
    body: buildBody(varietyData),
  });
  return parseResponse(response);
};

export const updateCropVariety = async (token, id, varietyData) => {
  const response = await fetch(`${API_URL}/api/crop-varieties/${id}`, {
    method: 'PUT',
    headers: {
      ...(varietyData instanceof FormData ? {} : jsonHeaders),
      Authorization: `Bearer ${token}`,
    },
    body: buildBody(varietyData),
  });
  return parseResponse(response);
};

export const softDeleteCropVariety = async (token, id) => {
  const response = await fetch(`${API_URL}/api/crop-varieties/${id}/soft-delete`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const updateCropVarietyStatus = async (token, id, status) => {
  const response = await fetch(`${API_URL}/api/crop-varieties/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
};

export const fetchGrowthStagesByCrop = async (token, cropId, params = {}) => {
  const response = await fetch(`${API_URL}/api/growth-stages/crop/${cropId}${buildQueryString(params)}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchGrowthStagesByVariety = async (token, varietyId, params = {}) => {
  const response = await fetch(`${API_URL}/api/growth-stages/variety/${varietyId}${buildQueryString(params)}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchGrowthStageById = async (token, id) => {
  const response = await fetch(`${API_URL}/api/growth-stages/${id}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchPendingGrowthStages = async (token, params = {}) => {
  const response = await fetch(`${API_URL}/api/growth-stages/pending/approval${buildQueryString(params)}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const createGrowthStage = async (token, stageData) => {
  const response = await fetch(`${API_URL}/api/growth-stages`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(stageData),
  });
  return parseResponse(response);
};

export const updateGrowthStage = async (token, id, stageData) => {
  const response = await fetch(`${API_URL}/api/growth-stages/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(stageData),
  });
  return parseResponse(response);
};

export const updateGrowthStageStatus = async (token, id, status) => {
  const response = await fetch(`${API_URL}/api/growth-stages/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
};

export const softDeleteGrowthStage = async (token, id) => {
  const response = await fetch(`${API_URL}/api/growth-stages/${id}/soft-delete`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const createClientFertilizer = async (token, fertilizerData) => {
  const response = await fetch(`${API_URL}/api/fertilizers`, {
    method: 'POST',
    headers: {
      ...(fertilizerData instanceof FormData ? {} : jsonHeaders),
      Authorization: `Bearer ${token}`,
    },
    body: buildBody(fertilizerData),
  });
  return parseResponse(response);
};

export const updateClientFertilizer = async (token, id, fertilizerData) => {
  const response = await fetch(`${API_URL}/api/fertilizers/${id}`, {
    method: 'PUT',
    headers: {
      ...(fertilizerData instanceof FormData ? {} : jsonHeaders),
      Authorization: `Bearer ${token}`,
    },
    body: buildBody(fertilizerData),
  });
  return parseResponse(response);
};

export const softDeleteClientFertilizer = async (token, id) => {
  const response = await fetch(`${API_URL}/api/fertilizers/${id}/soft-delete`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const updateFertilizerActiveStatus = async (token, id, isActive) => {
  const response = await fetch(`${API_URL}/api/fertilizers/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ isActive }),
  });
  return parseResponse(response);
};

export const createClientAdmin = async (token, adminData) => {
  const response = await fetch(`${API_URL}/api/client-admins`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(adminData),
  });
  return parseResponse(response);
};

export const fetchPendingCrops = async (token) => {
  const response = await fetch(`${API_URL}/api/crops/pending`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const updateCropStatus = async (token, id, status) => {
  const response = await fetch(`${API_URL}/api/crops/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
};

export const fetchPendingFertilizers = async (token) => {
  const response = await fetch(`${API_URL}/api/fertilizer-approvals/pending`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const updateFertilizerStatus = async (token, id, status) => {
  const response = await fetch(`${API_URL}/api/fertilizer-approvals/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
};

export const fetchUsers = async (token, params = {}) => {
  const response = await fetch(`${API_URL}/api/auth/users${buildQueryString(params)}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const fetchClientById = async (token, id) => {
  const response = await fetch(`${API_URL}/api/clients/${id}`, {
    headers: authHeaders(token),
  });
  return parseResponse(response);
};

export const createClient = async (token, clientData) => {
  const response = await fetch(`${API_URL}/api/clients`, {
    method: 'POST',
    headers: {
      ...(clientData instanceof FormData ? {} : jsonHeaders),
      Authorization: `Bearer ${token}`,
    },
    body: buildBody(clientData),
  });
  return parseResponse(response);
};

export const updateClient = async (token, id, clientData) => {
  const response = await fetch(`${API_URL}/api/clients/${id}`, {
    method: 'PUT',
    headers: {
      ...(clientData instanceof FormData ? {} : jsonHeaders),
      Authorization: `Bearer ${token}`,
    },
    body: buildBody(clientData),
  });
  return parseResponse(response);
};

export const updateClientStatus = async (token, id, status) => {
  const response = await fetch(`${API_URL}/api/clients/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
};

export const toggleClientActiveStatus = async (token, id, isActive) => {
  const response = await fetch(`${API_URL}/api/clients/${id}/active`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ isActive }),
  });
  return parseResponse(response);
};
