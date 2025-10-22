import React, { useState } from 'react';
import ApiKeyManagement from '../components/admin/ApiKeyManagement';
import WebhookManagement from '../components/admin/WebhookManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('api-keys');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-medium text-slate-800 mb-6">
        Admin Settings
      </h1>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex">
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'api-keys'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('api-keys')}
            >
              API Keys
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'webhooks'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('webhooks')}
            >
              Webhooks
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'api-keys' ? (
            <ApiKeyManagement />
          ) : (
            <WebhookManagement />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 