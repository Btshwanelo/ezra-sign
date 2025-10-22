export class FieldManager {
  constructor(container, onUpdate) {
    this.container = container;
    this.onUpdate = onUpdate;
    this.isDragging = false;
    this.isResizing = false;
    this.currentField = null;
    this.initialX = 0;
    this.initialY = 0;
    this.initialWidth = 0;
    this.initialHeight = 0;
    this.containerRect = null;
  }

  init() {
    this.container.addEventListener("mousedown", this.handleMouseDown);
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  cleanup() {
    this.container.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  handleMouseDown = (e) => {
    const fieldElement = e.target.closest(".field-marker");
    if (!fieldElement) return;

    const fieldId = fieldElement.dataset.fieldId;
    if (!fieldId) return;

    this.containerRect = this.container.getBoundingClientRect();
    this.currentField = fieldId;

    if (e.target.classList.contains("resize-handle")) {
      this.startResize(e, fieldElement);
    } else {
      this.startDrag(e, fieldElement);
    }
  };

  handleMouseMove = (e) => {
    if (this.isDragging) {
      this.handleDrag(e);
    } else if (this.isResizing) {
      this.handleResize(e);
    }
  };

  handleMouseUp = () => {
    this.isDragging = false;
    this.isResizing = false;
    this.currentField = null;
  };

  startDrag(e, fieldElement) {
    e.preventDefault();
    this.isDragging = true;

    const rect = fieldElement.getBoundingClientRect();
    this.initialX = e.clientX - rect.left;
    this.initialY = e.clientY - rect.top;
  }

  startResize(e, fieldElement) {
    e.preventDefault();
    this.isResizing = true;

    const rect = fieldElement.getBoundingClientRect();
    this.initialWidth = rect.width;
    this.initialHeight = rect.height;
    this.initialX = e.clientX;
    this.initialY = e.clientY;
  }

  handleDrag(e) {
    if (!this.currentField || !this.containerRect) return;

    const x = e.clientX - this.containerRect.left - this.initialX;
    const y = e.clientY - this.containerRect.top - this.initialY;

    // Convert to percentages
    const xPercent = (x / this.containerRect.width) * 100;
    const yPercent = (y / this.containerRect.height) * 100;

    // Ensure field stays within container bounds
    const boundedX = Math.max(0, Math.min(xPercent, 100));
    const boundedY = Math.max(0, Math.min(yPercent, 100));

    this.onUpdate(this.currentField, {
      x: boundedX,
      y: boundedY,
    });
  }

  handleResize(e) {
    if (!this.currentField || !this.containerRect) return;

    const deltaX = e.clientX - this.initialX;
    const deltaY = e.clientY - this.initialY;

    const newWidth = Math.max(50, this.initialWidth + deltaX);
    const newHeight = Math.max(30, this.initialHeight + deltaY);

    this.onUpdate(this.currentField, {
      width: newWidth,
      height: newHeight,
    });
  }
}
