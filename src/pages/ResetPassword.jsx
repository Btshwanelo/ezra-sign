import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  resetPassword,
  clearError,
  clearSuccess,
} from "../redux/slices/authSlice";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm password is required"),
});

const ResetPassword = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Clear errors and success when component mounts
    dispatch(clearError());
    dispatch(clearSuccess());
  }, [dispatch]);

  // Redirect to login after successful password reset
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = (values) => {
    dispatch(resetPassword({ token, password: values.password }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Reset Password
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Your password has been reset successfully. You will be
                  redirected to the login page.
                </p>
              </div>
            </div>
          </div>
        )}

        {!success && (
          <Formik
            initialValues={{ password: "", confirmPassword: "" }}
            validationSchema={ResetPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form className="mt-8 space-y-6">
                <div className="rounded-md shadow-sm space-y-4">
                  <div>
                    <label htmlFor="password" className="form-label">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        className={`form-input pl-10 ${
                          errors.password && touched.password
                            ? "border-red-500"
                            : ""
                        }`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <FiEyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <FiEye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <ErrorMessage
                      name="password"
                      component="p"
                      className="form-error"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        className={`form-input pl-10 ${
                          errors.confirmPassword && touched.confirmPassword
                            ? "border-red-500"
                            : ""
                        }`}
                        placeholder="Confirm new password"
                      />
                    </div>
                    <ErrorMessage
                      name="confirmPassword"
                      component="p"
                      className="form-error"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="group relative w-full flex justify-center btn-primary py-2.5"
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>

                <div className="text-center">
                  <Link
                    to="/auth/login"
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Back to login
                  </Link>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
