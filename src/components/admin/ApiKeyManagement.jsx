import React, { useState, useEffect } from 'react';
import { getApiKeys, createApiKey, deleteApiKey } from '../../api/adminApi';
import { toast } from 'react-hot-toast';
import { FiKey, FiCopy, FiTrash2, FiX, FiPlus, FiCalendar, FiEye } from 'react-icons/fi';

const ApiKeyManagement = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await getApiKeys();
      setApiKeys(response.data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to fetch API keys');
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    try {
      const response = await createApiKey({ name: newKeyName });
      setNewKeyData(response.data);
      setShowNewKeyModal(true);
      setNewKeyName('');
      fetchApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error(error.response?.data?.message || 'Failed to create API key');
    }
  };

  const confirmDeleteKey = (key) => {
    setKeyToDelete(key);
    setShowDeleteModal(true);
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    try {
      await deleteApiKey(keyToDelete._id);
      setApiKeys(prevKeys => prevKeys.filter(key => key._id !== keyToDelete._id));
      toast.success('API key deleted successfully');
      setShowDeleteModal(false);
      setKeyToDelete(null);
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const closeNewKeyModal = () => {
    setShowNewKeyModal(false);
    setNewKeyData(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">API Keys</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your API keys to integrate with external applications.
        </p>
      </div>

      {/* Create new API key form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Create New API Key</h3>
        <form onSubmit={handleCreateKey} className="space-y-4">
          <div>
            <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-2">
              API Key Name
            </label>
            <input
              id="keyName"
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Enter a descriptive name for your API key"
              className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Create API Key
            </button>
          </div>
        </form>
      </div>

      {/* API Keys list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900">Your API Keys</h3>
          <span className="text-sm text-gray-500">
            {apiKeys.length} key{apiKeys.length !== 1 ? 's' : ''}
          </span>
        </div>

        {apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FiKey className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No API keys</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first API key to start integrating with external applications.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {apiKeys.map((key) => (
              <div key={key._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FiKey className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{key.name}</h4>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <FiCalendar className="w-3 h-3 mr-1" />
                          Created {formatDate(key.createdAt)}
                        </span>
                        {key.lastUsed && (
                          <span className="flex items-center">
                            <FiEye className="w-3 h-3 mr-1" />
                            Last used {formatDate(key.lastUsed)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => confirmDeleteKey(key)}
                      className="inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiTrash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && keyToDelete && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDeleteModal(false)}
            ></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-md w-full">
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                    <FiTrash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Delete API Key
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the API key{" "}
                        <span className="font-medium">{keyToDelete.name}</span>?
                        This action cannot be undone and will immediately revoke access.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  onClick={handleDeleteKey}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New API Key Modal */}
      {showNewKeyModal && newKeyData && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeNewKeyModal}
            ></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-2xl w-full">
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">API Key Created Successfully</h3>
                  <button
                    onClick={closeNewKeyModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Make sure to copy your API key now. 
                      You won't be able to see it again for security reasons.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your API Key
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md p-3">
                        <code className="text-sm font-mono text-gray-900 break-all">
                          {newKeyData.key}
                        </code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(newKeyData.key)}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        title="Copy API Key"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{newKeyData.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Expires</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(newKeyData.expiresAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3">
                <button
                  onClick={closeNewKeyModal}
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  I've copied my API key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManagement;