import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getDocuments,
  deleteDocument,
  uploadDocument,
  clearDocumentErrors,
  clearDocumentSuccess,
} from "../redux/slices/documentsSlice";
import {
  FiFileText,
  FiUpload,
  FiTrash2,
  FiEdit,
  FiEye,
  FiDownload,
  FiPlus,
  FiUsers,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiClock,
  FiCheck,
  FiArchive
} from "react-icons/fi";

const Documents = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { documents, loading, error, success } = useSelector(
    (state) => state.documents
  );
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");

  // Get status from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status") || "all";
    setSelectedFilter(status);
  }, [location.search]);

  // Fetch documents based on filter
  useEffect(() => {
    const statusFilter = selectedFilter === "all" ? null : selectedFilter;
    dispatch(getDocuments(statusFilter));
  }, [dispatch, selectedFilter]);

  // Clear notifications after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearDocumentSuccess());
        dispatch(clearDocumentErrors());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  const handleFilterChange = (status) => {
    setSelectedFilter(status);
    navigate(`/documents${status === "all" ? "" : `?status=${status}`}`);
  };

  const confirmDelete = (document) => {
    setDocumentToDelete(document);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (documentToDelete) {
      dispatch(deleteDocument(documentToDelete._id));
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDocumentToDelete(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Draft
          </span>
        );
      case "sent":
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Pending
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <FiCheck className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    try {
      await dispatch(uploadDocument(formData)).unwrap();
      setUploadModalOpen(false);
      setFile(null);
      setTitle("");
      dispatch(getDocuments(selectedFilter === "all" ? null : selectedFilter));
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  // Filter and sort documents
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "name":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {documents.length} document{documents.length !== 1 && "s"}
                </p>
              </div>
              {/* <button
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                New Document
              </button> */}
            </div>

            {/* Search and Filter Bar */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="newest">Sort by: Newest</option>
                  <option value="oldest">Sort by: Oldest</option>
                  <option value="name">Sort by: Name</option>
                </select>
              </div>

              {/* Filter Buttons */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleFilterChange("all")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedFilter === "all"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleFilterChange("draft")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedFilter === "draft"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Drafts
                </button>
                <button
                  onClick={() => handleFilterChange("sent")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedFilter === "sent"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleFilterChange("completed")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedFilter === "completed"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success and Error Messages */}
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-md bg-green-50 border border-green-200 p-4">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="loading-spinner"></div>
          </div>
        ) : sortedDocuments.length === 0 ? (
          <div className="text-center py-16">
            <FiFileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {searchQuery ? "No documents found" : "No documents"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchQuery 
                ? "Try adjusting your search terms or filters."
                : "Get started by uploading a new document."
              }
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  New Document
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {sortedDocuments.map((document) => (
                <div
                  key={document._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      {/* Document Icon */}
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FiFileText className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>

                      {/* Document Info */}
                      <div className="ml-4 min-w-0 flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {document.title}
                          </h3>
                          {getStatusBadge(document.status)}
                        </div>
                        
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          <span>
                            {new Date(document.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          
                          {document.summary && (
                            <>
                              <span>•</span>
                              <span className="flex items-center">
                                <FiUsers className="w-3 h-3 mr-1" />
                                {document.summary.signedRecipients}/{document.summary.totalRecipients} signed
                              </span>
                            </>
                          )}
                          
                          {document.recipients && document.recipients.length > 0 && (
                            <>
                              <span>•</span>
                              <span>
                                {document.recipients.map(r => r.name).join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        to={`/documents/${document._id}/recipients`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiEye className="w-3 h-3 mr-1" />
                        View
                      </Link>
                      
                      <div className="relative">
                        <button className="inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <FiMoreVertical className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Recipients Progress (for documents with recipients) */}
                  {document.recipients && document.recipients.length > 0 && (
                    <div className="mt-4 pl-14">
                      <div className="flex flex-wrap gap-2">
                        {document.recipients.map((recipient, index) => (
                          <div
                            key={index}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              recipient.signed
                                ? 'bg-green-100 text-green-700'
                                : recipient.viewed
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {recipient.signed ? (
                              <FiCheck className="w-3 h-3 mr-1" />
                            ) : recipient.viewed ? (
                              <FiClock className="w-3 h-3 mr-1" />
                            ) : (
                              <FiUsers className="w-3 h-3 mr-1" />
                            )}
                            {recipient.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={cancelDelete}
            ></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-md w-full">
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                    <FiTrash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Delete Document
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete{" "}
                        <span className="font-medium">
                          {documentToDelete?.title}
                        </span>
                        ? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setUploadModalOpen(false)}
            ></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-md w-full">
              <form onSubmit={handleUpload}>
                <div className="px-6 pt-5 pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Upload Document
                    </h3>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500 transition-colors"
                      onClick={() => setUploadModalOpen(false)}
                    >
                      <FiXCircle className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Document Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter title"
                      required
                    />
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document File
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-4 pb-4 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <FiUpload className="mx-auto h-10 w-10 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx"
                            required
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX up to 10MB
                      </p>
                      {file && (
                        <p className="text-xs text-green-600 font-medium">
                          Selected: {file.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={() => setUploadModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={!file || !title}
                  >
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;