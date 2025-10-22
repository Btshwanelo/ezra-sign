import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { checkAuth } from "./redux/slices/authSlice";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DocumentEditor from "./pages/DocumentEditor";
import SigningPage from "./pages/SigningPage";
import Templates from "./pages/Templates";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import DocumentRecipients from "./pages/DocumentRecipients";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Documents from "./pages/Documents";
import TemplateSuccess from "./pages/TemplateSuccess";
import AdminDashboard from "./pages/AdminDashboard";
import TemplateEdit from "./pages/TemplateEdit";
import PDFSignatureTool from "./pages/OpenSigning";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div class="loading-spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/auth/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/auth/register"
        element={isAuthenticated ? <Navigate to="/" /> : <Register />}
      />
      <Route
        path="/open-sign"
        element={<PDFSignatureTool /> }
      />
      <Route
        path="/auth/forgot-password"
        element={isAuthenticated ? <Navigate to="/" /> : <ForgotPassword />}
      />
      <Route
        path="/auth/reset-password/:token"
        element={isAuthenticated ? <Navigate to="/" /> : <ResetPassword />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />{" "}
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="documents/:id" element={<DocumentEditor />} />
        <Route
          path="documents/:id/recipients"
          element={<DocumentRecipients />}
        />
        <Route path="templates" element={<Templates />} />
        <Route path="templates/:id" element={<TemplateEdit />} />
        <Route
          path="/template-create/success/:id"
          element={<TemplateSuccess />}
        />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
