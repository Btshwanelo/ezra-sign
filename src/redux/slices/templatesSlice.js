import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../api/axios";

// Get all templates for the user
export const getTemplates = createAsyncThunk(
  "templates/getTemplates",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/templates");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch templates"
      );
    }
  }
);

// Get a single template by ID
export const getTemplate = createAsyncThunk(
  "templates/getTemplate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/templates/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch template"
      );
    }
  }
);

// Create a template
export const createTemplate = createAsyncThunk(
  "templates/createTemplate",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/templates", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create template"
      );
    }
  }
);

// Update a template
export const updateTemplate = createAsyncThunk(
  "templates/updateTemplate",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/templates/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update template"
      );
    }
  }
);

// Delete a template
export const deleteTemplate = createAsyncThunk(
  "templates/deleteTemplate",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/templates/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete template"
      );
    }
  }
);

// Create document from template
export const createDocumentFromTemplate = createAsyncThunk(
  "templates/createDocumentFromTemplate",
  async ({ id, title, recipients }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/templates/${id}/create-document`, {
        title,
        recipients
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create document from template"
      );
    }
  }
);

const initialState = {
  templates: [],
  selectedTemplate: null,
  loading: false,
  error: null,
  success: null,
};

const templatesSlice = createSlice({
  name: "templates",
  initialState,
  reducers: {
    clearTemplateErrors: (state) => {
      state.error = null;
    },
    clearTemplateSuccess: (state) => {
      state.success = null;
    },
    clearSelectedTemplate: (state) => {
      state.selectedTemplate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Templates
      .addCase(getTemplates.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(getTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Single Template
      .addCase(getTemplate.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTemplate = action.payload;
      })
      .addCase(getTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Template
      .addCase(createTemplate.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTemplate.fulfilled, (state) => {
        state.loading = false;
        state.success = "Template created successfully";
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Template
      .addCase(updateTemplate.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTemplate = action.payload;
        state.success = "Template updated successfully";
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Template
      .addCase(deleteTemplate.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = state.templates.filter(
          (template) => template._id !== action.payload
        );
        state.success = "Template deleted successfully";
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Document From Template
      .addCase(createDocumentFromTemplate.pending, (state) => {
        state.loading = true;
      })
      .addCase(createDocumentFromTemplate.fulfilled, (state) => {
        state.loading = false;
        state.success = "Document created from template successfully";
      })
      .addCase(createDocumentFromTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearTemplateErrors,
  clearTemplateSuccess,
  clearSelectedTemplate,
} = templatesSlice.actions;
export default templatesSlice.reducer;
