import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getTemplates,
  deleteTemplate,
  createTemplate,
  createDocumentFromTemplate,
  clearTemplateErrors,
  clearTemplateSuccess,
} from "../redux/slices/templatesSlice";
import {
  FiCopy,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiUpload,
  FiXCircle,
  FiEdit3,
  FiUsers,
  FiCalendar,
  FiMoreVertical,
  FiSearch,
  FiGrid,
  FiList
} from "react-icons/fi";

const Templates = () => {
  const dispatch = useDispatch();
  const { templates, loading, error, success } = useSelector(
    (state) => state.templates
  );
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createDocumentModalOpen, setCreateDocumentModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [file, setFile] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [recipients, setRecipients] = useState([
    { name: "", email: "", signerType: "" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch templates when component mounts
  useEffect(() => {
    dispatch(getTemplates());
  }, [dispatch]);

  // Clear notifications after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearTemplateSuccess());
        dispatch(clearTemplateErrors());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  const confirmDelete = (template) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (templateToDelete) {
      dispatch(deleteTemplate(templateToDelete._id));
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTemplateToDelete(null);
  };

  const handleCreateDocumentClick = (template) => {
    setSelectedTemplate(template);
    setDocumentTitle(template.name);
    const firstSignerType = template.signerTypesSummary?.[0]?.label || "";
    if (!firstSignerType) {
      alert("Template has no signer types defined");
      return;
    }
    setRecipients([{ name: "", email: "", signerType: firstSignerType }]);
    setCreateDocumentModalOpen(true);
  };

  const handleAddRecipient = () => {
    const firstSignerType = selectedTemplate?.signerTypesSummary?.[0]?.label || "";
    if (!firstSignerType) {
      alert("Template has no signer types defined");
      return;
    }
    setRecipients([
      ...recipients,
      { name: "", email: "", signerType: firstSignerType },
    ]);
  };

  const handleRemoveRecipient = (index) => {
    const newRecipients = recipients.filter((_, i) => i !== index);
    setRecipients(newRecipients);
  };

  const handleRecipientChange = (index, field, value) => {
    const newRecipients = [...recipients];
    newRecipients[index] = {
      ...newRecipients[index],
      [field]: value,
    };
    setRecipients(newRecipients);
  };

  const handleCreateDocument = () => {
    if (selectedTemplate && documentTitle && recipients.length > 0) {
      const invalidRecipient = recipients.find(
        (r) => !r.name.trim() || !r.email.trim() || !r.signerType
      );

      if (invalidRecipient) {
        alert("Please fill in all recipient details");
        return;
      }

      const validSignerTypes = selectedTemplate.signerTypesSummary.map(
        (st) => st.label
      );

      const invalidRecipients = recipients.filter(
        (r) => !validSignerTypes.includes(r.signerType)
      );

      if (invalidRecipients.length > 0) {
        alert("Invalid signer types selected. Please select from the available signer types.");
        return;
      }

      dispatch(
        createDocumentFromTemplate({
          id: selectedTemplate._id,
          title: documentTitle,
          recipients: recipients.map((recipient) => ({
            name: recipient.name,
            email: recipient.email,
            signerType: recipient.signerType,
          })),
        })
      );
      setCreateDocumentModalOpen(false);
      setSelectedTemplate(null);
      setDocumentTitle("");
      setRecipients([{ name: "", email: "", signerType: "" }]);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !templateName) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", templateName);

    try {
      const result = await dispatch(createTemplate(formData)).unwrap();
      setUploadModalOpen(false);
      setFile(null);
      setTemplateName("");
      dispatch(getTemplates());
      window.location.href = `/templates/editor.html?id=${result.data._id}`;
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  // Filter and sort templates
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {templates.length} template{templates.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Create Template
              </button>
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
                  placeholder="Search templates..."
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

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } rounded-l-md border-r border-gray-300`}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } rounded-r-md`}
                >
                  <FiList className="w-4 h-4" />
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

      {/* Templates Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="loading-spinner"></div>
          </div>
        ) : sortedTemplates.length === 0 ? (
          <div className="text-center py-16">
            <FiCopy className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {searchQuery ? "No templates found" : "No templates"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchQuery
                ? "Try adjusting your search terms."
                : "Create a template to reuse document layouts and fields."
              }
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Create Template
                </button>
              </div>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedTemplates.map((template) => (
              <div
                key={template._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Template Preview */}
                <div className="bg-gray-100 relative h-32">
                  <div className="flex items-center justify-center h-full">
                    <FiCopy className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <button className="p-1 rounded-full bg-white shadow-sm hover:bg-gray-50">
                      <FiMoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Created {formatDate(template.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Signer Types */}
                  <div className="mt-3">
                    {template.signerTypesSummary && template.signerTypesSummary.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {template.signerTypesSummary.map((signerType, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700"
                          >
                            {signerType.label} ({signerType.fieldCount})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No signers defined</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => {
                        window.location.href = `/templates/editor.html?id=${template._id}`;
                      }}
                      className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiEdit3 className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                    
                    {template.signerTypesSummary && template.signerTypesSummary.length > 0 && (
                      <button
                        onClick={() => handleCreateDocumentClick(template)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiFileText className="w-3 h-3 mr-1" />
                        Use
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {sortedTemplates.map((template) => (
                <div key={template._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Template Icon */}
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FiCopy className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {template.name}
                          </h3>
                        </div>
                        
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <FiCalendar className="w-3 h-3 mr-1" />
                            Created {formatDate(template.createdAt)}
                          </span>
                          
                          <span className="flex items-center">
                            <FiUsers className="w-3 h-3 mr-1" />
                            {template.signerTypesSummary?.length || 0} signer type{(template.signerTypesSummary?.length || 0) !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Signer Types */}
                        {template.signerTypesSummary && template.signerTypesSummary.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {template.signerTypesSummary.map((signerType, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700"
                              >
                                {signerType.label} ({signerType.fieldCount} fields)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          window.location.href = `/templates/editor.html?id=${template._id}`;
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiEdit3 className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                      
                      {template.signerTypesSummary && template.signerTypesSummary.length > 0 && (
                        <button
                          onClick={() => handleCreateDocumentClick(template)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiFileText className="w-3 h-3 mr-1" />
                          Use Template
                        </button>
                      )}
                      
                      <button 
                        onClick={() => confirmDelete(template)}
                        className="inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiTrash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>
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
                      Delete Template
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete{" "}
                        <span className="font-medium">
                          {templateToDelete?.name}
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

      {/* Upload Template Modal */}
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
                      Create Template
                    </h3>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => setUploadModalOpen(false)}
                    >
                      <FiXCircle className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="templateName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Template Name
                    </label>
                    <input
                      type="text"
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter template name"
                      required
                    />
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template File
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
                    disabled={!file || !templateName}
                  >
                    Create Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Document from Template Modal */}
      {createDocumentModalOpen && selectedTemplate && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setCreateDocumentModalOpen(false)}
            ></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 pt-5 pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Create Document from Template
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setCreateDocumentModalOpen(false)}
                  >
                    <FiXCircle className="h-5 w-5" />
                  </button>
                </div>

                {/* Template Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FiCopy className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {selectedTemplate.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {selectedTemplate.signerTypesSummary?.length || 0} signer type{(selectedTemplate.signerTypesSummary?.length || 0) !== 1 ? "s" : ""} defined
                      </p>
                    </div>
                  </div>
                  
                  {selectedTemplate.signerTypesSummary && selectedTemplate.signerTypesSummary.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {selectedTemplate.signerTypesSummary.map((signerType, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700"
                        >
                          {signerType.label} ({signerType.fieldCount} fields)
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter document title"
                    required
                  />
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Recipients
                    </label>
                    <button
                      type="button"
                      onClick={handleAddRecipient}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <FiPlus className="w-4 h-4 mr-1" />
                      Add Recipient
                    </button>
                  </div>

                  <div className="space-y-4">
                    {recipients.map((recipient, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            Recipient {index + 1}
                          </h4>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipient(index)}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              value={recipient.name}
                              onChange={(e) =>
                                handleRecipientChange(index, "name", e.target.value)
                              }
                              className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="Recipient name"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={recipient.email}
                              onChange={(e) =>
                                handleRecipientChange(
                                  index,
                                  "email",
                                  e.target.value
                                )
                              }
                              className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="Recipient email"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Signer Type
                            </label>
                            <select
                              value={recipient.signerType}
                              onChange={(e) =>
                                handleRecipientChange(
                                  index,
                                  "signerType",
                                  e.target.value
                                )
                              }
                              className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              required
                            >
                              <option value="">Select signer type</option>
                              {selectedTemplate.signerTypesSummary?.map((st) => (
                                <option key={st.label} value={st.label}>
                                  {st.label} ({st.fieldCount} fields)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateDocumentModalOpen(false);
                    setSelectedTemplate(null);
                    setDocumentTitle("");
                    setRecipients([{ name: "", email: "", signerType: "" }]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateDocument}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Create Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;