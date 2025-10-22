import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Admin document template management
export const createTemplate = async (templateData) => {
  const response = await axios.post(`${API_URL}/documents/templates`, templateData);
  return response.data;
};

export const getTemplates = async () => {
  const response = await axios.get(`${API_URL}/documents/templates`);
  return response.data;
};

export const getTemplate = async (templateId) => {
  const response = await axios.get(`${API_URL}/documents/templates/${templateId}`);
  return response.data;
};

// Admin document instance management
export const createInstance = async (templateId, recipients) => {
  const response = await axios.post(`${API_URL}/documents/templates/${templateId}/instances`, { recipients });
  return response.data;
};

export const getDocuments = async (params = {}) => {
  const response = await axios.get(`${API_URL}/documents`, { params });
  return response.data;
};

export const getDocument = async (documentId) => {
  const response = await axios.get(`${API_URL}/documents/${documentId}`);
  return response.data;
};

// Public document signing
export const getDocumentForSigning = async (documentId, token, email) => {
  const response = await axios.get(`${API_URL}/sign/${documentId}/${token}/${email}`);
  return response.data;
};

export const signDocument = async (documentId, token, email, signatureData) => {
  const response = await axios.put(`${API_URL}/sign/${documentId}/${token}/${email}`, signatureData);
  return response.data;
};

// Admin document tracking
export const getSignerDocuments = async (email) => {
  const response = await axios.get(`${API_URL}/documents/signer/${email}`);
  return response.data;
};

export const getDocumentStats = async () => {
  const response = await axios.get(`${API_URL}/documents/stats`);
  return response.data;
};

// Document downloads
export const downloadDocument = async (documentId) => {
  const response = await axios.get(`${API_URL}/documents/${documentId}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

export const downloadSignedDocument = async (documentId) => {
  const response = await axios.get(`${API_URL}/documents/${documentId}/download/signed`, {
    responseType: 'blob'
  });
  return response.data;
}; 