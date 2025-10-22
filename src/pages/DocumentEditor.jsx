import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getDocument,
  addFields,
  sendDocument,
  clearDocumentErrors,
  clearDocumentSuccess,
} from "../redux/slices/documentsSlice";
import {
  FiPlus,
  FiSend,
  FiSave,
  FiTrash2,
  FiUser,
  FiMail,
  FiType,
  FiEdit,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiFile,
} from "react-icons/fi";
import { Viewer, Worker, ScrollMode } from "@react-pdf-viewer/core";
import { toolbarPlugin } from "@react-pdf-viewer/toolbar";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/toolbar/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";

// Add custom styling for the PDF viewer
import "./DocumentEditor.css";

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedDocument, loading, error, success } = useSelector(
    (state) => state.documents
  );

  // Default dimensions for different field types
  const defaultDimensions = {
    signature: { width: 100, height: 25 },
    initials: { width: 50, height: 15 },
    text: { width: 75, height: 15 },
    date: { width: 60, height: 15 },
    checkbox: { width: 10, height: 10 },
  };

  const [fields, setFields] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFieldType, setSelectedFieldType] = useState("");
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [newRecipient, setNewRecipient] = useState({ email: "" });
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragField, setDragField] = useState(null);
  const containerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [debugInfo, setDebugInfo] = useState(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialFieldSize, setInitialFieldSize] = useState({
    width: 0,
    height: 0,
  });

  // Create minimal plugins for PDF viewer with only basic functionality
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  // Fetch document details when component mounts
  useEffect(() => {
    dispatch(getDocument(id));
  }, [dispatch, id]);

  // Initialize fields when document is loaded
  useEffect(() => {
    if (selectedDocument) {
      setFields(selectedDocument.fields || []);
      setRecipients(selectedDocument.recipients || []);
    }
  }, [selectedDocument]);

  // Set documentLoaded to true when component mounts to avoid spinner being stuck
  useEffect(() => {
    if (selectedDocument?.fileUrl) {
      // Allow a small delay for the component to initialize
      const timer = setTimeout(() => {
        setDocumentLoaded(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedDocument]);

  // Update the scroll event listener to track scroll position
  useEffect(() => {
    // This effect is now intentionally empty as we use the continuous rendering approach
    // to handle field positioning updates regardless of scrolling.
  }, [containerRef.current, documentLoaded, currentPage]);

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

  // Clear debug info after a few seconds
  useEffect(() => {
    if (debugInfo) {
      const timer = setTimeout(() => {
        setDebugInfo(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [debugInfo]);

  // Handle PDF document load
  const handleDocumentLoad = (doc) => {
    console.log("Document loaded with", doc);
    // The document object structure from the PDF viewer is different than expected
    if (doc && typeof doc.numPages === "number") {
      console.log("Setting total pages to:", doc.numPages);
      setTotalPages(doc.numPages);
    } else if (doc && doc.doc && typeof doc.doc.numPages === "number") {
      console.log("Setting total pages to:", doc.doc.numPages);
      setTotalPages(doc.doc.numPages);
    } else {
      console.log("Could not determine page count, using default");
      // Try to get the page count from the viewer element after it renders
      setTimeout(() => {
        const pdfContainer = document.querySelector(".rpv-core__viewer");
        if (pdfContainer) {
          // Count the number of page divs within the viewer
          const pageCount = pdfContainer.querySelectorAll(
            ".rpv-core__page-layer"
          ).length;
          console.log("Found pages by DOM inspection:", pageCount);
          if (pageCount > 0) {
            setTotalPages(pageCount);
          }
        }
      }, 2000);
    }

    setCanvasSize({ width: 850, height: 1100 });
    setDocumentLoaded(true);
    setCurrentPage(1); // Reset to first page when document loads
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber === currentPage) return; // Don't do anything if we're already on this page

    console.log("Changing to page", pageNumber);
    setCurrentPage(pageNumber);

    try {
      if (jumpToPage) {
        // PDF page index is zero-based (page 1 = index 0)
        jumpToPage(pageNumber - 1);
      } else {
        // Fall back to using the viewer DOM API if jumpToPage is not available
        const pdfContainer = document.querySelector(".rpv-core__viewer");
        if (pdfContainer) {
          const pageElements = pdfContainer.querySelectorAll(
            ".rpv-core__page-layer"
          );
          if (pageElements.length >= pageNumber) {
            const targetPage = pageElements[pageNumber - 1];
            if (targetPage) {
              targetPage.scrollIntoView({ behavior: "smooth" });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error jumping to page:", error);
    }
  };

  // Handle field placement
  const handleFieldPlacement = (e) => {
    if (!selectedFieldType) {
      console.log("No field type selected");
      return;
    }

    const container = containerRef.current;
    if (!container) {
      console.log("No container found");
      return;
    }

    // Get the PDF page element
    const pageElement = container.querySelector(".rpv-core__page-layer");
    if (!pageElement) {
      console.log("No page element found");
      return;
    }

    const pageRect = pageElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    console.log("Page dimensions:", {
      pageRect,
      containerRect,
      clickPosition: { clientX: e.clientX, clientY: e.clientY },
    });

    // Calculate the offset of the page from the container
    const pageOffsetX = (containerRect.width - pageRect.width) / 2;
    const pageOffsetY = (containerRect.height - pageRect.height) / 2;

    // Calculate position relative to the page, accounting for the offset
    let x =
      ((e.clientX - (containerRect.left + pageOffsetX)) / pageRect.width) * 100;
    let y =
      ((e.clientY - (containerRect.top + pageOffsetY)) / pageRect.height) * 100;

    console.log("Calculated positions:", {
      pageOffset: { x: pageOffsetX, y: pageOffsetY },
      relativePosition: { x, y },
    });

    // Get field dimensions
    const fieldWidth = defaultDimensions[selectedFieldType].width;
    const fieldHeight = defaultDimensions[selectedFieldType].height;

    // Convert field dimensions to percentages
    const fieldWidthPercent = (fieldWidth / pageRect.width) * 100;
    const fieldHeightPercent = (fieldHeight / pageRect.height) * 100;

    // Ensure the field stays within the PDF page boundaries
    x = Math.max(0, Math.min(x, 100 - fieldWidthPercent));
    y = Math.max(0, Math.min(y, 100 - fieldHeightPercent));

    console.log("Final field position:", {
      x,
      y,
      width: fieldWidthPercent,
      height: fieldHeightPercent,
    });

    // Create and add the new field
    const newField = {
      type: selectedFieldType,
      x,
      y,
      page: currentPage,
      width: fieldWidth,
      height: fieldHeight,
      label: `${
        selectedFieldType.charAt(0).toUpperCase() + selectedFieldType.slice(1)
      } ${fields.length + 1}`,
      required: true,
    };

    console.log("Adding new field:", newField);
    setFields((prev) => [...prev, newField]);
    setSelectedFieldType("");
  };

  // Handle field removal
  const handleRemoveField = (fieldId) => {
    setFields((prev) => prev.filter((field) => field._id !== fieldId));
  };

  // Handle field update
  const handleUpdateField = (fieldId, updates) => {
    setFields((prev) =>
      prev.map((field) =>
        field._id === fieldId ? { ...field, ...updates } : field
      )
    );
  };

  // Handle recipient addition
  const handleAddRecipient = () => {
    if (!newRecipient.email) return;

    const existingRecipientIndex = recipients.findIndex(
      (r) => r.email === newRecipient.email
    );

    if (existingRecipientIndex >= 0) {
      // Update existing recipient
      setRecipients((prev) =>
        prev.map((r, i) =>
          i === existingRecipientIndex ? { ...r, email: newRecipient.email } : r
        )
      );
    } else {
      // Add new recipient
      setRecipients((prev) => [...prev, { ...newRecipient, signed: false }]);
    }

    setNewRecipient({ email: "" });
    setShowAddRecipientModal(false);
  };

  // Handle recipient removal
  const handleRemoveRecipient = (index) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle saving fields
  const handleSaveFields = () => {
    dispatch(addFields({ id, fields }));
  };

  // Handle sending document
  const handleSendDocument = () => {
    if (recipients.length === 0) {
      alert("Please add at least one recipient before sending.");
      return;
    }

    dispatch(sendDocument(id));
    setSendModalOpen(false);
  };

  // Render field markers directly on the PDF pages
  const renderFieldMarkers = useCallback(() => {
    if (!containerRef.current) return null;

    // Get the PDF page element
    const pageElement = containerRef.current.querySelector(
      ".rpv-core__page-layer"
    );
    if (!pageElement) return null;

    const pageRect = pageElement.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate the offset of the page from the container
    const pageOffsetX = (containerRect.width - pageRect.width) / 2;
    const pageOffsetY = (containerRect.height - pageRect.height) / 2;

    // Filter fields for current page
    const currentPageFields = fields.filter(
      (field) => field.page === currentPage
    );

    return currentPageFields.map((field, index) => {
      // Convert percentage coordinates to pixels
      const left = (field.x / 100) * pageRect.width + pageOffsetX;
      const top = (field.y / 100) * pageRect.height + pageOffsetY;

      return (
        <div
          key={`field-${index}`}
          className="absolute"
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${field.width}px`,
            height: `${field.height}px`,
            zIndex: 20,
          }}
        >
          {/* Field type label */}
          <div className="absolute -top-6 left-0 bg-white px-2 py-1 rounded text-xs shadow">
            {field.type} ({field.label})
          </div>

          {/* Field dimensions display */}
          <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
            {Math.round(field.width)}px × {Math.round(field.height)}px
          </div>

          {/* Main field area */}
          <div
            className={`border-2 border-dashed ${
              field.required ? "border-red-500" : "border-blue-500"
            } bg-white bg-opacity-50 cursor-move w-full h-full`}
            onMouseDown={(e) => {
              // Only handle drag if clicking the main field area
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                handleDragStart(e, field);
              }
            }}
            title={`${field.type} field`}
          >
            {/* Resize handle */}
            <div
              className="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
              onMouseDown={(e) => {
                console.log("Resize handle clicked");
                e.preventDefault();
                e.stopPropagation();
                handleResizeStart(e, field);
              }}
              style={{ zIndex: 30 }}
            />
          </div>
        </div>
      );
    });
  }, [fields, currentPage, isDragging]);

  // Handle drag start
  const handleDragStart = (e, field) => {
    console.log("Drag Start:", {
      field,
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target,
    });
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    const pageElement = container.querySelector(".rpv-core__page-layer");
    if (!pageElement) return;

    const pageRect = pageElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Calculate the offset of the page from the container
    const pageOffsetX = (containerRect.width - pageRect.width) / 2;
    const pageOffsetY = (containerRect.height - pageRect.height) / 2;

    // Calculate initial mouse position relative to the page
    const initialX = e.clientX - (containerRect.left + pageOffsetX);
    const initialY = e.clientY - (containerRect.top + pageOffsetY);

    // Store the initial field position in pixels
    const fieldX = (field.x / 100) * pageRect.width;
    const fieldY = (field.y / 100) * pageRect.height;

    // Store the initial positions
    setInitialMousePos({ x: initialX, y: initialY });
    setInitialFieldSize({ width: fieldX, height: fieldY });
    setIsDragging(true);
    setDragField({ field, isResizing: false });
  };

  // Handle resize start
  const handleResizeStart = (e, field) => {
    console.log("Resize Start:", {
      field,
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target,
    });
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    const pageElement = container.querySelector(".rpv-core__page-layer");
    if (!pageElement) return;

    const pageRect = pageElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Calculate the offset of the page from the container
    const pageOffsetX = (containerRect.width - pageRect.width) / 2;
    const pageOffsetY = (containerRect.height - pageRect.height) / 2;

    // Calculate initial mouse position relative to the page
    const initialX = e.clientX - (containerRect.left + pageOffsetX);
    const initialY = e.clientY - (containerRect.top + pageOffsetY);

    setInitialMousePos({ x: initialX, y: initialY });
    setInitialFieldSize({ width: field.width, height: field.height });
    setIsDragging(true);
    setDragField({ field, isResizing: true });
  };

  // Handle drag
  const handleDrag = (e) => {
    if (!isDragging || !dragField) {
      console.log("Drag cancelled - no drag state:", { isDragging, dragField });
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) {
      console.log("No container found");
      return;
    }

    const pageElement = container.querySelector(".rpv-core__page-layer");
    if (!pageElement) {
      console.log("No page element found");
      return;
    }

    const pageRect = pageElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Calculate the offset of the page from the container
    const pageOffsetX = (containerRect.width - pageRect.width) / 2;
    const pageOffsetY = (containerRect.height - pageRect.height) / 2;

    // Calculate mouse position relative to the page
    const mouseX = e.clientX - (containerRect.left + pageOffsetX);
    const mouseY = e.clientY - (containerRect.top + pageOffsetY);

    console.log("Drag Update:", {
      mouseX,
      mouseY,
      pageRect,
      containerRect,
      pageOffsetX,
      pageOffsetY,
      isResizing: dragField.isResizing,
      initialMousePos,
      initialFieldSize,
    });

    setFields((prev) =>
      prev.map((f) => {
        if (f === dragField.field) {
          if (dragField.isResizing) {
            // Calculate the change in mouse position
            const deltaX = mouseX - initialMousePos.x;
            const deltaY = mouseY - initialMousePos.y;

            // Calculate new dimensions based on the change
            const newWidth = Math.max(
              defaultDimensions[f.type].width,
              initialFieldSize.width + deltaX
            );
            const newHeight = Math.max(
              defaultDimensions[f.type].height,
              initialFieldSize.height + deltaY
            );

            // Ensure the field doesn't extend beyond the page
            const currentLeft = (f.x / 100) * pageRect.width;
            const currentTop = (f.y / 100) * pageRect.height;
            const maxWidth = pageRect.width - currentLeft;
            const maxHeight = pageRect.height - currentTop;

            console.log("Resize Calculations:", {
              newWidth,
              newHeight,
              maxWidth,
              maxHeight,
              deltaX,
              deltaY,
              initialWidth: initialFieldSize.width,
              initialHeight: initialFieldSize.height,
            });

            return {
              ...f,
              width: Math.min(newWidth, maxWidth),
              height: Math.min(newHeight, maxHeight),
            };
          } else {
            // Calculate the change in mouse position from the initial position
            const deltaX = mouseX - initialMousePos.x;
            const deltaY = mouseY - initialMousePos.y;

            // Calculate new position in pixels
            const newX = initialFieldSize.width + deltaX;
            const newY = initialFieldSize.height + deltaY;

            // Convert to percentages
            const newXPercent = (newX / pageRect.width) * 100;
            const newYPercent = (newY / pageRect.height) * 100;

            // Convert field dimensions to percentages
            const fieldWidthPercent = (f.width / pageRect.width) * 100;
            const fieldHeightPercent = (f.height / pageRect.height) * 100;

            console.log("Drag Calculations:", {
              newX,
              newY,
              newXPercent,
              newYPercent,
              fieldWidthPercent,
              fieldHeightPercent,
              deltaX,
              deltaY,
              initialX: initialMousePos.x,
              initialY: initialMousePos.y,
            });

            return {
              ...f,
              x: Math.max(0, Math.min(newXPercent, 100 - fieldWidthPercent)),
              y: Math.max(0, Math.min(newYPercent, 100 - fieldHeightPercent)),
            };
          }
        }
        return f;
      })
    );
  };

  // Handle drag end
  const handleDragEnd = () => {
    console.log("Drag End");
    setIsDragging(false);
    setDragField(null);
    setInitialMousePos({ x: 0, y: 0 });
    setInitialFieldSize({ width: 0, height: 0 });
  };

  // Add event listeners for drag and resize
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (isDragging && dragField) {
        handleDrag(e);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    console.log("Adding event listeners");
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      console.log("Removing event listeners");
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragField]);

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

  // Generate page navigation list
  const renderPagesList = () => {
    console.log("Rendering pages list. Total pages:", totalPages);
    if (totalPages <= 0) {
      return (
        <div className="p-3 text-gray-500 text-center">No pages available</div>
      );
    }

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-full py-2 px-3 text-left border-b border-gray-200 flex items-center ${
            currentPage === i
              ? "bg-primary-50 text-primary-600"
              : "hover:bg-gray-50"
          }`}
        >
          <FiFile className="mr-2" />
          Page {i}
        </button>
      );
    }
    return pages;
  };

  // Modified approach for field position updates - simpler now that we only have one page at a time
  useEffect(() => {
    if (!documentLoaded || !containerRef.current) return;

    // Update field positions when the page changes or fields are updated
    const updatePositions = () => {
      // Update scroll position to trigger a re-render
      setScrollPosition(Date.now());

      // Find the page element
      const pageElement = findPageElement();
      if (pageElement) {
        // Update any field markers on the page
        fields.forEach((field, index) => {
          if (field.page === currentPage) {
            const fieldId = `field-${index}`;
            const fieldElement = document.getElementById(fieldId);
            if (!fieldElement) {
              // Create field marker if it doesn't exist
              const marker = document.createElement("div");
              marker.id = fieldId;
              marker.style.position = "absolute";
              marker.style.width = "1px";
              marker.style.height = "1px";
              marker.style.opacity = "0";
              marker.style.pointerEvents = "none";
              marker.style.left = `${field.x}%`;
              marker.style.top = `${field.y}%`;
              marker.dataset.fieldIndex = index;
              marker.dataset.fieldType = field.type;
              marker.dataset.fieldPage = field.page;
              pageElement.appendChild(marker);
            }
          }
        });
      }
    };

    // Update positions immediately
    updatePositions();

    // Set up a small delay to ensure the PDF is fully rendered
    const timeoutId = setTimeout(updatePositions, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fields, currentPage, documentLoaded]);

  // Also update when page is changed via navigation
  useEffect(() => {
    // When currentPage changes, we need to update the field positions
    if (documentLoaded) {
      setScrollPosition(Date.now());
    }
  }, [currentPage, documentLoaded]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cancel field selection on ESC key
      if (e.key === "Escape" && selectedFieldType) {
        console.log("ESC pressed, canceling field placement");
        setSelectedFieldType("");
        setDebugInfo({
          message: "Field placement canceled with ESC key",
          time: new Date().toISOString(),
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFieldType]);

  // Function to find the page element using various selectors
  const findPageElement = () => {
    if (!containerRef.current) return null;

    // First try to get the current page by data attribute
    let pageElement = document.querySelector(
      `.rpv-core__page[data-page-number="${currentPage - 1}"]`
    );

    if (pageElement) return pageElement;

    // Try to find by page number with different selector patterns
    const pageNumberSelectors = [
      `[data-page-number="${currentPage - 1}"]`,
      `[data-page-index="${currentPage - 1}"]`,
      `.rpv-core__page-layer[data-page-number="${currentPage - 1}"]`,
      `.react-pdf__Page[data-page-number="${currentPage - 1}"]`,
    ];

    for (const selector of pageNumberSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }

    // Try to find the visible page by checking which page is in the viewport
    const containerRect = containerRef.current.getBoundingClientRect();
    const viewportCenterX = containerRect.left + containerRect.width / 2;
    const viewportCenterY = containerRect.top + containerRect.height / 2;

    // Get all page elements
    const allPages = [
      ...document.querySelectorAll(".rpv-core__page"),
      ...document.querySelectorAll(".rpv-core__page-layer"),
      ...document.querySelectorAll(".react-pdf__Page"),
    ];

    if (allPages.length > 0) {
      // First priority: find a page that contains the center of the viewport
      for (const page of allPages) {
        const pageRect = page.getBoundingClientRect();

        if (
          viewportCenterX >= pageRect.left &&
          viewportCenterX <= pageRect.right &&
          viewportCenterY >= pageRect.top &&
          viewportCenterY <= pageRect.bottom
        ) {
          return page;
        }
      }

      // Second priority: find the page with the most visible area
      let mostVisiblePage = null;
      let maxVisibleArea = 0;

      allPages.forEach((page) => {
        const pageRect = page.getBoundingClientRect();

        // Calculate the intersection with the container
        const xOverlap = Math.max(
          0,
          Math.min(pageRect.right, containerRect.right) -
            Math.max(pageRect.left, containerRect.left)
        );

        const yOverlap = Math.max(
          0,
          Math.min(pageRect.bottom, containerRect.bottom) -
            Math.max(pageRect.top, containerRect.top)
        );

        const overlapArea = xOverlap * yOverlap;

        if (overlapArea > maxVisibleArea) {
          maxVisibleArea = overlapArea;
          mostVisiblePage = page;
        }
      });

      if (mostVisiblePage) {
        return mostVisiblePage;
      }
    }

    // If we still can't find the page, try general selectors
    const generalSelectors = [
      ".rpv-core__page",
      ".rpv-core__page-layer",
      ".rpv-core__canvas-layer",
      ".rpv-core__annotation-layer",
      ".rpv-core__text-layer",
      ".react-pdf__Page",
      ".rpv-core__viewer canvas",
      "canvas",
    ];

    for (const selector of generalSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }

    // If all else fails, use the container
    return containerRef.current;
  };

  // Update the clickable overlay
  const renderClickableOverlay = () => {
    if (!selectedFieldType) {
      console.log("No overlay rendered - missing field type");
      return null;
    }

    console.log("Rendering clickable overlay for:", {
      fieldType: selectedFieldType,
    });

    return (
      <div
        className="fixed inset-0"
        style={{
          cursor: "crosshair",
          zIndex: 1000,
          backgroundColor: "rgba(66, 153, 225, 0.1)",
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => {
          console.log("Mouse down on overlay");
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          console.log("Mouse up on overlay");
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          console.log("Click on overlay");
          e.preventDefault();
          e.stopPropagation();
          handleFieldPlacement(e);
        }}
      >
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary-500 text-white text-center py-1 text-sm">
          Click on the document to place a {selectedFieldType} field (press ESC
          to cancel)
        </div>
      </div>
    );
  };

  // Add a debug button to test field placement
  const renderDebugButton = () => {
    if (!selectedFieldType) return null;

    return (
      <button
        className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
        onClick={() => {
          console.log("Debug button clicked");
          const mockEvent = {
            clientX: 500,
            clientY: 500,
            preventDefault: () => {},
            stopPropagation: () => {},
          };
          handleFieldPlacement(mockEvent);
        }}
      >
        Debug: Add Field
      </button>
    );
  };

  // Update the field type selection buttons
  const renderFieldTypeButtons = () => (
    <div className="mt-2 flex flex-wrap gap-2">
      <button
        className={`px-2 py-1 text-xs rounded-full ${
          selectedFieldType === "signature"
            ? "bg-primary-100 text-primary-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => setSelectedFieldType("signature")}
        title="Signature"
      >
        <FiEdit className="inline mr-1" /> Signature
      </button>
      <button
        className={`px-2 py-1 text-xs rounded-full ${
          selectedFieldType === "initials"
            ? "bg-primary-100 text-primary-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => setSelectedFieldType("initials")}
        title="Initials"
      >
        <FiType className="inline mr-1" /> Initials
      </button>
      <button
        className={`px-2 py-1 text-xs rounded-full ${
          selectedFieldType === "text"
            ? "bg-primary-100 text-primary-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => setSelectedFieldType("text")}
        title="Text"
      >
        <FiType className="inline mr-1" /> Text
      </button>
      <button
        className={`px-2 py-1 text-xs rounded-full ${
          selectedFieldType === "date"
            ? "bg-primary-100 text-primary-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => setSelectedFieldType("date")}
        title="Date"
      >
        <FiCalendar className="inline mr-1" /> Date
      </button>
    </div>
  );

  // Update page dimensions when page changes
  useEffect(() => {
    const updatePageDimensions = () => {
      const container = containerRef.current;
      if (!container) return;

      // Find the PDF page element
      const pageElement = container.querySelector(".rpv-core__page-layer");
      if (!pageElement) return;

      const pageRect = pageElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Calculate the page dimensions relative to the container
      const width = (pageRect.width / containerRect.width) * 100;
      const height = (pageRect.height / containerRect.height) * 100;

      setPageDimensions({ width, height });
    };

    // Update dimensions when page changes
    updatePageDimensions();

    // Add resize observer to update dimensions when container size changes
    const resizeObserver = new ResizeObserver(updatePageDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [currentPage]);

  if (loading && !selectedDocument) {
    return (
      <div className="page-container flex justify-center">
        <div class="loading-spinner"></div>
      </div>
    );
  }

  if (!selectedDocument) {
    return (
      <div className="page-container">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Document not found</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 p-4">
        <h1>{selectedDocument.title}</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleSaveFields}
            className="btn-primary"
            disabled={fields.length === 0}
          >
            <FiSave className="mr-2" />
            Save Fields
          </button>
          {selectedDocument.status === "draft" && (
            <button
              onClick={() => setSendModalOpen(true)}
              className="btn-primary"
              disabled={recipients.length === 0}
            >
              <FiSend className="mr-2" />
              Send Document
            </button>
          )}
        </div>
      </div>

      {/* Success and Error Messages */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-2 mb-2 mx-4">
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
        <div className="bg-red-50 border-l-4 border-red-500 p-2 mb-2 mx-4">
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

      <div
        className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 px-4 pb-4"
        style={{ height: "calc(100vh - 150px)" }}
      >
        {/* Left sidebar - Field Types and Recipients */}
        <div className="w-full lg:w-1/4">
          {/* Field Types Panel */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-4">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">Field Types</h2>
            </div>
            <div className="p-4">{renderFieldTypeButtons()}</div>
          </div>

          {/* Recipients Panel */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">Recipients</h2>
            </div>
            <div className="p-4">
              {recipients.length === 0 ? (
                <p className="text-gray-500 text-sm mb-4">
                  No recipients added yet. Add recipients to send the document
                  for signature.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {recipients.map((recipient, index) => (
                    <li key={index} className="py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{recipient.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveRecipient(index)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove recipient"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {selectedDocument?.status === "draft" && (
                <button
                  onClick={() => setShowAddRecipientModal(true)}
                  className="mt-4 w-full flex items-center justify-center btn-primary"
                >
                  <FiPlus className="mr-2" />
                  Add Recipient
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main content - Document viewer */}
        <div
          className="w-full lg:w-3/4 bg-white shadow rounded-lg overflow-hidden"
          style={{ height: "calc(100vh - 150px)" }}
        >
          {!documentLoaded ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-2 bg-gray-100">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 bg-white rounded border border-gray-300 disabled:opacity-50"
                >
                  <FiChevronLeft />
                </button>
                <div className="text-gray-700 font-medium">
                  Page {currentPage} of {totalPages > 0 ? totalPages : "..."}
                </div>
                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 bg-white rounded border border-gray-300 disabled:opacity-50"
                >
                  <FiChevronRight />
                </button>
              </div>

              {/* Document Viewer */}
              <div
                ref={containerRef}
                className="border border-gray-300 rounded bg-white flex-1 m-2"
                style={{
                  height: "100%",
                  cursor: selectedFieldType ? "crosshair" : "default",
                  position: "relative",
                }}
                onClick={(e) => {
                  // Debug click info
                  if (selectedFieldType) {
                    setDebugInfo({
                      message: "Container clicked",
                      x: e.clientX,
                      y: e.clientY,
                      time: new Date().toISOString(),
                    });
                  }
                }}
              >
                {/* Add debug display */}
                {debugInfo && (
                  <div
                    className="absolute top-0 left-0 bg-black bg-opacity-75 text-white p-2 text-xs z-50"
                    style={{ maxWidth: "300px" }}
                  >
                    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                  </div>
                )}

                {selectedDocument?.fileUrl ? (
                  <div
                    className="pdf-container"
                    style={{
                      height: "100%",
                      width: "100%",
                      backgroundColor: "#f5f5f5",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      overflow: "hidden",
                      position: "relative",
                    }}
                    onWheel={(e) => {
                      // Prevent wheel events from causing scrolling
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                  >
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                      <Viewer
                        fileUrl={selectedDocument.fileUrl}
                        plugins={[pageNavigationPluginInstance]}
                        onDocumentLoad={handleDocumentLoad}
                        defaultScale={0.9}
                        initialPage={currentPage - 1}
                        scrollMode={ScrollMode.Page}
                        pageLayout="SinglePage"
                        renderMode="canvas"
                        onPageChange={(e) => {
                          // e.currentPage is zero-based, so add 1
                          const newPage = e.currentPage + 1;
                          console.log("Page changed to", newPage);
                          if (newPage !== currentPage) {
                            setCurrentPage(newPage);
                          }
                        }}
                        renderLoader={(percentages) => (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-2"></div>
                              <p className="text-gray-600">
                                Loading document... {Math.round(percentages)}%
                              </p>
                            </div>
                          </div>
                        )}
                        viewerRef={(ref) => {
                          if (ref) {
                            // Directly manipulate viewer to disable scrolling
                            const viewerElem = ref.viewer;
                            if (viewerElem) {
                              viewerElem.style.overflow = "hidden";
                              // Disable scroll event listeners
                              viewerElem.addEventListener(
                                "scroll",
                                (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return false;
                                },
                                { passive: false }
                              );
                            }
                          }
                        }}
                      />
                    </Worker>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>Document preview placeholder</p>
                  </div>
                )}

                {/* Clickable overlay for field placement */}
                {selectedFieldType && renderClickableOverlay()}
                {selectedFieldType && renderDebugButton()}

                {/* Field Markers Container */}
                <div
                  className="absolute inset-0"
                  style={{
                    pointerEvents: isDragging ? "none" : "auto",
                    zIndex: 30,
                  }}
                >
                  {renderFieldMarkers()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Recipient Modal */}
      {showAddRecipientModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowAddRecipientModal(false)}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiUser className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Add Recipient
                    </h3>
                    <div className="mt-4">
                      <label htmlFor="email" className="form-label">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          className="form-input pl-10"
                          placeholder="recipient@example.com"
                          value={newRecipient.email}
                          onChange={(e) =>
                            setNewRecipient({
                              ...newRecipient,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary w-full sm:w-auto sm:ml-3"
                  onClick={handleAddRecipient}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="btn-outline mt-3 sm:mt-0 w-full sm:w-auto"
                  onClick={() => setShowAddRecipientModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Document Modal */}
      {sendModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={() => setSendModalOpen(false)}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiSend className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Send Document for Signature
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {recipients.length === 0
                          ? "Please add at least one recipient before sending."
                          : `This document will be sent to ${
                              recipients.length
                            } recipient${
                              recipients.length > 1 ? "s" : ""
                            } for signature. All recipients will receive an email notification with a link to sign the document.`}
                      </p>
                      {recipients.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {recipients.map((recipient, index) => (
                            <li
                              key={index}
                              className="text-sm flex items-center"
                            >
                              <FiMail className="mr-2 text-gray-400" />
                              {recipient.email}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary w-full sm:w-auto sm:ml-3"
                  onClick={handleSendDocument}
                  disabled={recipients.length === 0}
                >
                  Send
                </button>
                <button
                  type="button"
                  className="btn-outline mt-3 sm:mt-0 w-full sm:w-auto"
                  onClick={() => setSendModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;
