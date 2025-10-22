import axios from './axios';

// API Key Management
export const getApiKeys = async () => {
  const response = await axios.get('/api-keys');
  return response.data;
};

export const createApiKey = async (data) => {
  const response = await axios.post('/api-keys', data);
  return response.data;
};

export const deleteApiKey = async (keyId) => {
  const response = await axios.delete(`/api-keys/${keyId}`);
  return response.data;
};

// Webhook Management
export const getWebhooks = async () => {
  const response = await axios.get('/webhooks');
  return response.data;
};

export const createWebhook = async (data) => {
  const response = await axios.post('/webhooks', data);
  return response.data;
};

export const updateWebhook = async (webhookId, data) => {
  const response = await axios.put(`/webhooks/${webhookId}`, data);
  return response.data;
};

export const deleteWebhook = async (webhookId) => {
  const response = await axios.delete(`/webhooks/${webhookId}`);
  return response.data;
};

export const testWebhook = async (webhookId) => {
  const response = await axios.post(`/webhooks/${webhookId}/test`);
  return response.data;
}; 