import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getDocumentForSigning,
  signDocument,
  clearDocumentErrors,
  clearDocumentSuccess,
} from "../redux/slices/documentsSlice";
import {
  FiFileText,
  FiEdit,
  FiType,
  FiCalendar,
  FiCheck,
  FiAlertCircle,
  FiXCircle,
  FiCheckCircle,
} from "react-icons/fi";

const SigningPage = () => {
  const { documentId, token, email } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedDocument, loading, error, success } = useSelector(
    (state) => state.documents
  );

  const [recipientFields, setRecipientFields] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fieldValues, setFieldValues] = useState({});
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Fetch document details when component mounts
  useEffect(() => {
    dispatch(getDocumentForSigning({ documentId, token, email }));
  }, [dispatch, documentId, token, email]);

  // Extract fields for this recipient when document is loaded
  useEffect(() => {
    if (selectedDocument) {
      const recipient = selectedDocument.recipients?.find(
        (r) => r.email === email
      );

      if (recipient) {
        // If already signed, show completed state
        if (recipient.signed) {
          setIsComplete(true);
        } else {
          // Initialize field values
          const initialValues = {};
          selectedDocument.fields?.forEach((field) => {
            initialValues[field._id] = "";
          });
          setFieldValues(initialValues);
        }
      }
    }
  }, [selectedDocument, email]);

  // Simulated function to handle document viewer load
  const handleDocumentLoad = () => {
    setCanvasSize({ width: 850, height: 1100 });
    setDocumentLoaded(true);
  };

  // Simulate document loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDocumentLoad();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Clear notifications after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setIsComplete(true);
        dispatch(clearDocumentSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearDocumentErrors());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  const handleFieldChange = (fieldId, value) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSignDocument = () => {
    setIsSigning(true);

    // Validate all required fields are filled
    const allFieldsFilled = selectedDocument.fields.every(
      (field) => !field.required || fieldValues[field._id]
    );

    if (!allFieldsFilled) {
      alert("Please fill out all required fields before signing");
      setIsSigning(false);
      return;
    }

    // Transform field values into expected format
    const signedFieldValues = selectedDocument.fields.map((field) => ({
      fieldId: field._id,
      value: fieldValues[field._id],
    }));

    // Submit signature
    dispatch(
      signDocument({
        id: documentId,
        email,
        fieldValues: signedFieldValues,
      })
    )
      .then(() => {
        setIsSigning(false);
        setCompleteModalOpen(true);
      })
      .catch(() => {
        setIsSigning(false);
      });
  };

  const getFieldIcon = (type) => {
    switch (type) {
      case "signature":
        return <FiEdit />;
      case "initials":
        return <FiType />;
      case "text":
        return <FiType />;
      case "date":
        return <FiCalendar />;
      default:
        return null;
    }
  };

  const getFieldInput = (field) => {
    switch (field.type) {
      case "signature":
        return (
          <div>
            <label className="block text-xs text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Type your full name"
              value={fieldValues[field._id] || ""}
              onChange={(e) => handleFieldChange(field._id, e.target.value)}
              disabled={isComplete}
            />
          </div>
        );
      case "initials":
        return (
          <div>
            <label className="block text-xs text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Type your initials"
              value={fieldValues[field._id] || ""}
              onChange={(e) => handleFieldChange(field._id, e.target.value)}
              disabled={isComplete}
            />
          </div>
        );
      case "text":
        return (
          <div>
            <label className="block text-xs text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Enter text"
              value={fieldValues[field._id] || ""}
              onChange={(e) => handleFieldChange(field._id, e.target.value)}
              disabled={isComplete}
            />
          </div>
        );
      case "date":
        return (
          <div>
            <label className="block text-xs text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md p-2"
              value={fieldValues[field._id] || ""}
              onChange={(e) => handleFieldChange(field._id, e.target.value)}
              disabled={isComplete}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading && !selectedDocument) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!selectedDocument) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center text-red-500 mb-4">
            <FiAlertCircle className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-bold">Document Not Found</h2>
          </div>
          <p className="text-gray-600 mb-4">
            The document you are trying to sign could not be found. It may have
            been removed or the link is invalid.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="btn-primary w-full"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isComplete
              ? "Document Signed Successfully"
              : `Sign Document: ${selectedDocument.title}`}
          </h1>

          {isComplete ? (
            <div className="flex items-center text-green-600">
              <FiCheckCircle className="h-5 w-5 mr-2" />
              <p>You have successfully signed this document.</p>
            </div>
          ) : (
            <p className="text-gray-600">
              Please review the document and complete all signature fields.
            </p>
          )}
        </div>

        {/* Success and Error Messages */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Document Viewer */}
          <div className="w-full md:w-2/3 bg-white rounded-lg shadow-md overflow-hidden">
            {!documentLoaded ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <div className="p-4">
                <div className="p-4 bg-gray-100 mb-4 rounded text-center">
                  <p className="text-gray-500">
                    Page {currentPage} of {1}
                  </p>
                </div>

                {/* Document Display (Simulated) */}
                <div
                  className="border border-gray-300 rounded relative bg-white mx-auto"
                  style={{
                    width: canvasSize.width,
                    height: canvasSize.height,
                    maxWidth: "100%",
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>Document preview placeholder</p>
                  </div>

                  {/* Render field markers */}
                  {selectedDocument.fields?.map((field) => {
                    if (field.page === currentPage) {
                      return (
                        <div
                          key={field._id}
                          className={`absolute border-2 rounded flex items-center justify-center ${
                            isComplete
                              ? "border-green-500 bg-green-50 bg-opacity-30"
                              : "border-primary-500 bg-primary-50 bg-opacity-30"
                          }`}
                          style={{
                            left: `${field.x}%`,
                            top: `${field.y}%`,
                            width: "150px",
                            height: "50px",
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          {isComplete ? (
                            <div className="bg-white px-2 py-1 rounded text-xs border border-green-500 text-green-700">
                              {fieldValues[field._id] ||
                                field.value ||
                                "Signed"}
                            </div>
                          ) : (
                            <div className="bg-white px-2 py-1 rounded text-xs border border-primary-500 text-primary-700">
                              {getFieldIcon(field.type)} {field.label}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Signature Fields Panel */}
          <div className="w-full md:w-1/3 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">
                {isComplete ? "Completed Fields" : "Signature Fields"}
              </h2>
            </div>

            <div className="p-4">
              {selectedDocument.fields?.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No signature fields found for this document.
                </p>
              ) : (
                <div className="space-y-6">
                  {selectedDocument.fields?.map((field) => (
                    <div
                      key={field._id}
                      className="p-3 border border-gray-200 rounded-md"
                    >
                      <div className="flex items-center mb-2">
                        {getFieldIcon(field.type)}
                        <span className="ml-2 font-medium">{field.label}</span>
                        {isComplete && (
                          <span className="ml-auto text-green-600">
                            <FiCheck />
                          </span>
                        )}
                      </div>
                      {getFieldInput(field)}
                    </div>
                  ))}

                  {!isComplete && (
                    <button
                      className="w-full btn-primary py-3 flex items-center justify-center"
                      onClick={handleSignDocument}
                      disabled={isSigning}
                    >
                      {isSigning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FiEdit className="mr-2" />
                          Sign Document
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {completeModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiCheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Document Signed Successfully
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Thank you for signing the document. The document owner
                        will be notified of your signature.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary w-full sm:w-auto"
                  onClick={() => (window.location.href = "/")}
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

export default SigningPage;
