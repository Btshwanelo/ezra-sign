import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getDashboardStats } from "../redux/slices/dashboardSlice";
import {
  FiFileText,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiUser,
  FiCopy,
  FiSend,
  FiActivity,
  FiBarChart2,
  FiArrowRight,
  FiCalendar,
  FiFlag,
  FiX,
} from "react-icons/fi";

const Dashboard = () => {
  const dispatch = useDispatch();
  const {
    documentStats,
    pendingSignatures,
    recentlyCompleted,
    expiringSoon,
    recentActivity,
    topTemplates,
    loading,
    error,
  } = useSelector((state) => state.dashboard);

  // Fetch dashboard data when component mounts
  useEffect(() => {
    dispatch(getDashboardStats());
  }, [dispatch]);

  // Helper to format dates
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper to format times
  const formatTime = (dateString) => {
    const options = { hour: "numeric", minute: "numeric" };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  // Helper to format activity type
  const formatActivityType = (type) => {
    switch (type) {
      case "document_created":
        return "Created document";
      case "document_signed":
        return "Signed document";
      case "document_viewed":
        return "Viewed document";
      case "template_created":
        return "Created template";
      case "document_sent":
        return "Sent document";
      default:
        return type.replace(/_/g, " ");
    }
  };

  // Helper to get activity icon
  const getActivityIcon = (type) => {
    switch (type) {
      case "document_created":
        return <FiFileText className="h-4 w-4" />;
      case "document_signed":
        return <FiCheckCircle className="h-4 w-4" />;
      case "document_viewed":
        return <FiEye className="h-4 w-4" />;
      case "template_created":
        return <FiCopy className="h-4 w-4" />;
      case "document_sent":
        return <FiSend className="h-4 w-4" />;
      default:
        return <FiActivity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div class="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-3 border-red-400 text-sm text-red-600 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  // If data hasn't loaded yet, show loading
  if (!documentStats) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div class="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* <h1 className="text-xl font-medium text-slate-800 mb-6">Dashboard</h1> */}

      {/* Document Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Documents
              </p>
              <h2 className="text-3xl font-semibold text-slate-800 mt-1">
                {documentStats.counts.total}
              </h2>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FiFileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Draft</p>
              <h2 className="text-3xl font-semibold text-slate-800 mt-1">
                {documentStats.counts.draft}
              </h2>
            </div>
            <div className="h-12 w-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <FiClock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <h2 className="text-3xl font-semibold text-slate-800 mt-1">
                {documentStats.counts.sent || 0}
              </h2>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FiActivity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Completed</p>
              <h2 className="text-3xl font-semibold text-slate-800 mt-1">
                {documentStats.counts.completed}
              </h2>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pending Signatures */}
        <div className="bg-white rounded-lg shadow-sm lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-base font-medium text-slate-800">
              Pending Signatures
            </h2>
            <Link
              to="/documents?status=sent"
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center"
            >
              View all <FiArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div className="p-1">
            {pendingSignatures.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">No pending signatures</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingSignatures.map((doc) => (
                  <li
                    key={doc._id}
                    className="px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="mb-2 flex justify-between">
                      <Link
                        to={`/documents/${doc._id}`}
                        className="text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors"
                      >
                        {doc.title}
                      </Link>
                      <span className="text-xs text-slate-500">
                        {formatDate(doc.createdAt)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center mb-1">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{
                              width: `${doc.progress.signingProgress}%`,
                            }}
                          ></div>
                        </div>
                        <span className="ml-3 text-xs font-medium text-slate-600">
                          {doc.progress.signingProgress}%
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 text-xs text-slate-500">
                      <span>
                        Waiting on:{" "}
                        {doc.nextRecipients.map((r) => r.name).join(", ")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Documents Expiring Soon */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-medium text-slate-800">
              Expiring Soon
            </h2>
          </div>
          <div>
            {expiringSoon.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">
                  No documents expiring soon
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {expiringSoon.map((doc) => (
                  <li
                    key={doc._id}
                    className="px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <Link
                        to={`/documents/${doc._id}`}
                        className="text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors"
                      >
                        {doc.title}
                      </Link>
                      <div className="flex items-center mt-2">
                        <FiAlertCircle
                          className={`h-4 w-4 ${
                            doc.daysRemaining <= 2
                              ? "text-red-500"
                              : "text-yellow-500"
                          } mr-1`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            doc.daysRemaining <= 2
                              ? "text-red-500"
                              : "text-yellow-500"
                          }`}
                        >
                          Expires in {doc.daysRemaining}{" "}
                          {doc.daysRemaining === 1 ? "day" : "days"}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        <div className="mt-1">
                          Pending:{" "}
                          {doc.pendingRecipients.map((r) => r.name).join(", ")}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="bg-white rounded-lg shadow-sm lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-medium text-slate-800">
              Recent Activity
            </h2>
          </div>
          <div>
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">No recent activity</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentActivity.map((activity) => (
                  <li
                    key={activity._id}
                    className="px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start">
                      <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-slate-800">
                            {activity.recipientName || "You"}
                          </p>
                          <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                            {formatTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {formatActivityType(activity.action)}
                          <Link
                            to={`/documents/${activity.documentId}`}
                            className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {" " + activity.documentTitle}
                          </Link>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Top Templates */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-base font-medium text-slate-800">
              Top Templates
            </h2>
            <Link
              to="/templates"
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center"
            >
              View all <FiArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div>
            {topTemplates.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">No templates yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {topTemplates.map((template) => (
                  <li
                    key={template.templateId}
                    className="px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <Link
                        to={`/templates/${template.templateId}`}
                        className="text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors"
                      >
                        {template.templateName}
                      </Link>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {template.documentCount}{" "}
                        {template.documentCount === 1 ? "use" : "uses"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
