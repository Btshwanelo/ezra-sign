//add checkbox - done
//improve ui, match signwell styling
//make the image to be transparent - png - done
//work on nice animation and feedback after signing - done
//generate base 64 after signing -done

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Type, Calendar, Download, ChevronLeft, ChevronRight, X, Trash2, Edit3, User, CheckSquare, Pen, Settings, Signature } from 'lucide-react';

const PDFSignatureTool = () => {
  // State management
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageScale, setPageScale] = useState(1);
  const [pageElements, setPageElements] = useState(new Map());
  const [activeElement, setActiveElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  const [isMovingElement, setIsMovingElement] = useState(false);

  // Signature setup state
  const [showSignatureSetup, setShowSignatureSetup] = useState(true);
  const [userInfo, setUserInfo] = useState({ name: '', initials: '' });
  const [signatureOptions, setSignatureOptions] = useState([]);
  const [initialsOptions, setInitialsOptions] = useState([]);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [selectedInitials, setSelectedInitials] = useState(null);
  const [setupStep, setSetupStep] = useState('info'); // 'info', 'signatures', 'complete'
  
  // Drawing state
  const [signatureTab, setSignatureTab] = useState('type'); // 'type' or 'draw'
  const [initialsTab, setInitialsTab] = useState('type'); // 'type' or 'draw'
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState(null);
  const [drawnInitials, setDrawnInitials] = useState(null);
  
  // Completion state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [signedDocumentBase64, setSignedDocumentBase64] = useState(null);

  // Refs
  const canvasRef = useRef(null);
  const documentPageRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropIndicatorRef = useRef(null);
  const dragPreviewRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const initialsCanvasRef = useRef(null);

  // Initialize PDF.js and setup resize listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // Handle window resize
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (pdfDoc && currentPage) {
          renderPage(pdfDoc, currentPage);
        }
      }, 250);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [pdfDoc, currentPage]);

  // Generate signature options based on name
  const generateSignatureOptions = (name, initials) => {
    const signatures = [
      {
        id: 'sig1',
        type: 'cursive',
        name: 'Cursive',
        preview: generateSignaturePreview(name, 'cursive')
      },
      {
        id: 'sig2',
        type: 'elegant',
        name: 'Elegant',
        preview: generateSignaturePreview(name, 'elegant')
      },
      {
        id: 'sig3',
        type: 'modern',
        name: 'Modern',
        preview: generateSignaturePreview(name, 'modern')
      }
    ];

    const initialsOpts = [
      {
        id: 'init1',
        type: 'simple',
        name: 'Simple',
        preview: generateInitialsPreview(initials, 'simple')
      },
      {
        id: 'init2',
        type: 'circle',
        name: 'Circled',
        preview: generateInitialsPreview(initials, 'circle')
      },
      {
        id: 'init3',
        type: 'underline',
        name: 'Underlined',
        preview: generateInitialsPreview(initials, 'underline')
      }
    ];

    setSignatureOptions(signatures);
    setInitialsOptions(initialsOpts);
  };

  // Generate signature preview (high resolution)
  const generateSignaturePreview = (name, style) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    switch (style) {
      case 'cursive':
        ctx.font = 'italic 72px "Dancing Script", cursive';
        ctx.fillStyle = '#1f2937';
        break;
      case 'elegant':
        ctx.font = '66px "Playfair Display", serif';
        ctx.fillStyle = '#374151';
        break;
      case 'modern':
        ctx.font = '60px "Inter", sans-serif';
        ctx.fillStyle = '#111827';
        break;
    }
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);
    
    if (style === 'elegant') {
      ctx.beginPath();
      ctx.moveTo(60, 135);
      ctx.lineTo(540, 135);
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    return canvas.toDataURL('image/png');
  };

  // Generate initials preview (high resolution)
  const generateInitialsPreview = (initials, style) => {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    switch (style) {
      case 'simple':
        ctx.font = 'bold 66px "Inter", sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(initials, canvas.width / 2, canvas.height / 2);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 75, 0, 2 * Math.PI);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        ctx.font = 'bold 54px "Inter", sans-serif';
        ctx.fillStyle = '#2563eb';
        ctx.fillText(initials, canvas.width / 2, canvas.height / 2);
        break;
      case 'underline':
        ctx.font = 'bold 60px "Inter", sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(initials, canvas.width / 2, canvas.height / 2 - 15);
        
        ctx.beginPath();
        ctx.moveTo(45, 135);
        ctx.lineTo(195, 135);
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 6;
        ctx.stroke();
        break;
    }
    
    return canvas.toDataURL('image/png');
  };

  // Handle signature setup completion
  const handleSetupComplete = () => {
    if (setupStep === 'info' && userInfo.name && userInfo.initials) {
      generateSignatureOptions(userInfo.name, userInfo.initials);
      setSetupStep('signatures');
    } else if (setupStep === 'signatures') {
      // Check if user has selected/drawn both signature and initials
      const hasSignature = selectedSignature || drawnSignature;
      const hasInitials = selectedInitials || drawnInitials;
      
      if (hasSignature && hasInitials) {
        setSetupStep('complete');
        setShowSignatureSetup(false);
      }
    }
  };

  // Drawing functions
  const startDrawing = (e, canvasRef) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    // Get the actual canvas dimensions vs display dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e, canvasRef) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    // Get the actual canvas dimensions vs display dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (canvasRef, setDrawnData) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    setDrawnData(dataURL);
  };

  const clearCanvas = (canvasRef, setDrawnData) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnData(null);
  };

  // Initialize canvas
  const initializeCanvas = (canvasRef) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Effect to initialize canvases when modal opens
  useEffect(() => {
    if (setupStep === 'signatures') {
      setTimeout(() => {
        if (signatureCanvasRef.current) initializeCanvas(signatureCanvasRef);
        if (initialsCanvasRef.current) initializeCanvas(initialsCanvasRef);
      }, 100);
    }
  }, [setupStep]);

  // File upload handler
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      await loadPDF(file);
    }
  };

  // Load PDF
  const loadPDF = async (file) => {
    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      const doc = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      setPageElements(new Map());
      await renderPage(doc, 1);
    } catch (error) {
      console.error('Error loading PDF:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render PDF page
  const renderPage = async (doc, pageNum) => {
    if (!doc || !canvasRef.current) return;

    try {
      const page = await doc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = Math.min(800, window.innerWidth - 400);
      const scale = containerWidth / viewport.width;
      setPageScale(scale);
      
      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport
      }).promise;

      restorePageElements(pageNum);
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  // Navigation functions
  const goToPage = useCallback((pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages && pdfDoc) {
      setCurrentPage(pageNum);
      renderPage(pdfDoc, pageNum);
    }
  }, [totalPages, pdfDoc]);

  const previousPage = () => goToPage(currentPage - 1);
  const nextPage = () => goToPage(currentPage + 1);

  // Drag and drop handlers
  const handleDragStart = (e, tool) => {
    setIsDragging(true);
    let content = null;
    
    if (tool === 'signature') {
      content = drawnSignature || selectedSignature?.preview;
    } else if (tool === 'initials') {
      content = drawnInitials || selectedInitials?.preview;
    }
    
    setDragData({ tool, content });

    const preview = createDragPreview(tool, content);
    if (preview) {
      document.body.appendChild(preview);
      dragPreviewRef.current = preview;
      e.dataTransfer.setDragImage(preview, 20, 20);
    }

    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragData(null);
    
    if (dragPreviewRef.current) {
      document.body.removeChild(dragPreviewRef.current);
      dragPreviewRef.current = null;
    }
    
    if (dropIndicatorRef.current) {
      dropIndicatorRef.current.classList.remove('opacity-100');
      dropIndicatorRef.current.classList.add('opacity-0');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragging || !documentPageRef.current) return;
    
    e.dataTransfer.dropEffect = 'copy';
    
    const rect = documentPageRef.current.getBoundingClientRect();
    
    if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) {
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (dropIndicatorRef.current) {
        dropIndicatorRef.current.style.left = `${x}px`;
        dropIndicatorRef.current.style.top = `${y}px`;
        dropIndicatorRef.current.classList.remove('opacity-0');
        dropIndicatorRef.current.classList.add('opacity-100');
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!isDragging || !dragData || !documentPageRef.current) return;
    
    const rect = documentPageRef.current.getBoundingClientRect();
    
    if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) {
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;
      
      addElementToDocument(dragData, xPercent, yPercent);
    }
  };

  // Create drag preview
  const createDragPreview = (tool, content) => {
    const preview = document.createElement('div');
    preview.className = 'fixed pointer-events-none z-50 opacity-80 transform rotate-3';
    preview.style.left = '-1000px';
    preview.style.top = '-1000px';
    
    switch (tool) {
      case 'signature':
      case 'initials':
        if (content) {
          const img = document.createElement('img');
          img.src = content;
          img.style.height = '48px';
          img.style.width = 'auto';
          preview.appendChild(img);
        }
        break;
      case 'text':
        const textDiv = document.createElement('div');
        textDiv.className = 'px-3 py-2 bg-white border-2 border-dashed border-teal-500 rounded text-sm text-gray-600';
        textDiv.textContent = 'Text Field';
        preview.appendChild(textDiv);
        break;
      case 'date':
        const dateDiv = document.createElement('div');
        dateDiv.className = 'px-3 py-2 bg-white border-2 border-dashed border-teal-500 rounded text-sm text-gray-600';
        dateDiv.textContent = new Date().toISOString().split('T')[0];
        preview.appendChild(dateDiv);
        break;
      case 'checkbox':
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'px-3 py-2 bg-white border-2 border-dashed border-teal-500 rounded text-sm text-gray-600 flex items-center justify-center';
        checkboxDiv.innerHTML = '✓';
        checkboxDiv.style.fontSize = '18px';
        checkboxDiv.style.fontWeight = 'bold';
        preview.appendChild(checkboxDiv);
        break;
    }
    
    return preview;
  };

  // Add element to document
  const addElementToDocument = (dragData, x, y) => {
    const elementId = `element_${Date.now()}_${Math.random()}`;
    const newElement = {
      id: elementId,
      type: dragData.tool,
      position: { x: `${x}%`, y: `${y}%` },
      content: dragData.content || 
               (dragData.tool === 'date' ? new Date().toISOString().split('T')[0] : 
                dragData.tool === 'checkbox' ? true : ''),
      size: { 
        width: dragData.tool === 'signature' ? 150 : 
               dragData.tool === 'initials' ? 80 : 
               dragData.tool === 'checkbox' ? 30 : 120,
        height: dragData.tool === 'signature' ? 60 : 
                dragData.tool === 'initials' ? 60 : 
                dragData.tool === 'text' ? 40 : 
                dragData.tool === 'checkbox' ? 30 : 32
      }
    };

    const currentPageElements = pageElements.get(currentPage) || [];
    const updatedElements = [...currentPageElements, newElement];
    
    const newPageElements = new Map(pageElements);
    newPageElements.set(currentPage, updatedElements);
    setPageElements(newPageElements);
  };

  // Restore page elements
  const restorePageElements = (pageNum) => {
    // Elements are rendered via React state
  };

  // Delete element
  const deleteElement = (elementId) => {
    const currentPageElements = pageElements.get(currentPage) || [];
    const updatedElements = currentPageElements.filter(el => el.id !== elementId);
    
    const newPageElements = new Map(pageElements);
    newPageElements.set(currentPage, updatedElements);
    setPageElements(newPageElements);
  };

  // Update element content
  const updateElementContent = (elementId, content) => {
    const currentPageElements = pageElements.get(currentPage) || [];
    const updatedElements = currentPageElements.map(el => 
      el.id === elementId ? { ...el, content } : el
    );
    
    const newPageElements = new Map(pageElements);
    newPageElements.set(currentPage, updatedElements);
    setPageElements(newPageElements);
  };

  // Update element size
  const updateElementSize = (elementId, size) => {
    const currentPageElements = pageElements.get(currentPage) || [];
    const updatedElements = currentPageElements.map(el => 
      el.id === elementId ? { ...el, size } : el
    );
    
    const newPageElements = new Map(pageElements);
    newPageElements.set(currentPage, updatedElements);
    setPageElements(newPageElements);
  };

  // Update element position
  const updateElementPosition = (elementId, position) => {
    const currentPageElements = pageElements.get(currentPage) || [];
    const updatedElements = currentPageElements.map(el => 
      el.id === elementId ? { ...el, position } : el
    );
    
    const newPageElements = new Map(pageElements);
    newPageElements.set(currentPage, updatedElements);
    setPageElements(newPageElements);
  };

  // Handle element movement
  const handleElementMouseDown = (e, elementId) => {
    if (e.target.classList.contains('resize-handle') || 
        e.target.tagName.toLowerCase() === 'textarea' || 
        e.target.tagName.toLowerCase() === 'input') {
      return;
    }

    e.preventDefault();
    setActiveElement(elementId);
    setIsMovingElement(true);
    setDraggedElement(elementId);

    const rect = documentPageRef.current.getBoundingClientRect();
    const elementRect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - elementRect.left;
    const offsetY = e.clientY - elementRect.top;

    const handleMouseMove = (moveEvent) => {
      if (!documentPageRef.current) return;

      const rect = documentPageRef.current.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left - offsetX;
      const y = moveEvent.clientY - rect.top - offsetY;

      const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));

      updateElementPosition(elementId, { 
        x: `${xPercent}%`, 
        y: `${yPercent}%` 
      });
    };

    const handleMouseUp = () => {
      setIsMovingElement(false);
      setDraggedElement(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle resize
  const handleResizeStart = (e, elementId, direction) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveElement(elementId);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const currentPageElements = pageElements.get(currentPage) || [];
    const element = currentPageElements.find(el => el.id === elementId);
    const startWidth = element.size.width;
    const startHeight = element.size.height;
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      switch (direction) {
        case 'se':
          newWidth = Math.max(50, startWidth + deltaX);
          newHeight = Math.max(20, startHeight + deltaY);
          break;
        case 'sw':
          newWidth = Math.max(50, startWidth - deltaX);
          newHeight = Math.max(20, startHeight + deltaY);
          break;
        case 'ne':
          newWidth = Math.max(50, startWidth + deltaX);
          newHeight = Math.max(20, startHeight - deltaY);
          break;
        case 'nw':
          newWidth = Math.max(50, startWidth - deltaX);
          newHeight = Math.max(20, startHeight - deltaY);
          break;
        case 'e':
          newWidth = Math.max(50, startWidth + deltaX);
          break;
        case 'w':
          newWidth = Math.max(50, startWidth - deltaX);
          break;
        case 's':
          newHeight = Math.max(20, startHeight + deltaY);
          break;
        case 'n':
          newHeight = Math.max(20, startHeight - deltaY);
          break;
      }
      
      const updatedPageElements = pageElements.get(currentPage) || [];
      const updatedElements = updatedPageElements.map(el => 
        el.id === elementId ? { ...el, size: { width: newWidth, height: newHeight } } : el
      );
      
      const newPageElements = new Map(pageElements);
      newPageElements.set(currentPage, updatedElements);
      setPageElements(newPageElements);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Complete signature and download
  const completeSignature = async () => {
    if (!pdfDoc) return;
    
    try {
      setIsProcessing(true);
      
      const pdfBytes = await pdfDoc.getData();
      const { PDFDocument, rgb } = window.PDFLib;
      const pdfDocLib = await PDFDocument.load(pdfBytes);

      for (const [pageNumber, currentPageElementsList] of pageElements.entries()) {
        const page = pdfDocLib.getPage(pageNumber - 1);
        const { width, height } = page.getSize();

        for (const element of currentPageElementsList) {
          const { type, position, content, size } = element;
          
          let xPercent, yPercent;
          
          if (typeof position.x === 'number') {
            xPercent = position.x;
          } else {
            xPercent = parseFloat(position.x);
            if (position.x.endsWith('px')) {
              const docPageElement = documentPageRef.current;
              if (docPageElement) {
                const rect = docPageElement.getBoundingClientRect();
                xPercent = (xPercent / rect.width) * 100;
              }
            }
          }
          
          if (typeof position.y === 'number') {
            yPercent = position.y;
          } else {
            yPercent = parseFloat(position.y);
            if (position.y.endsWith('px')) {
              const docPageElement = documentPageRef.current;
              if (docPageElement) {
                const rect = docPageElement.getBoundingClientRect();
                yPercent = (yPercent / rect.height) * 100;
              }
            }
          }

          if (type === 'signature' || type === 'initials') {
            try {
              const imgBytes = await fetchImage(content);
              const img = await embedImage(pdfDocLib, imgBytes, content);
              
              let newWidth, newHeight;
              
              if (size && size.width && size.height) {
                newWidth = size.width;
                newHeight = size.height;
              } else {
                const { width: originalWidth, height: originalHeight } = img;
                newHeight = type === 'signature' ? 60 : 48;
                newWidth = (originalWidth / originalHeight) * newHeight;
              }

              const x = (xPercent / 100) * width;
              const y = height - (yPercent / 100) * height - newHeight;

              page.drawImage(img, { 
                x, 
                y, 
                width: newWidth, 
                height: newHeight 
              });
            } catch (imgError) {
              console.error('Error processing image:', imgError);
            }
          } else if (type === 'text' || type === 'date') {
            const fontSize = 12;
            const x = (xPercent / 100) * width;
            const y = height - (yPercent / 100) * height - fontSize;

            page.drawText(content || '', { x, y, size: fontSize });
          } else if (type === 'checkbox' && content) {
            const checkSize = Math.min(size.width, size.height) * 0.6;
            const x = (xPercent / 100) * width + size.width * 0.2;
            const y = height - (yPercent / 100) * height - size.height * 0.7;
            
            page.drawLine({
              start: { x: x, y: y },
              end: { x: x + checkSize * 0.3, y: y - checkSize * 0.3 },
              thickness: 2,
              color: rgb(0.133, 0.773, 0.369)
            });
            
            page.drawLine({
              start: { x: x + checkSize * 0.3, y: y - checkSize * 0.3 },
              end: { x: x + checkSize * 0.8, y: y + checkSize * 0.2 },
              thickness: 2,
              color: rgb(0.133, 0.773, 0.369)
            });
          }
        }
      }

      const updatedPdfBytes = await pdfDocLib.save();
      
      const uint8Array = new Uint8Array(updatedPdfBytes);
      let binaryString = '';
      const chunkSize = 8192;
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, chunk);
      }
      
      const base64String = btoa(binaryString);
      
      setSignedDocumentBase64(base64String);
      setShowCompletionModal(true);
      
    } catch (error) {
      console.error('Error completing signature:', error);
      alert('Error completing signature. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions for PDF processing
  const fetchImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${imageUrl}`);
      }
      const imgBytes = await response.arrayBuffer();
      return imgBytes;
    } catch (error) {
      console.error('Error fetching image:', error);
      throw error;
    }
  };

  const embedImage = async (pdfDoc, imgBytes, content) => {
    try {
      try {
        return await pdfDoc.embedPng(imgBytes);
      } catch (error) {
        console.error('Error embedding PNG:', error);
      }
      
      try {
        return await pdfDoc.embedJpg(imgBytes);
      } catch (error) {
        console.error('Error embedding JPG:', error);
      }

      try {
        const convertedImg = await convertToBase64PNG(imgBytes);
        return await pdfDoc.embedPng(convertedImg);
      } catch (error) {
        console.error('Error converting to PNG:', error);
        throw new Error(`Failed to embed image: ${content} is not supported.`);
      }
    } catch (error) {
      console.error('Error embedding image:', error);
      throw error;
    }
  };

  const convertToBase64PNG = async (imageBytes) => {
    const imageBlob = new Blob([imageBytes]);
    const imageURL = URL.createObjectURL(imageBlob);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        const base64PNG = dataURL.split(',')[1];
        resolve(base64ToArrayBuffer(base64PNG));
      };
      img.onerror = reject;
      img.src = imageURL;
    });
  };

  const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const arrayBuffer = new ArrayBuffer(len);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < len; i++) {
      view[i] = binaryString.charCodeAt(i);
    }
    return arrayBuffer;
  };

  const downloadSignedDocument = () => {
    if (!signedDocumentBase64) return;

    const byteCharacters = atob(signedDocumentBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdfFile.name.replace('.pdf', '')}_signed.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCloseCompletion = (shouldDownload = false) => {
    if (shouldDownload) {
      downloadSignedDocument();
    }
    
    setShowCompletionModal(false);
    setPdfFile(null);
    setPdfDoc(null);
    setPageElements(new Map());
    setSignedDocumentBase64(null);
  };

  // Get current page elements
  const currentPageElements = pageElements.get(currentPage) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Signature Setup Modal */}
      {showSignatureSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {setupStep === 'info' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-teal-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Your Signature</h2>
                    <p className="text-gray-600">Let's create your signature and initials for signing documents</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Initials *
                      </label>
                      <input
                        type="text"
                        value={userInfo.initials}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, initials: e.target.value.slice(0, 3) }))}
                        placeholder="Enter your initials (e.g., JD)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        maxLength={3}
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleSetupComplete}
                        disabled={!userInfo.name || !userInfo.initials}
                        className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium"
                      >
                        Create Signatures
                      </button>
                    </div>
                  </div>
                </>
              )}

              {setupStep === 'signatures' && (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Signatures</h2>
                    <p className="text-gray-600">Type or draw your signature and initials</p>
                  </div>

                  <div className="space-y-8">
                    {/* Signature Section */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Signature</h3>
                      
                      {/* Signature Tabs */}
                      <div className="flex mb-4 border-b border-gray-200">
                        <button
                          onClick={() => setSignatureTab('type')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            signatureTab === 'type'
                              ? 'border-teal-500 text-teal-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Type
                        </button>
                        <button
                          onClick={() => setSignatureTab('draw')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            signatureTab === 'draw'
                              ? 'border-teal-500 text-teal-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Draw
                        </button>
                        <button
                          onClick={() => setSignatureTab('upload')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            signatureTab === 'upload'
                              ? 'border-teal-500 text-teal-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Upload
                        </button>
                      </div>

                      {/* Signature Content */}
                      {signatureTab === 'type' ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {signatureOptions.map((sig) => (
                            <div
                              key={sig.id}
                              onClick={() => {
                                setSelectedSignature(sig);
                                setDrawnSignature(null);
                              }}
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                selectedSignature?.id === sig.id && !drawnSignature
                                  ? 'border-teal-500 bg-teal-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-center">
                                <img src={sig.preview} alt={sig.name} className="mx-auto mb-2" />
                                <span className="text-sm font-medium text-gray-700">{sig.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="border-2 border-gray-300 rounded-lg p-4">
                            <canvas
                              ref={signatureCanvasRef}
                              width={400}
                              height={150}
                              className="border border-gray-200 rounded cursor-crosshair bg-white w-full"
                              style={{ maxHeight: '150px' }}
                              onMouseDown={(e) => startDrawing(e, signatureCanvasRef)}
                              onMouseMove={(e) => draw(e, signatureCanvasRef)}
                              onMouseUp={() => stopDrawing(signatureCanvasRef, setDrawnSignature)}
                              onMouseLeave={() => stopDrawing(signatureCanvasRef, setDrawnSignature)}
                              onClick={() => {
                                setSelectedSignature(null);
                                if (drawnSignature) {
                                  // Keep the drawn signature selected
                                }
                              }}
                            />
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-gray-500">Draw your signature above</span>
                              <button
                                onClick={() => clearCanvas(signatureCanvasRef, setDrawnSignature)}
                                className="text-sm text-teal-600 hover:text-teal-700"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Initials Section */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Initials</h3>
                      
                      {/* Initials Tabs */}
                      <div className="flex mb-4 border-b border-gray-200">
                        <button
                          onClick={() => setInitialsTab('type')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            initialsTab === 'type'
                              ? 'border-teal-500 text-teal-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Type
                        </button>
                        <button
                          onClick={() => setInitialsTab('draw')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            initialsTab === 'draw'
                              ? 'border-teal-500 text-teal-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Draw
                        </button>
                        <button
                          onClick={() => setInitialsTab('upload')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            initialsTab === 'upload'
                              ? 'border-teal-500 text-teal-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Upload
                        </button>
                      </div>

                      {/* Initials Content */}
                      {initialsTab === 'type' ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {initialsOptions.map((init) => (
                            <div
                              key={init.id}
                              onClick={() => {
                                setSelectedInitials(init);
                                setDrawnInitials(null);
                              }}
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                selectedInitials?.id === init.id && !drawnInitials
                                  ? 'border-teal-500 bg-teal-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-center">
                                <img src={init.preview} alt={init.name} className="mx-auto mb-2" />
                                <span className="text-sm font-medium text-gray-700">{init.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="border-2 border-gray-300 rounded-lg p-4">
                            <canvas
                              ref={initialsCanvasRef}
                              width={200}
                              height={100}
                              className="border border-gray-200 rounded cursor-crosshair bg-white w-full"
                              style={{ maxHeight: '100px' }}
                              onMouseDown={(e) => startDrawing(e, initialsCanvasRef)}
                              onMouseMove={(e) => draw(e, initialsCanvasRef)}
                              onMouseUp={() => stopDrawing(initialsCanvasRef, setDrawnInitials)}
                              onMouseLeave={() => stopDrawing(initialsCanvasRef, setDrawnInitials)}
                              onClick={() => {
                                setSelectedInitials(null);
                                if (drawnInitials) {
                                  // Keep the drawn initials selected
                                }
                              }}
                            />
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-gray-500">Draw your initials above</span>
                              <button
                                onClick={() => clearCanvas(initialsCanvasRef, setDrawnInitials)}
                                className="text-sm text-teal-600 hover:text-teal-700"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        onClick={() => setSetupStep('info')}
                        className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSetupComplete}
                        disabled={!(selectedSignature || drawnSignature) || !(selectedInitials || drawnInitials)}
                        className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium"
                      >
                        Complete Setup
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion Success Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Signed Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Your document has been signed and is ready for download.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Document:</span>
                  <span className="font-medium text-gray-900">{pdfFile?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Signed by:</span>
                  <span className="font-medium text-gray-900">{userInfo.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleCloseCompletion(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleCloseCompletion(true)}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                >
                  Download & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!pdfFile ? (
        // Upload section
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-teal-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign PDF</h1>
            <p className="text-gray-600 mb-8">Upload your PDF document to start signing</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors shadow-lg"
            >
              Choose PDF File
            </button>
          </div>
        </div>
      ) : (
        // Main application with sidebar layout
        <div className="flex h-screen">
          {/* Left side - Document viewer */}
          <div className="flex-1 flex flex-col">
            {/* Top toolbar */}
            <div>nav</div>
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {pdfFile.name}
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Page {currentPage} of {totalPages}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={previousPage}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={nextPage}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setPdfFile(null);
                      setPdfDoc(null);
                      setPageElements(new Map());
                    }}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document viewer */}
            <div className="flex-1 bg-gray-100 p-6 overflow-auto">
              <div className="flex justify-center">
                <div 
                  className={`relative bg-white shadow-lg ${isDragging ? 'bg-blue-50' : ''} transition-colors`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {/* PDF Canvas */}
                  <canvas
                    ref={canvasRef}
                    className="block"
                  />

                  {/* Document page overlay for elements */}
                  <div
                    ref={documentPageRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-auto"
                    style={{ zIndex: 2 }}
                    onClick={(e) => {
                      if (e.target === documentPageRef.current) {
                        setActiveElement(null);
                      }
                    }}
                  >
                    {/* Render page elements */}
                    {currentPageElements.map((element) => (
                      <div
                        key={element.id}
                        className={`absolute group select-none ${
                          activeElement === element.id ? 'ring-2 ring-teal-500 ring-offset-1' : ''
                        } ${isMovingElement && draggedElement === element.id ? 'cursor-grabbing' : 'cursor-move'}`}
                        style={{
                          left: element.position.x,
                          top: element.position.y,
                          width: `${element.size.width}px`,
                          height: `${element.size.height}px`,
                          zIndex: activeElement === element.id ? 20 : 10
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveElement(element.id);
                        }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                      >
                        {/* Element content */}
                        {(element.type === 'signature' || element.type === 'initials') && (
                          <img
                            src={element.content}
                            alt={element.type}
                            className="w-full h-full object-contain pointer-events-none"
                            draggable={false}
                          />
                        )}
                        
                        {element.type === 'text' && (
                          <textarea
                            value={element.content}
                            onChange={(e) => updateElementContent(element.id, e.target.value)}
                            placeholder="Enter text here"
                            className="w-full h-full p-2 border border-gray-300 rounded text-sm resize-none bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            style={{ minHeight: 'auto' }}
                          />
                        )}
                        
                        {element.type === 'date' && (
                          <input
                            type="date"
                            value={element.content}
                            onChange={(e) => updateElementContent(element.id, e.target.value)}
                            className="w-full h-full p-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        )}

                        {element.type === 'checkbox' && (
                          <div 
                            className="w-full h-full flex items-center justify-center cursor-pointer select-none border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateElementContent(element.id, !element.content);
                            }}
                            style={{
                              fontSize: `${Math.min(element.size.width, element.size.height) * 0.7}px`,
                              color: element.content ? '#22c55e' : 'transparent'
                            }}
                          >
                            ✓
                          </div>
                        )}

                        {/* Resize handles - only show for active element */}
                        {activeElement === element.id && (
                          <>
                            {/* Corner handles */}
                            <div
                              className="resize-handle absolute -top-1 -left-1 w-3 h-3 bg-teal-500 border border-white rounded-full cursor-nw-resize"
                              onMouseDown={(e) => handleResizeStart(e, element.id, 'nw')}
                            />
                            <div
                              className="resize-handle absolute -top-1 -right-1 w-3 h-3 bg-teal-500 border border-white rounded-full cursor-ne-resize"
                              onMouseDown={(e) => handleResizeStart(e, element.id, 'ne')}
                            />
                            <div
                              className="resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-teal-500 border border-white rounded-full cursor-sw-resize"
                              onMouseDown={(e) => handleResizeStart(e, element.id, 'sw')}
                            />
                            <div
                              className="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-teal-500 border border-white rounded-full cursor-se-resize"
                              onMouseDown={(e) => handleResizeStart(e, element.id, 'se')}
                            />
                            
                            {/* Edge handles */}
                            <div
                              className="resize-handle absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-teal-500 border border-white rounded-full cursor-n-resize"
                              onMouseDown={(e) => handleResizeStart(e, element.id, 'n')}
                            />
                            <div
                              className="resize-handle absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-teal-500 border border-white rounded-full cursor-s-resize"
                              onMouseDown={(e) => handleResizeStart(e, element.id, 's')}
                            />
                            <div
                              className="resize-handle absolute top-1/2 -left-1 transform -translate-y-1/2 w-3 h-3 bg-teal-500 border border-white rounded-full cursor-w-resize"
                              onMouseDown={(e) => handleResizeStart(e, element.id, 'w')}
                            />
                            <div
                              className="resize-handle absolute top-1/2 -right-1 transform -translate-y-1/2 w-3 h-3 bg-teal-500 border border-white rounded-full cursor-e-resize"
                              onMouseDown={(e) => handleResizeStart(e, element.id, 'e')}
                            />
                          </>
                        )}

                        {/* Element controls */}
                        <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-lg p-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteElement(element.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Drop indicator */}
                  <div
                    ref={dropIndicatorRef}
                    className="absolute w-2 h-2 bg-teal-600 rounded-full opacity-0 transition-opacity animate-pulse pointer-events-none"
                    style={{ zIndex: 1000 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar - Signing options */}
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Sidebar header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Signing options</h2>
            </div>

            {/* Simple Signature type selector */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Type</h3>
              <div className="border-2 border-teal-500 rounded-lg p-3 bg-teal-50">
                <div className="flex items-center justify-center mb-2">
                  <Pen className="w-5 h-5 text-teal-600" />
                </div>
                <div className="text-center text-sm font-medium text-teal-600">
                  Simple Signature
                </div>
              </div>
            </div>

            {/* Optional fields */}
            <div className="px-6 py-4 flex-1">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Optional fields</h3>
              
              <div className="space-y-3">
                {/* Signature */}
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'signature')}
                  onDragEnd={handleDragEnd}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-teal-100 rounded flex items-center justify-center">
                    <Pen className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Signature</div>
                    <div className="text-lg font-handwriting text-gray-800">
                      {userInfo.name}
                    </div>
                  </div>
                </div>

                {/* Initials */}
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'initials')}
                  onDragEnd={handleDragEnd}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Initials</div>
                    <div className="text-lg font-bold text-gray-800">
                      {userInfo.initials}
                    </div>
                  </div>
                </div>

                {/* Date field */}
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'date')}
                  onDragEnd={handleDragEnd}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-sm text-gray-600">Date</div>
                </div>

                {/* Text field */}
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'text')}
                  onDragEnd={handleDragEnd}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                    <Type className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-sm text-gray-600">Text</div>
                </div>

                {/* Checkbox field */}
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'checkbox')}
                  onDragEnd={handleDragEnd}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-sm text-gray-600">Checkbox</div>
                </div>
              </div>
            </div>

            {/* Sign button */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={completeSignature}
                disabled={isProcessing}
                                        className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-3 px-4 rounded-lg font-medium text-lg transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Signature className="w-5 h-5 mr-2" />
                )}
                Sign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFSignatureTool;