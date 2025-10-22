import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  forgotPassword,
  clearError,
  clearSuccess,
} from "../redux/slices/authSlice";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FiMail } from "react-icons/fi";

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

  useEffect(() => {
    // Clear errors and success when component mounts
    dispatch(clearError());
    dispatch(clearSuccess());
  }, [dispatch]);

  const handleSubmit = (values) => {
    dispatch(forgotPassword(values.email));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Forgot Password
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your
            password
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
                  Password reset link sent to your email address. Please check
                  your inbox.
                </p>
              </div>
            </div>
          </div>
        )}

        <Formik
          initialValues={{ email: "" }}
          validationSchema={ForgotPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form className="mt-8 space-y-6">
              <div>
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                     className={`w-full py-2 pl-10 pr-3 border ${
                      errors.email && touched.email ? "border-red-400" : "border-slate-200"
                    } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                    placeholder="you@example.com"
                  />
                </div>
                <ErrorMessage
                  name="email"
                  component="p"
                  className="form-error"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center btn-primary py-2.5"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>

              <div className="flex items-center justify-center">
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
      </div>
    </div>
  );
};

export default ForgotPassword;
