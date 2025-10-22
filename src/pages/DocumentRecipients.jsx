import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiArrowLeft,
  FiEye,
  FiCheck,
  FiX,
  FiDownload,
  FiSend,
  FiClock,
  FiCheckCircle,
  FiUser,
  FiMail,
  FiCalendar,
  FiActivity
} from "react-icons/fi";
import {
  getDocument,
  updateDocumentRecipients,
} from "../redux/slices/documentsSlice";

const DocumentRecipients = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentDocument, loading, error } = useSelector(
    (state) => state.documents
  );
  const [recipients, setRecipients] = useState([]);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    name: "",
    email: "",
    signerType: "signer",
    order: 1,
  });
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (id) {
      dispatch(getDocument(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentDocument && currentDocument.recipients) {
      setRecipients(currentDocument.recipients);
    }
  }, [currentDocument]);

  const handleAddRecipient = () => {
    if (!newRecipient.name || !newRecipient.email) return;

    const updatedRecipients = [
      ...recipients,
      {
        ...newRecipient,
        _id: Date.now().toString(),
        signed: false,
        viewed: false,
        status: "pending",
        progress: {
          totalFields: 0,
          completedFields: 0,
          requiredFields: 0,
          completedRequiredFields: 0,
          totalCompletionPercentage: 0,
          requiredCompletionPercentage: 0,
          missingRequiredFields: [],
          allRequiredFieldsCompleted: false,
        },
        fieldValues: [],
      },
    ];

    setRecipients(updatedRecipients);
    dispatch(
      updateDocumentRecipients({
        documentId: id,
        recipients: updatedRecipients,
        sendEmails: true,
      })
    );
    setShowAddRecipient(false);
    setNewRecipient({
      name: "",
      email: "",
      signerType: "signer",
      order: updatedRecipients.length + 1,
    });
  };

  const handleRemoveRecipient = (recipientId) => {
    const updatedRecipients = recipients.filter((r) => r._id !== recipientId);
    setRecipients(updatedRecipients);
    dispatch(
      updateDocumentRecipients({
        documentId: id,
        recipients: updatedRecipients,
      })
    );
  };

  const getStatusIcon = (recipient) => {
    if (recipient.signed) {
      return <FiCheckCircle className="w-4 h-4 text-green-500" />;
    } else if (recipient.viewed) {
      return <FiClock className="w-4 h-4 text-yellow-500" />;
    } else {
      return <FiUser className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (recipient) => {
    if (recipient.signed) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <FiCheckCircle className="w-3 h-3 mr-1" />
          Completed
        </span>
      );
    } else if (recipient.viewed) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <FiClock className="w-3 h-3 mr-1" />
          In Progress
        </span>
      );
    } else {
      return (
        // <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        //   <FiMail className="w-3 h-3 mr-1" />
        //   Sent
        // </span>
        null
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not yet';
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
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600 text-center">
              <p className="text-lg font-medium">Error loading document</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentDocument) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 text-center">
              <p className="text-lg font-medium">Document not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <FiArrowLeft className="w-4 h-4 mr-2" />
                  Back to Documents
                </button>
                <div className="border-l border-gray-300 h-6"></div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentDocument.title}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {formatDate(currentDocument.createdAt)}
                  </p>
                </div>
              </div>
              
              {/* <div className="flex items-center space-x-3">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <FiDownload className="w-4 h-4 mr-2" />
                  Download
                </button>
                
                {currentDocument.status !== 'completed' && (
                  <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <FiSend className="w-4 h-4 mr-2" />
                    Send Reminder
                  </button>
                )}
              </div> */}
            </div>

            {/* Document Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Recipients</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {currentDocument.summary?.totalRecipients || recipients.length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiCheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-500">Signed</p>
                    <p className="text-lg font-semibold text-green-900">
                      {currentDocument.summary?.signedRecipients || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiClock className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-500">Pending</p>
                    <p className="text-lg font-semibold text-yellow-900">
                      {currentDocument.summary?.pendingRecipients || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiActivity className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-500">Progress</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {currentDocument.summary?.signingProgress || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recipients List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recipients</h2>
              <span className="text-sm text-gray-500">
                {recipients.length} recipient{recipients.length !== 1 && 's'}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {recipients.map((recipient, index) => (
              <div key={recipient._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {recipient.name.charAt(0)}
                        </span>
                      </div>
                    </div>

                    {/* Recipient Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          {recipient.name}
                        </h3>
                        {getStatusBadge(recipient)}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {recipient.signerType}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <FiMail className="w-3 h-3 mr-1" />
                          {recipient.email}
                        </span>
                        <span>•</span>
                        <span>Order {recipient.order}</span>
                        {recipient.signedAt && (
                          <>
                            <span>•</span>
                            <span className="flex items-center">
                              <FiCalendar className="w-3 h-3 mr-1" />
                              Signed {formatDate(recipient.signedAt)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {recipient.progress && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>
                              {recipient.progress.completedFields}/{recipient.progress.totalFields} fields completed
                            </span>
                            <span>{recipient.progress.totalCompletionPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                recipient.progress.totalCompletionPercentage === 100
                                  ? 'bg-green-500'
                                  : recipient.progress.totalCompletionPercentage > 0
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-300'
                              }`}
                              style={{
                                width: `${recipient.progress.totalCompletionPercentage}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedRecipient(recipient);
                        setShowDetailsModal(true);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiEye className="w-3 h-3 mr-1" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail */}
        {currentDocument.auditTrail && currentDocument.auditTrail.length > 0 && (
          <div className="mt-8 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Activity Timeline</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {currentDocument.auditTrail.map((event, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        event.action === 'completed' || event.action === 'signed'
                          ? 'bg-green-100'
                          : event.action === 'viewed'
                          ? 'bg-yellow-100'
                          : 'bg-blue-100'
                      }`}>
                        {event.action === 'completed' || event.action === 'signed' ? (
                          <FiCheckCircle className="w-4 h-4 text-green-600" />
                        ) : event.action === 'viewed' ? (
                          <FiEye className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <FiActivity className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-900">
                        {event.message || `Document ${event.action.replace('_', ' ')}`}
                        {event.recipientName && (
                          <span className="font-medium"> by {event.recipientName}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(event.timestamp)}
                        {event.recipientEmail && (
                          <span className="ml-2">({event.recipientEmail})</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recipient Details Modal */}
      {showDetailsModal && selectedRecipient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recipient Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-blue-700">
                      {selectedRecipient.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedRecipient.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedRecipient.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedRecipient.signerType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedRecipient.order}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedRecipient)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedRecipient.progress.totalCompletionPercentage}%
                    </p>
                  </div>
                </div>

                {selectedRecipient.viewed && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Viewed At</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(selectedRecipient.viewedAt)}
                    </p>
                  </div>
                )}

                {selectedRecipient.signed && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Signed At</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(selectedRecipient.signedAt)}
                    </p>
                  </div>
                )}

                {selectedRecipient.progress && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Field Progress</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Total Fields:</span>
                        <span className="font-medium">{selectedRecipient.progress.totalFields}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="font-medium">{selectedRecipient.progress.completedFields}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Required Fields:</span>
                        <span className="font-medium">{selectedRecipient.progress.requiredFields}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Required Completed:</span>
                        <span className="font-medium">{selectedRecipient.progress.completedRequiredFields}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRecipient.progress?.missingRequiredFields?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-500 uppercase tracking-wider mb-2">
                      Missing Required Fields
                    </p>
                    <ul className="space-y-1 text-xs text-red-600">
                      {selectedRecipient.progress.missingRequiredFields.map((field, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                          {field.label} ({field.type})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
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

export default DocumentRecipients;