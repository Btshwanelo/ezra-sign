import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../api/axios";

// Get all documents for the user
export const getDocuments = createAsyncThunk(
  "documents/getDocuments",
  async (status, { rejectWithValue }) => {
    try {
      const url = status ? `/documents?status=${status}` : "/documents";
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch documents"
      );
    }
  }
);

// Get a single document by ID
export const getDocument = createAsyncThunk(
  "documents/getDocument",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/documents/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch document"
      );
    }
  }
);

// Upload a document
export const uploadDocument = createAsyncThunk(
  "documents/uploadDocument",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to upload document"
      );
    }
  }
);

// Delete a document
export const deleteDocument = createAsyncThunk(
  "documents/deleteDocument",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/documents/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete document"
      );
    }
  }
);

// Add fields to a document
export const addFields = createAsyncThunk(
  "documents/addFields",
  async ({ id, recipients }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/documents/${id}/fields`, {
        recipients,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add fields"
      );
    }
  }
);

// Send document to recipients
export const sendDocument = createAsyncThunk(
  "documents/sendDocument",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/documents/${id}/send`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send document"
      );
    }
  }
);

// Sign a document
export const signDocument = createAsyncThunk(
  "documents/signDocument",
  async ({ id, email, fields }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/documents/${id}/sign`, {
        email,
        fields,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to sign document"
      );
    }
  }
);

// Update document recipients
export const updateDocumentRecipients = createAsyncThunk(
  "documents/updateDocumentRecipients",
  async ({ documentId, recipients, sendEmails }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/documents/${documentId}/recipients`, {
        recipients,
        sendEmails,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update recipients"
      );
    }
  }
);

// Get a document for signing
export const getDocumentForSigning = createAsyncThunk(
  "documents/getDocumentForSigning",
  async ({ documentId, token, email }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/documents/signing/${documentId}/${token}/${email}`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch document"
      );
    }
  }
);

const initialState = {
  documents: [],
  currentDocument: null,
  selectedDocument: null,
  loading: false,
  error: null,
  success: null,
};

const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    clearDocumentErrors: (state) => {
      state.error = null;
    },
    clearDocumentSuccess: (state) => {
      state.success = null;
    },
    clearSelectedDocument: (state) => {
      state.selectedDocument = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Documents
      .addCase(getDocuments.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload;
      })
      .addCase(getDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Single Document
      .addCase(getDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDocument = action.payload;
        state.selectedDocument = action.payload;
      })
      .addCase(getDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentDocument = null;
        state.selectedDocument = null;
      })
      // Upload Document
      .addCase(uploadDocument.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.success = "Document uploaded successfully";
        // Don't add to documents array here, will fetch updated list
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Document
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = state.documents.filter(
          (doc) => doc._id !== action.payload
        );
        state.success = "Document deleted successfully";
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Fields
      .addCase(addFields.pending, (state) => {
        state.loading = true;
      })
      .addCase(addFields.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDocument = action.payload;
        state.success = "Fields added successfully";
      })
      .addCase(addFields.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send Document
      .addCase(sendDocument.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendDocument.fulfilled, (state) => {
        state.loading = false;
        state.success = "Document sent successfully";
      })
      .addCase(sendDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Sign Document
      .addCase(signDocument.pending, (state) => {
        state.loading = true;
      })
      .addCase(signDocument.fulfilled, (state) => {
        state.loading = false;
        state.success = "Document signed successfully";
      })
      .addCase(signDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Document Recipients
      .addCase(updateDocumentRecipients.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDocumentRecipients.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDocument = action.payload;
        state.success = "Recipients updated successfully";
      })
      .addCase(updateDocumentRecipients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Document For Signing
      .addCase(getDocumentForSigning.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDocumentForSigning.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDocument = action.payload;
      })
      .addCase(getDocumentForSigning.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearDocumentErrors,
  clearDocumentSuccess,
  clearSelectedDocument,
} = documentsSlice.actions;
export default documentsSlice.reducer;
