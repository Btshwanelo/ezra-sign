import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearError } from "../redux/slices/authSlice";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FiLock, FiMail, FiUser, FiEye, FiEyeOff } from "react-icons/fi";

const RegisterSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm password is required"),
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = (values) => {
    const { firstName, lastName, email, password } = values;
    dispatch(registerUser({ firstName, lastName, email, password }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field],
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md px-6 py-8 bg-white rounded-lg shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-slate-800 text-center">
            Create account
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            Sign up to start using Ezra Sign
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border-l-3 border-red-400 text-sm text-red-600">
            {error}
          </div>
        )}

        <Formik
          initialValues={{
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    First name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-4 w-4 text-slate-400" />
                    </div>
                    <Field
                      id="firstName"
                      name="firstName"
                      type="text"
                      className={`w-full py-2 pl-10 pr-3 border ${
                        errors.firstName && touched.firstName
                          ? "border-red-400"
                          : "border-slate-200"
                      } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                      placeholder="First name"
                    />
                  </div>
                  <ErrorMessage
                    name="firstName"
                    component="p"
                    className="mt-1 text-xs text-red-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Last name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-4 w-4 text-slate-400" />
                    </div>
                    <Field
                      id="lastName"
                      name="lastName"
                      type="text"
                      className={`w-full py-2 pl-10 pr-3 border ${
                        errors.lastName && touched.lastName
                          ? "border-red-400"
                          : "border-slate-200"
                      } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                      placeholder="Last name"
                    />
                  </div>
                  <ErrorMessage
                    name="lastName"
                    component="p"
                    className="mt-1 text-xs text-red-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-4 w-4 text-slate-400" />
                  </div>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={`w-full py-2 pl-10 pr-3 border ${
                      errors.email && touched.email
                        ? "border-red-400"
                        : "border-slate-200"
                    } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                    placeholder="you@example.com"
                  />
                </div>
                <ErrorMessage
                  name="email"
                  component="p"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-slate-400" />
                  </div>
                  <Field
                    id="password"
                    name="password"
                    type={showPassword.password ? "text" : "password"}
                    className={`w-full py-2 pl-10 pr-10 border ${
                      errors.password && touched.password
                        ? "border-red-400"
                        : "border-slate-200"
                    } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-500"
                    onClick={() => togglePasswordVisibility("password")}
                  >
                    {showPassword.password ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <ErrorMessage
                  name="password"
                  component="p"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-slate-400" />
                  </div>
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword.confirmPassword ? "text" : "password"}
                    className={`w-full py-2 pl-10 pr-10 border ${
                      errors.confirmPassword && touched.confirmPassword
                        ? "border-red-400"
                        : "border-slate-200"
                    } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-500"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                  >
                    {showPassword.confirmPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <ErrorMessage
                  name="confirmPassword"
                  component="p"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

              <div className="text-center mt-4">
                <p className="text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    to="/auth/login"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Register;
