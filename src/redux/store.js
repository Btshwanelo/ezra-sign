import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import documentsReducer from "./slices/documentsSlice";
import templatesReducer from "./slices/templatesSlice";
import dashboardReducer from "./slices/dashboardSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentsReducer,
    templates: templatesReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
