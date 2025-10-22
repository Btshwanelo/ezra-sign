import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../api/axios";

// Get dashboard data
export const getDashboardStats = createAsyncThunk(
  "dashboard/getDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("auth/dashboard");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard data"
      );
    }
  }
);

const initialState = {
  documentStats: {
    counts: {
      draft: 0,
      sent: 0,
      completed: 0,
      declined: 0,
      canceled: 0,
      total: 0
    },
    monthly: []
  },
  pendingSignatures: [],
  recentlyCompleted: [],
  expiringSoon: [],
  recentActivity: [],
  topTemplates: [],
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Dashboard Data
      .addCase(getDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.documentStats = action.payload.documentStats || initialState.documentStats;
        state.pendingSignatures = action.payload.pendingSignatures || [];
        state.recentlyCompleted = action.payload.recentlyCompleted || [];
        state.expiringSoon = action.payload.expiringSoon || [];
        state.recentActivity = action.payload.recentActivity || [];
        state.topTemplates = action.payload.topTemplates || [];
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboardErrors } = dashboardSlice.actions;
export default dashboardSlice.reducer;