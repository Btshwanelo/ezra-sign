import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import SignaturePad from 'react-signature-canvas';
import { toast } from 'react-toastify';

const DocumentSigning = () => {
  const { documentId, token, email } = useParams();
  const navigate = useNavigate();
  const { fetchDocumentForSigning, submitSignature, loading, error } = useDocument();
  const [document, setDocument] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [signature, setSignature] = useState(null);
  const signaturePadRef = React.useRef();

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const doc = await fetchDocumentForSigning(documentId, token, email);
        setDocument(doc);
        
        // Initialize field values
        const initialValues = {};
        doc.fields.forEach(field => {
          if (field.type === 'checkbox_group') {
            initialValues[field._id] = { selectedOptions: [] };
          } else {
            initialValues[field._id] = { value: '' };
          }
        });
        setFieldValues(initialValues);
      } catch (err) {
        toast.error(err.message || 'Error loading document');
        navigate('/');
      }
    };

    loadDocument();
  }, [documentId, token, email, fetchDocumentForSigning, navigate]);

  const handleFieldChange = (fieldId, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: { value }
    }));
  };

  const handleCheckboxChange = (fieldId, optionValue) => {
    setFieldValues(prev => {
      const currentOptions = prev[fieldId].selectedOptions || [];
      const newOptions = currentOptions.includes(optionValue)
        ? currentOptions.filter(v => v !== optionValue)
        : [...currentOptions, optionValue];
      
      return {
        ...prev,
        [fieldId]: { selectedOptions: newOptions }
      };
    });
  };

  const handleClearSignature = () => {
    signaturePadRef.current.clear();
    setSignature(null);
  };

  const handleSaveSignature = () => {
    const signatureData = signaturePadRef.current.toDataURL();
    setSignature(signatureData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Convert fieldValues to array format
      const fieldValuesArray = Object.entries(fieldValues).map(([fieldId, value]) => ({
        fieldId,
        ...value
      }));

      await submitSignature(documentId, token, email, {
        fieldValues: fieldValuesArray,
        signature
      });

      toast.success('Document signed successfully!');
      navigate('/signing-success');
    } catch (err) {
      toast.error(err.message || 'Error submitting signature');
    }
  };

  if (loading) {
    return <div className="loading">Loading document...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!document) {
    return null;
  }

  return (
    <div className="document-signing">
      <h1>{document.title}</h1>
      
      <form onSubmit={handleSubmit}>
        {document.fields.map(field => (
          <div key={field._id} className="field-container">
            <label>{field.label || field.type}</label>
            
            {field.type === 'signature' ? (
              <div className="signature-container">
                <SignaturePad
                  ref={signaturePadRef}
                  canvasProps={{
                    className: 'signature-canvas',
                    width: field.width,
                    height: field.height
                  }}
                />
                <div className="signature-buttons">
                  <button type="button" onClick={handleClearSignature}>
                    Clear
                  </button>
                  <button type="button" onClick={handleSaveSignature}>
                    Save Signature
                  </button>
                </div>
                {signature && (
                  <div className="signature-preview">
                    <img src={signature} alt="Signature preview" />
                  </div>
                )}
              </div>
            ) : field.type === 'checkbox_group' ? (
              <div className="checkbox-group">
                {field.checkboxGroup.options.map(option => (
                  <label key={option.value} className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={fieldValues[field._id]?.selectedOptions?.includes(option.value)}
                      onChange={() => handleCheckboxChange(field._id, option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            ) : (
              <input
                type={field.type === 'date' ? 'date' : 'text'}
                value={fieldValues[field._id]?.value || ''}
                onChange={(e) => handleFieldChange(field._id, e.target.value)}
                required={field.required}
              />
            )}
          </div>
        ))}

        <button type="submit" disabled={!signature || loading}>
          {loading ? 'Submitting...' : 'Submit Signature'}
        </button>
      </form>
    </div>
  );
};

export default DocumentSigning; 