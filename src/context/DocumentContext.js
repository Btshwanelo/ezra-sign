import React, { createContext, useContext, useState, useCallback } from 'react';
import * as documentService from '../services/documentService';

const DocumentContext = createContext();

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Template management
  const createTemplate = useCallback(async (templateData) => {
    try {
      setLoading(true);
      const response = await documentService.createTemplate(templateData);
      setTemplates(prev => [...prev, response.data]);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating template');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await documentService.getTemplates();
      setTemplates(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching templates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Document instance management
  const createInstance = useCallback(async (templateId, recipients) => {
    try {
      setLoading(true);
      const response = await documentService.createInstance(templateId, recipients);
      setDocuments(prev => [...prev, response.data]);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating document instance');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocuments = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await documentService.getDocuments(params);
      setDocuments(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching documents');
    } finally {
      setLoading(false);
    }
  }, []);

  // Document signing
  const fetchDocumentForSigning = useCallback(async (documentId, token, email) => {
    try {
      setLoading(true);
      const response = await documentService.getDocumentForSigning(documentId, token, email);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching document for signing');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitSignature = useCallback(async (documentId, token, email, signatureData) => {
    try {
      setLoading(true);
      const response = await documentService.signDocument(documentId, token, email, signatureData);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting signature');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Document tracking
  const fetchSignerDocuments = useCallback(async (email) => {
    try {
      setLoading(true);
      const response = await documentService.getSignerDocuments(email);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching signer documents');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    documents,
    templates,
    loading,
    error,
    createTemplate,
    fetchTemplates,
    createInstance,
    fetchDocuments,
    fetchDocumentForSigning,
    submitSignature,
    fetchSignerDocuments,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocument = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}; 