import React, { useState, useEffect } from 'react';
import { getWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook } from '../../api/adminApi';
import { toast } from 'react-hot-toast';
import { 
  FiLink, 
  FiPlay, 
  FiTrash2, 
  FiX, 
  FiCopy, 
  FiPlus, 
  FiGlobe, 
  FiActivity,
  FiCalendar,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';

const truncateUrl = (url, maxLength = 50) => {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
};

const WebhookManagement = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [],
    description: '',
    monitorAllTemplates: false
  });
  const [testResponse, setTestResponse] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await getWebhooks();
      setWebhooks(response.data || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast.error('Failed to fetch webhooks');
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    if (!newWebhook.name.trim()) {
      toast.error('Please enter a webhook name');
      return;
    }
    if (!newWebhook.url.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }
    if (newWebhook.events.length === 0) {
      toast.error('Please select at least one event');
      return;
    }

    setIsCreating(true);
    try {
      const response = await createWebhook(newWebhook);
      const created = response.data;
      setWebhooks(prevWebhooks => [...prevWebhooks, created]);
      setNewWebhook({
        name: '',
        url: '',
        events: [],
        description: '',
        monitorAllTemplates: false
      });
      toast.success('Webhook created successfully');
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error(error.response?.data?.message || 'Failed to create webhook');
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDeleteWebhook = (webhook) => {
    setWebhookToDelete(webhook);
    setShowDeleteModal(true);
  };

  const handleDeleteWebhook = async () => {
    if (!webhookToDelete) return;

    try {
      await deleteWebhook(webhookToDelete._id);
      setWebhooks(prevWebhooks => prevWebhooks.filter(webhook => webhook._id !== webhookToDelete._id));
      toast.success('Webhook deleted successfully');
      setShowDeleteModal(false);
      setWebhookToDelete(null);
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  const handleTestWebhook = async (webhookId) => {
    try {
      const response = await testWebhook(webhookId);
      setTestResponse(response.data);
      setShowTestModal(true);
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error(error.response?.data?.message || 'Error testing webhook');
    }
  };

  const handleToggleEvent = (event) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const availableEvents = [
    'created_from_template',
    'created_via_api',
    'sent',
    'viewed',
    'signed',
    'declined',
    'completed',
    'canceled'
  ];

  const closeTestModal = () => {
    setShowTestModal(false);
    setTestResponse(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
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
        <h2 className="text-lg font-medium text-gray-900">Webhooks</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure webhooks to receive real-time notifications about document events.
        </p>
      </div>

      {/* Create new webhook form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Create New Webhook</h3>
        <form onSubmit={handleCreateWebhook} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="webhookName" className="block text-sm font-medium text-gray-700 mb-2">
                Webhook Name
              </label>
              <input
                id="webhookName"
                type="text"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter webhook name"
                className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <input
                id="webhookUrl"
                type="url"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://your-domain.com/webhook"
                className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="webhookDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              id="webhookDescription"
              type="text"
              value={newWebhook.description}
              onChange={(e) => setNewWebhook(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this webhook"
              className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Events to Monitor
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {availableEvents.map((event) => (
                <label key={event} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newWebhook.events.includes(event)}
                    onChange={() => handleToggleEvent(event)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{event}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={newWebhook.monitorAllTemplates}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, monitorAllTemplates: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Monitor all templates</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Webhook'}
            </button>
          </div>
        </form>
      </div>

      {/* Webhooks list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900">Your Webhooks</h3>
          <span className="text-sm text-gray-500">
            {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''}
          </span>
        </div>

        {webhooks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FiGlobe className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No webhooks</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first webhook to start receiving real-time notifications.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {webhooks.map((webhook) => (
              <div key={webhook._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FiGlobe className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-sm font-medium text-gray-900">{webhook.name}</h4>
                        <div className="flex items-center">
                          {webhook.isActive ? (
                            <FiCheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <FiXCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`ml-1 text-xs font-medium ${
                            webhook.isActive ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 mt-1" title={webhook.url}>
                        {truncateUrl(webhook.url)}
                      </p>

                      {webhook.description && (
                        <p className="text-sm text-gray-500 mt-1">{webhook.description}</p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700"
                          >
                            {event}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        {webhook.monitorAllTemplates && (
                          <span className="flex items-center">
                            <FiActivity className="w-3 h-3 mr-1" />
                            All Templates
                          </span>
                        )}
                        {webhook.lastTriggered && (
                          <span className="flex items-center">
                            <FiCalendar className="w-3 h-3 mr-1" />
                            Last triggered {formatDate(webhook.lastTriggered)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTestWebhook(webhook._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Test Webhook"
                    >
                      <FiPlay className="w-3 h-3 mr-1" />
                      Test
                    </button>
                    <button
                      onClick={() => confirmDeleteWebhook(webhook)}
                      className="inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Delete Webhook"
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
      {showDeleteModal && webhookToDelete && (
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
                      Delete Webhook
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the webhook{" "}
                        <span className="font-medium">{webhookToDelete.name}</span>?
                        This action cannot be undone and will stop all notifications to this endpoint.
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
                  onClick={handleDeleteWebhook}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Webhook Modal */}
      {showTestModal && testResponse && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeTestModal}
            ></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-4xl w-full max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Webhook Test Results</h3>
                <button
                  onClick={closeTestModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-auto max-h-[calc(90vh-8rem)]">
                <div className="space-y-6">
                  {/* Webhook Info */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Webhook Details</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Name</label>
                          <p className="mt-1 text-sm text-gray-900">{testResponse.webhook.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">URL</label>
                          <div className="mt-1 flex items-center space-x-2">
                            <p className="text-sm text-gray-900 truncate" title={testResponse.webhook.url}>
                              {truncateUrl(testResponse.webhook.url, 40)}
                            </p>
                            <button
                              onClick={() => copyToClipboard(testResponse.webhook.url)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="Copy URL"
                            >
                              <FiCopy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-500">Subscribed Events</label>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {testResponse.webhook.events.map((event) => (
                              <span
                                key={event}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700"
                              >
                                {event}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test Payload */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Test Payload</h4>
                    <div className="space-y-4">
                      {testResponse.testPayload.events.map((event, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <h5 className="text-sm font-medium text-blue-600">
                              {event.event}
                            </h5>
                          </div>
                          <div className="p-4">
                            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3">
                <button
                  onClick={closeTestModal}
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookManagement;