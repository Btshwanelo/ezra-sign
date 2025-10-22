// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  // DOM elements
  const documentViewer = document.querySelector(".document-viewer");
  const fieldsLayer = document.getElementById("fieldsLayer");
  const fieldTypeButtons = document.querySelectorAll(".field-type-button");
  const saveButton = document.getElementById("saveButton");
  const pageSelector = document.getElementById("pageSelector");

  // Check if all required DOM elements exist
  if (!documentViewer || !fieldsLayer || !saveButton) {
    console.error(
      "Required DOM elements not found. Please check your HTML structure."
    );
    throw new Error("Required DOM elements not found");
  }

  // State
  let currentPdf = null;
  let currentPage = null;
  let currentScale = 1.0;
  let fields = [];
  let activeField = null;
  let isDragging = false;
  let isResizing = false;
  let initialMousePos = { x: 0, y: 0 };
  let initialFieldPos = { x: 0, y: 0 };
  let initialFieldSize = { width: 0, height: 0 };
  let selectedFieldType = "signature"; // Default field type
  let currentPageNumber = 1; // Track current page number
  let documentUrl = null;
  let signers = []; // Initialize signers array
  let recipients = []; // Initialize recipients array

  // Add Intersection Observer for page visibility
  const observerOptions = {
    root: document.querySelector(".document-viewer"),
    rootMargin: "0px",
    threshold: 0.5, // Trigger when at least 50% of the page is visible
  };

  const pageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const pageContainer = entry.target;
        const pageIndex = Array.from(
          document.querySelectorAll(".page-container")
        ).indexOf(pageContainer);
        if (pageIndex !== -1) {
          currentPageNumber = pageIndex + 1;
          if (pageSelector) {
            pageSelector.value = currentPageNumber;
          }
        }
      }
    });
  }, observerOptions);

  // Add click handlers for field type buttons
  fieldTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove selected class from all buttons
      fieldTypeButtons.forEach((btn) => btn.classList.remove("selected"));
      // Add selected class to clicked button
      button.classList.add("selected");
      // Update selected field type
      selectedFieldType = button.dataset.fieldType;
      // Add the field
      addField();
    });
  });

  // Add save button click handler
  saveButton.addEventListener("click", async () => {
    try {
      await saveFields();
    } catch (error) {
      console.error("Error saving fields:", error);
      alert(`Error saving fields: ${error.message}`);
    }
  });

  // Add click handler for page containers
  document.addEventListener("click", (e) => {
    const pageContainer = e.target.closest(".page-container");
    if (pageContainer) {
      const pageIndex = Array.from(
        document.querySelectorAll(".page-container")
      ).indexOf(pageContainer);
      if (pageIndex !== -1) {
        currentPageNumber = pageIndex + 1;
        if (pageSelector) {
          pageSelector.value = currentPageNumber;
        }
      }
    }
  });

  // Get document ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get("id");
  const isTemplate = !!templateId;
  const documentId = isTemplate ? templateId : urlParams.get("id");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in to access this page");
    window.location.href = "/auth/login";
    return;
  }

  if (isTemplate) {
    // Load template document
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to load template");
      }
      const template = await response.json();
      documentUrl = template.data.fileUrl;
      await loadDocument();
    } catch (error) {
      console.error("Error loading template:", error);
      alert("Failed to load template: " + error.message);
    }
  } else {
    // Existing document loading logic
    if (documentId) {
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to load document");
        }
        const document = await response.json();
        documentUrl = document.data.fileUrl;
        await loadDocument();
      } catch (error) {
        console.error("Error loading document:", error);
        alert("Failed to load document: " + error.message);
      }
    }
  }

  // Add these variables at the top of the file
  let currentCheckboxField = null;
  let checkboxConfigModal = null;
  let totalCheckboxesInput = null;
  let requiredCheckboxesInput = null;

  // Add these variables at the top
  let recipientTypes = [
    { type: "signer", label: "Signer", order: 1 },
    { type: "viewer", label: "Viewer", order: 2 },
    { type: "approver", label: "Approver", order: 3 },
  ];

  // Add this function to get the authentication token
  function getToken() {
    return localStorage.getItem("token");
  }

  // Add this function to handle checkbox configuration
  function configureCheckboxGroup(field) {
    console.log("Configuring checkbox group for field:", field);
    currentCheckboxField = field;

    // Initialize modal elements if not already done
    if (!checkboxConfigModal) {
      checkboxConfigModal = document.getElementById("checkboxConfigModal");
      totalCheckboxesInput = document.getElementById("totalCheckboxes");
      requiredCheckboxesInput = document.getElementById("requiredCheckboxes");
    }

    if (
      !checkboxConfigModal ||
      !totalCheckboxesInput ||
      !requiredCheckboxesInput
    ) {
      console.error("Modal elements not found");
      return;
    }

    totalCheckboxesInput.value = field.checkboxGroup?.totalCheckboxes || 1;
    requiredCheckboxesInput.value =
      field.checkboxGroup?.requiredCheckboxes || 1;

    // Show the modal
    checkboxConfigModal.style.display = "flex";
    checkboxConfigModal.classList.add("show");
  }

  // Add this function to save checkbox configuration
  function saveCheckboxConfig() {
    if (!currentCheckboxField) return;

    const totalCheckboxes = parseInt(totalCheckboxesInput.value);
    const requiredCheckboxes = parseInt(requiredCheckboxesInput.value);

    if (
      isNaN(totalCheckboxes) ||
      isNaN(requiredCheckboxes) ||
      totalCheckboxes < 1 ||
      requiredCheckboxes < 0 ||
      requiredCheckboxes > totalCheckboxes
    ) {
      alert("Please enter valid numbers for checkboxes");
      return;
    }

    currentCheckboxField.checkboxGroup = {
      totalCheckboxes,
      requiredCheckboxes,
    };

    // Hide the modal
    checkboxConfigModal.style.display = "none";
    checkboxConfigModal.classList.remove("show");
    currentCheckboxField = null;
  }

  // Add this function to show recipient configuration modal
  function showRecipientConfigModal() {
    const modal = document.getElementById("recipientConfigModal");
    const recipientsList = document.getElementById("recipientsList");

    // Clear any existing recipients
    recipientsList.innerHTML = "";

    // Add one empty recipient input
    addRecipient();

    modal.style.display = "block";
    modal.classList.add("show");
  }

  // Add this function to add a new recipient
  function addRecipient() {
    const recipientsList = document.getElementById("recipientsList");
    const recipientDiv = document.createElement("div");
    recipientDiv.className = "recipient-item";
    recipientDiv.innerHTML = `
      <div class="form-group">
        <label>Type</label>
        <select class="recipient-type">
          <option value="signer">Signer</option>
          <option value="viewer">Viewer</option>
          <option value="approver">Approver</option>
        </select>
      </div>
      <div class="form-group signer-label-group">
        <label>Signer Label</label>
        <input type="text" class="signer-label" placeholder="e.g., Landlord, Student">
      </div>
      <button class="delete-recipient">×</button>
    `;
    recipientsList.appendChild(recipientDiv);

    // Add event listener for type change
    const typeSelect = recipientDiv.querySelector(".recipient-type");
    const signerLabelGroup = recipientDiv.querySelector(".signer-label-group");

    // Show/hide signer label based on initial type
    signerLabelGroup.style.display =
      typeSelect.value === "signer" ? "block" : "none";

    typeSelect.addEventListener("change", function () {
      signerLabelGroup.style.display =
        this.value === "signer" ? "block" : "none";
    });

    // Add event listener for delete button
    const deleteButton = recipientDiv.querySelector(".delete-recipient");
    deleteButton.addEventListener("click", function () {
      recipientDiv.remove();
    });
  }

  // Add this function to close the signer type modal
  function closeSignerTypeModal() {
    const modal = document.getElementById("recipientConfigModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("show");
    }
  }

  // Update the saveRecipients function
  async function saveRecipients() {
    const templateId = getTemplateId();
    if (!templateId) {
      alert("Please load a document first");
      return;
    }

    // Get all recipient items from the form
    const recipientItems = document.querySelectorAll(
      "#recipientsList .recipient-item"
    );
    const signerTypes = Array.from(recipientItems).map((item, index) => {
      const typeSelect = item.querySelector(".recipient-type");
      const labelInput = item.querySelector(".signer-label");

      return {
        type: typeSelect ? typeSelect.value : "signer",
        label: labelInput ? labelInput.value : `Signer ${index + 1}`,
        order: index + 1,
      };
    });

    if (signerTypes.length === 0) {
      alert("Please add at least one recipient");
      return;
    }

    try {
      const response = await fetch("/api/templates/signer-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          templateId,
          signerTypes,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to save recipients");
      }

      // After saving signer types, reload the document to get updated signer types
      await loadDocument(templateId);

      // Update the signers array with the new signer types
      signers = data.data.signerTypes.map((st) => ({
        id: st._id,
        type: st.type,
        label: st.label,
        order: st.order,
      }));

      // Update the recipient type dropdown with the new signer types
      const recipientTypeSelect = document.getElementById("recipientType");
      if (recipientTypeSelect) {
        recipientTypeSelect.innerHTML = signers
          .map(
            (signer) => `<option value="${signer.id}">${signer.label}</option>`
          )
          .join("");
      }

      // Close the modal
      closeSignerTypeModal();
    } catch (error) {
      console.error("Error saving recipients:", error);
      alert("Failed to save recipients: " + error.message);
    }
  }

  // Add event listeners for recipient configuration
  document
    .getElementById("addRecipient")
    .addEventListener("click", addRecipient);
  document
    .getElementById("saveRecipients")
    .addEventListener("click", saveRecipients);

  // Functions
  async function loadDocument() {
    console.log("Loading document with ID:", documentId);
    if (!documentId) {
      alert("No document ID provided");
      return;
    }

    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      // First, fetch the template with its signer types
      const templateResponse = await fetch(`/api/templates/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!templateResponse.ok) {
        throw new Error("Failed to fetch template");
      }

      const templateData = await templateResponse.json();
      if (!templateData.success) {
        throw new Error(templateData.message || "Failed to fetch template");
      }

      // Store the signer types from the template
      signers = templateData.data.signerTypes.map((st, index) => ({
        _id: `signer-${index + 1}`, // Generate a unique ID if not provided
        type: st.type,
        label: st.label,
        order: st.order,
        fields: st.fields || [],
      }));
      console.log("Loaded signer types:", signers);

      // If no signer types exist, show the recipient config modal
      if (!signers || signers.length === 0) {
        console.log("No signer types found, showing recipient config modal");
        showRecipientConfigModal();
      }

      // Get the document URL from the template
      documentUrl = templateData.data.fileUrl;
      if (!documentUrl) {
        throw new Error("No file URL found in template data");
      }

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(documentUrl);
      currentPdf = await loadingTask.promise;
      console.log("PDF loaded successfully");

      // Clear previous content
      documentViewer.innerHTML = "";

      // Create a container for all pages
      const pagesContainer = document.createElement("div");
      pagesContainer.className = "pages-container";
      documentViewer.appendChild(pagesContainer);

      // Render all pages
      for (let i = 1; i <= currentPdf.numPages; i++) {
        const pageContainer = document.createElement("div");
        pageContainer.className = "page-container";
        pageContainer.style.position = "relative";
        pageContainer.style.marginBottom = "20px";

        // Observe this page container
        pageObserver.observe(pageContainer);

        const canvas = document.createElement("canvas");
        pageContainer.appendChild(canvas);
        pagesContainer.appendChild(pageContainer);

        const page = await currentPdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Create fields layer for this page
        const fieldsLayer = document.createElement("div");
        fieldsLayer.className = "fields-layer";
        fieldsLayer.style.position = "absolute";
        fieldsLayer.style.top = "0";
        fieldsLayer.style.left = "0";
        fieldsLayer.style.width = `${viewport.width}px`;
        fieldsLayer.style.height = `${viewport.height}px`;
        pageContainer.appendChild(fieldsLayer);

        // Render fields for this page
        const pageFields = fields.filter((field) => field.page === i);
        renderFields(fieldsLayer, pageFields);
      }

      // After loading the PDF, populate the page selector
      if (pageSelector && currentPdf) {
        pageSelector.innerHTML = ""; // Clear existing options
        for (let i = 1; i <= currentPdf.numPages; i++) {
          const option = document.createElement("option");
          option.value = i;
          option.textContent = `Page ${i}`;
          pageSelector.appendChild(option);
        }
        pageSelector.value = currentPageNumber; // Set initial page
      }
    } catch (error) {
      console.error("Error loading document:", error);
      console.error("Error stack:", error.stack);
      alert("Failed to load document: " + error.message);
    }
  }

  async function renderPage(pageNumber) {
    if (!currentPdf) return;

    try {
      currentPage = await currentPdf.getPage(pageNumber);

      // Calculate scale to maintain proper dimensions
      // Standard US Letter size is 8.5 x 11 inches, at 96 DPI that's about 816 x 1056 pixels
      const STANDARD_WIDTH = 816;
      const viewport = currentPage.getViewport({ scale: 1.0 });
      currentScale = STANDARD_WIDTH / viewport.width;

      // Get the scaled viewport
      const scaledViewport = currentPage.getViewport({ scale: currentScale });

      // Create canvas
      const canvas = document.createElement("canvas");
      canvas.id = "pdfCanvas";
      const context = canvas.getContext("2d");

      // Set canvas dimensions to match viewport
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      // Create page container with proper dimensions
      const pageContainer = document.createElement("div");
      pageContainer.className = "page-container";
      pageContainer.style.width = `${scaledViewport.width}px`;
      pageContainer.style.height = `${scaledViewport.height}px`;

      // Clear previous content
      documentViewer.innerHTML = "";

      // Set up the page structure
      pageContainer.appendChild(canvas);
      pageContainer.appendChild(fieldsLayer);
      documentViewer.appendChild(pageContainer);

      // Render PDF
      await currentPage.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;

      // Update fields layer size to match canvas
      fieldsLayer.style.width = `${scaledViewport.width}px`;
      fieldsLayer.style.height = `${scaledViewport.height}px`;

      // Render fields
      renderFields();
    } catch (error) {
      console.error("Error rendering page:", error);
    }
  }

  function addField() {
    if (!currentPdf) {
      alert("Please load a document first");
      return;
    }

    // Get the current page number from the selected field type button
    const selectedButton = document.querySelector(
      ".field-type-button.selected"
    );
    if (!selectedButton) {
      alert("Please select a field type first");
      return;
    }

    // Show the field configuration modal
    const fieldType = selectedButton.dataset.fieldType;
    const fieldTypeSelect = document.getElementById("fieldType");
    if (fieldTypeSelect) {
      fieldTypeSelect.value = fieldType;
      // Trigger change event to show/hide checkbox config
      const event = new Event("change");
      fieldTypeSelect.dispatchEvent(event);
    }

    showFieldConfigModal();
  }

  function renderFields(container, fieldsToRender) {
    container.innerHTML = "";

    fieldsToRender.forEach((field) => {
      const fieldElement = document.createElement("div");
      fieldElement.className = "field";
      fieldElement.dataset.id = field.id;
      fieldElement.dataset.type = field.type;
      fieldElement.dataset.signerId = field.signerId;
      fieldElement.dataset.signerType = field.signerType;
      fieldElement.style.left = `${field.x}%`;
      fieldElement.style.top = `${field.y}%`;
      fieldElement.style.width = `${field.width}%`;
      fieldElement.style.height = `${field.height}%`;

      const fieldContent = document.createElement("div");
      fieldContent.className = "field-content";

      const fieldLabel = document.createElement("span");
      fieldLabel.className = "field-label";
      fieldLabel.textContent = field.label || field.type;

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.textContent = "×";
      deleteButton.addEventListener("click", () => deleteField(field.id));

      const resizeHandle = document.createElement("div");
      resizeHandle.className = "resize-handle";
      resizeHandle.addEventListener("mousedown", (e) =>
        handleResizeStart(e, field)
      );

      if (field.type === "checkbox") {
        const checkboxContainer = document.createElement("div");
        checkboxContainer.className = "checkbox-container";
        checkboxContainer.style.position = "relative";
        checkboxContainer.style.height = "100%";

        // Ensure checkboxGroup and checkboxes array exist
        if (!field.checkboxGroup) {
          field.checkboxGroup = {
            totalCheckboxes: 1,
            requiredCheckboxes: 1,
            checkboxes: [{ y: 0 }],
          };
        }
        if (!field.checkboxGroup.checkboxes) {
          field.checkboxGroup.checkboxes = [{ y: 0 }];
        }

        // Create checkboxes based on configuration
        for (let i = 0; i < field.checkboxGroup.totalCheckboxes; i++) {
          const checkboxWrapper = document.createElement("div");
          checkboxWrapper.className = "checkbox-wrapper";
          checkboxWrapper.dataset.index = i;
          checkboxWrapper.style.position = "absolute";
          checkboxWrapper.style.left = "0";
          checkboxWrapper.style.width = "100%";
          checkboxWrapper.style.display = "flex";
          checkboxWrapper.style.alignItems = "center";

          // Add drag handle for vertical movement
          const dragHandle = document.createElement("div");
          dragHandle.className = "checkbox-drag-handle";
          dragHandle.innerHTML = "⋮⋮";
          dragHandle.style.marginRight = "5px";
          checkboxWrapper.appendChild(dragHandle);

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "field-checkbox";
          checkbox.dataset.index = i;
          checkbox.checked = field.value === "true";
          checkbox.addEventListener("change", (e) => {
            field.value = e.target.checked ? "true" : "false";
          });

          checkboxWrapper.appendChild(checkbox);
          checkboxContainer.appendChild(checkboxWrapper);

          // Position the checkbox based on saved position
          if (field.checkboxGroup.checkboxes[i]) {
            checkboxWrapper.style.top = `${field.checkboxGroup.checkboxes[i].y}%`;
          } else {
            // If no position is saved, set a default position
            field.checkboxGroup.checkboxes[i] = { y: i * 20 }; // 20% spacing between checkboxes
            checkboxWrapper.style.top = `${i * 20}%`;
          }

          // Add drag event listeners
          dragHandle.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCheckboxDragStart(e, checkboxWrapper, field, i);
          });
        }

        fieldContent.appendChild(checkboxContainer);
      }

      fieldContent.appendChild(fieldLabel);
      fieldContent.appendChild(deleteButton);
      fieldContent.appendChild(resizeHandle);
      fieldElement.appendChild(fieldContent);

      fieldElement.addEventListener("mousedown", (e) => {
        if (e.target.closest(".checkbox-drag-handle")) {
          return;
        }
        handleFieldMouseDown(e, field);
      });
      container.appendChild(fieldElement);
    });
  }

  function handleCheckboxDragStart(e, checkboxWrapper, field, index) {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const container = checkboxWrapper.parentElement;
    const containerRect = container.getBoundingClientRect();
    const checkboxRect = checkboxWrapper.getBoundingClientRect();
    const startTop = checkboxRect.top - containerRect.top;

    // Add dragging class for visual feedback
    checkboxWrapper.classList.add("dragging");
    checkboxWrapper.style.position = "absolute";
    checkboxWrapper.style.zIndex = "1000";
    checkboxWrapper.style.width = "100%";
    checkboxWrapper.style.top = `${startTop}px`;

    function handleDrag(e) {
      e.preventDefault();
      const deltaY = e.clientY - startY;
      const newTop = startTop + deltaY;

      // Update the dragged checkbox position
      checkboxWrapper.style.top = `${newTop}px`;
    }

    function handleDragEnd() {
      checkboxWrapper.classList.remove("dragging");

      // Calculate and save the new position
      const containerRect = container.getBoundingClientRect();
      const checkboxRect = checkboxWrapper.getBoundingClientRect();
      const relativeTop =
        ((checkboxRect.top - containerRect.top) / containerRect.height) * 100;

      // Update the position in the field data
      if (!field.checkboxGroup.checkboxes[index]) {
        field.checkboxGroup.checkboxes[index] = {};
      }
      field.checkboxGroup.checkboxes[index].y = relativeTop;

      // Update the checkbox position
      checkboxWrapper.style.position = "absolute";
      checkboxWrapper.style.top = `${relativeTop}%`;
      checkboxWrapper.style.zIndex = "";

      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
    }

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
  }

  function handleDrag(e) {
    if (!isDragging || !activeField) return;

    const pageContainers = document.querySelectorAll(".page-container");
    const targetPage = pageContainers[activeField.page - 1];
    if (!targetPage) return;

    const fieldsLayer = targetPage.querySelector(".fields-layer");
    if (!fieldsLayer) return;

    const containerRect = targetPage.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // Calculate delta
    const deltaX = mouseX - initialMousePos.x;
    const deltaY = mouseY - initialMousePos.y;

    // Update field position
    const newX = initialFieldPos.x + (deltaX / containerRect.width) * 100;
    const newY = initialFieldPos.y + (deltaY / containerRect.height) * 100;

    // Ensure field stays within bounds
    activeField.x = Math.max(0, Math.min(100 - activeField.width, newX));
    activeField.y = Math.max(0, Math.min(100 - activeField.height, newY));

    // Render only the fields for this page
    const pageFields = fields.filter(
      (field) => field.page === activeField.page
    );
    renderFields(fieldsLayer, pageFields);
  }

  function handleResize(e) {
    if (!isResizing || !activeField) return;

    const pageContainers = document.querySelectorAll(".page-container");
    const targetPage = pageContainers[activeField.page - 1];
    if (!targetPage) return;

    const fieldsLayer = targetPage.querySelector(".fields-layer");
    if (!fieldsLayer) return;

    const containerRect = targetPage.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // Calculate delta
    const deltaX = mouseX - initialMousePos.x;
    const deltaY = mouseY - initialMousePos.y;

    // Update field size
    const newWidth = Math.max(
      1,
      initialFieldSize.width + (deltaX / containerRect.width) * 100
    );
    const newHeight = Math.max(
      1,
      initialFieldSize.height + (deltaY / containerRect.height) * 100
    );

    // Ensure field stays within bounds
    activeField.width = Math.min(100 - activeField.x, newWidth);
    activeField.height = Math.min(100 - activeField.y, newHeight);

    // Render only the fields for this page
    const pageFields = fields.filter(
      (field) => field.page === activeField.page
    );
    renderFields(fieldsLayer, pageFields);
  }

  function handleFieldMouseDown(e, field) {
    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    activeField = field;

    const pageContainers = document.querySelectorAll(".page-container");
    const targetPage = pageContainers[field.page - 1];
    if (!targetPage) return;

    const containerRect = targetPage.getBoundingClientRect();
    const pageOffsetX = containerRect.left;
    const pageOffsetY = containerRect.top;

    initialMousePos = {
      x: e.clientX - pageOffsetX,
      y: e.clientY - pageOffsetY,
    };

    initialFieldPos = {
      x: field.x,
      y: field.y,
    };

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
  }

  function handleResizeStart(e, field) {
    e.preventDefault();
    e.stopPropagation();

    isResizing = true;
    activeField = field;

    const pageContainers = document.querySelectorAll(".page-container");
    const targetPage = pageContainers[field.page - 1];
    if (!targetPage) return;

    const containerRect = targetPage.getBoundingClientRect();
    const pageOffsetX = containerRect.left;
    const pageOffsetY = containerRect.top;

    initialMousePos = {
      x: e.clientX - pageOffsetX,
      y: e.clientY - pageOffsetY,
    };

    initialFieldSize = {
      width: field.width,
      height: field.height,
    };

    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", handleResizeEnd);
  }

  function handleDragEnd() {
    isDragging = false;
    activeField = null;
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", handleDragEnd);
  }

  function handleResizeEnd() {
    isResizing = false;
    activeField = null;
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", handleResizeEnd);
  }

  function deleteField(fieldId) {
    // Find the field to delete
    const fieldToDelete = fields.find((f) => f.id === fieldId);
    if (!fieldToDelete) return;

    // Remove the field from the fields array
    fields = fields.filter((f) => f.id !== fieldId);

    // Find the page container and fields layer for this field
    const pageContainers = document.querySelectorAll(".page-container");
    const targetPage = pageContainers[fieldToDelete.page - 1];
    if (!targetPage) return;

    const fieldsLayer = targetPage.querySelector(".fields-layer");
    if (!fieldsLayer) return;

    // Render only the fields for this page
    const pageFields = fields.filter(
      (field) => field.page === fieldToDelete.page
    );
    renderFields(fieldsLayer, pageFields);
  }

  // Update page selector change handler
  if (pageSelector) {
    pageSelector.addEventListener("change", (e) => {
      const newPageNumber = parseInt(e.target.value);
      if (newPageNumber >= 1 && newPageNumber <= currentPdf.numPages) {
        currentPageNumber = newPageNumber;
        // Scroll to the selected page
        const pageContainers = document.querySelectorAll(".page-container");
        const targetPage = pageContainers[newPageNumber - 1];
        if (targetPage) {
          targetPage.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  }

  // Add this function to save template fields
  async function saveTemplateFields(fields) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("/api/templates/fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId: templateId,
          fields: fields,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save template fields");
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving template fields:", error);
      throw error;
    }
  }

  // Update the saveFields function to handle templates
  async function saveFields() {
    try {
      const fieldsToSave = fields
        .map((field) => {
          const fieldElement = document.querySelector(
            `.field[data-type="${field.type}"]`
          );
          if (!fieldElement) {
            console.error("Field element not found for type:", field.type);
            return null;
          }

          const rect = fieldElement.getBoundingClientRect();
          const pageContainer = fieldElement.closest(".page-container");
          if (!pageContainer) {
            console.error("Page container not found for field:", field.type);
            return null;
          }

          const page = parseInt(pageContainer.dataset.page) || 1;

          return {
            type: field.type,
            label: field.label || "",
            required: field.required || false,
            signerTypeId: field.signerTypeId,
            signerType: field.signerType,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            page: page,
            checkboxGroup:
              field.type === "checkbox"
                ? {
                    totalCheckboxes: field.checkboxGroup.totalCheckboxes,
                    requiredCheckboxes: field.checkboxGroup.requiredCheckboxes,
                    checkboxes: field.checkboxGroup.checkboxes || [],
                  }
                : undefined,
          };
        })
        .filter((field) => field !== null);

      console.log("Fields to save:", fieldsToSave);

      const response = await fetch("/api/templates/fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          templateId: getTemplateId(),
          fields: fieldsToSave,
        }),
      });

      const data = await response.json();
      console.log("Save response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to save fields");
      }

      if (data.success) {
        alert("Fields saved successfully");
      } else {
        throw new Error(data.message || "Failed to save fields");
      }
    } catch (error) {
      console.error("Error saving fields:", error);
      alert("Error saving fields: " + error.message);
    }
  }

  function getTemplateId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("id");
  }

  // Initialize modal elements
  checkboxConfigModal = document.getElementById("checkboxConfigModal");
  totalCheckboxesInput = document.getElementById("totalCheckboxes");
  requiredCheckboxesInput = document.getElementById("requiredCheckboxes");
  const addRecipientBtn = document.getElementById("addRecipient");
  const saveRecipientsBtn = document.getElementById("saveRecipients");
  const cancelCheckboxConfigBtn = document.getElementById(
    "cancelCheckboxConfig"
  );
  const saveCheckboxConfigBtn = document.getElementById("saveCheckboxConfig");
  const saveRecipientsBtn2 = document.getElementById("save-recipients");
  const cancelRecipientsBtn = document.getElementById("cancel-recipients");

  if (
    !checkboxConfigModal ||
    !totalCheckboxesInput ||
    !requiredCheckboxesInput
  ) {
    console.error("Modal elements not found");
    return;
  }

  // Add event listeners for modal buttons
  if (cancelCheckboxConfigBtn) {
    cancelCheckboxConfigBtn.addEventListener("click", () => {
      if (checkboxConfigModal) {
        checkboxConfigModal.style.display = "none";
        checkboxConfigModal.classList.remove("show");
      }
      currentCheckboxField = null;
    });
  }

  if (saveCheckboxConfigBtn) {
    saveCheckboxConfigBtn.addEventListener("click", saveCheckboxConfig);
  }

  if (addRecipientBtn) {
    addRecipientBtn.addEventListener("click", addRecipient);
  }

  if (saveRecipientsBtn) {
    saveRecipientsBtn.addEventListener("click", saveRecipients);
  }

  if (saveRecipientsBtn2) {
    saveRecipientsBtn2.addEventListener("click", async () => {
      const signerTypes = [];
      const signerInputs = document.querySelectorAll(".signer-input");

      signerInputs.forEach((input, index) => {
        const label = input.querySelector(".signer-label").value;
        if (label) {
          signerTypes.push({
            type: "signer",
            label,
            order: index + 1,
          });
        }
      });

      if (signerTypes.length === 0) {
        alert("Please add at least one signer");
        return;
      }

      try {
        await saveSignerTypes(templateId, signerTypes);
        // Close the modal
        closeSignerTypeModal();
        // Refresh the template to get updated signer types
        await loadDocument(templateId);
      } catch (error) {
        alert("Failed to save signer types. Please try again.");
      }
    });
  }

  if (cancelRecipientsBtn) {
    cancelRecipientsBtn.addEventListener("click", () => {
      closeSignerTypeModal();
    });
  }

  function showFieldConfigModal() {
    const modal = document.getElementById("fieldConfigModal");
    const recipientTypeSelect = document.getElementById("recipientType");
    const recipientNameSpan = document.querySelector(".recipient-name");

    // Clear previous options
    recipientTypeSelect.innerHTML =
      '<option value="">Select recipient type</option>';

    // Add signer types to dropdown
    if (signers && signers.length > 0) {
      signers.forEach((signer) => {
        const option = document.createElement("option");
        option.value = signer._id || signer.id; // Handle both _id and id formats
        option.textContent = signer.label;
        recipientTypeSelect.appendChild(option);
      });
    } else {
      // If no signers exist, show the recipient config modal
      alert("Please configure recipients first");
      showRecipientConfigModal();
      return;
    }

    // Add event listener for recipient type change
    recipientTypeSelect.addEventListener("change", function () {
      const selectedSigner = signers.find(
        (s) => (s._id || s.id) === this.value
      );
      if (selectedSigner) {
        recipientNameSpan.textContent = selectedSigner.label;
        // Update the sidebar header
        const sidebarHeader = document.querySelector(
          ".sidebar-header .recipient-name"
        );
        if (sidebarHeader) {
          sidebarHeader.textContent = selectedSigner.label;
        }
      } else {
        recipientNameSpan.textContent = "";
        // Clear the sidebar header
        const sidebarHeader = document.querySelector(
          ".sidebar-header .recipient-name"
        );
        if (sidebarHeader) {
          sidebarHeader.textContent = "";
        }
      }
    });

    modal.style.display = "block";
  }

  function createField() {
    const fieldType = document.getElementById("fieldType").value;
    const fieldLabel = document.getElementById("fieldLabel").value;
    const fieldRequired = document.getElementById("fieldRequired").checked;
    const signerTypeId = document.getElementById("recipientType").value;

    if (!signerTypeId) {
      alert("Please select a signer");
      return;
    }

    const signer = signers.find((s) => s._id === signerTypeId);
    if (!signer) {
      alert("Selected signer not found");
      return;
    }

    const field = {
      id: Date.now(),
      type: fieldType,
      label: fieldLabel || fieldType,
      required: fieldRequired,
      signerTypeId: signer._id,
      signerType: signer.type,
      x: 10,
      y: 10,
      width: 150,
      height: 50,
      page: currentPageNumber,
    };

    if (fieldType === "checkbox") {
      const totalCheckboxes =
        parseInt(document.getElementById("totalCheckboxes").value) || 1;
      const requiredCheckboxes =
        parseInt(document.getElementById("requiredCheckboxes").value) || 1;

      field.checkboxGroup = {
        totalCheckboxes,
        requiredCheckboxes,
        checkboxes: Array(totalCheckboxes)
          .fill()
          .map((_, i) => ({
            y: i * 20, // Default spacing between checkboxes
          })),
      };
    }

    fields.push(field);

    // Find the fields layer for the correct page
    const pageContainers = document.querySelectorAll(".page-container");
    const targetPage = pageContainers[currentPageNumber - 1];
    if (targetPage) {
      const fieldsLayer = targetPage.querySelector(".fields-layer");
      if (fieldsLayer) {
        // Get all fields for this page
        const pageFields = fields.filter((f) => f.page === currentPageNumber);
        renderFields(fieldsLayer, pageFields);
      }
    }

    // Close the modal
    const modal = document.getElementById("fieldConfigModal");
    modal.style.display = "none";
  }

  // Show recipient configuration modal when page loads
  showRecipientConfigModal();

  // Function to save signer types
  async function saveSignerTypes(templateId, signerTypes) {
    try {
      const response = await fetch("/api/templates/signer-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId,
          signerTypes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save signer types");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error saving signer types:", error);
      throw error;
    }
  }
});
