import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiSettings,
  FiUsers,
  FiCreditCard,
  FiKey,
  FiGlobe,
  FiClock,
  FiBell,
  FiShield,
  FiUserPlus
} from "react-icons/fi";
import ApiKeyManagement from "../components/admin/ApiKeyManagement";
import WebhookManagement from "../components/admin/WebhookManagement";

const ProfileSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
    .required("Confirm password is required"),
});

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [notifications, setNotifications] = useState({
    documentCompleted: true,
    documentViewed: true,
    signingStarted: true,
  });

  const togglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field],
    });
  };

  const handleNotificationChange = (type) => {
    setNotifications({
      ...notifications,
      [type]: !notifications[type],
    });
  };

  const handleProfileUpdate = (values) => {
    console.log("Update profile:", values);
    // dispatch(updateProfile(values));
  };

  const handlePasswordChange = (values) => {
    console.log("Change password:", values);
    // dispatch(changePassword(values));
  };

  const sidebarItems = [
    { id: "workspace", label: "Workspace", icon: FiSettings },
    { id: "profile", label: "Profile", icon: FiUser },
    { id: "branding", label: "Branding", icon: FiGlobe },
    { id: "team", label: "Team Members", icon: FiUsers },
    { id: "teams", label: "Teams", icon: FiUserPlus },
    { id: "integrations", label: "Integrations", icon: FiKey },
    { id: "billing", label: "Plans and Billing", icon: FiCreditCard },
    { id: "api-keys", label: "API Keys", icon: FiKey },
    { id: "webhooks", label: "Webhooks", icon: FiGlobe },
    { id: "api", label: "API", icon: FiShield },
  ];

  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center py-16">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="py-6">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <FiSettings className="w-4 h-4" />
              <span>SETTINGS</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Your Profile</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <nav className="space-y-1 p-4">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === item.id
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                {activeTab === "profile" && (
                  <div className="space-y-8">
                    {/* Personal Information */}
                    <Formik
                      initialValues={{
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                        email: user.email || "",
                        language: "English",
                        timezone: "(GMT+02:00) South Africa Standard Time",
                      }}
                      validationSchema={ProfileSchema}
                      onSubmit={handleProfileUpdate}
                    >
                      {({ errors, touched, isSubmitting }) => (
                        <Form className="space-y-6">
                          <div>
                            <label
                              htmlFor="name"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Your Name
                            </label>
                            <Field
                              id="name"
                              name="firstName"
                              type="text"
                              className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="Enter your full name"
                            />
                            <ErrorMessage
                              name="firstName"
                              component="p"
                              className="mt-1 text-xs text-red-500"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Your Email
                            </label>
                            <Field
                              id="email"
                              name="email"
                              type="email"
                              className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="Enter your email"
                            />
                            <ErrorMessage
                              name="email"
                              component="p"
                              className="mt-1 text-xs text-red-500"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="language"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Recipient Language
                            </label>
                            <Field
                              as="select"
                              id="language"
                              name="language"
                              className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                              <option value="English">English</option>
                              <option value="Spanish">Spanish</option>
                              <option value="French">French</option>
                              <option value="German">German</option>
                            </Field>
                          </div>

                          <div>
                            <label
                              htmlFor="timezone"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Time Zone
                            </label>
                            <Field
                              as="select"
                              id="timezone"
                              name="timezone"
                              className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                              <option value="(GMT+02:00) South Africa Standard Time">
                                (GMT+02:00) South Africa Standard Time
                              </option>
                              <option value="(GMT+00:00) UTC">
                                (GMT+00:00) UTC
                              </option>
                              <option value="(GMT-05:00) Eastern Time">
                                (GMT-05:00) Eastern Time
                              </option>
                              <option value="(GMT-08:00) Pacific Time">
                                (GMT-08:00) Pacific Time
                              </option>
                            </Field>
                          </div>

                          {/* Password Section */}
                          <div className="border-t border-gray-200 pt-6">
                            <div className="mb-4">
                              <p className="text-sm text-gray-600">
                                Hey! You haven't set a password for your account. You can set
                                one so you can log in either with your Google Account or with
                                your email (the one above) and your password. If you don't want
                                to set your password for now you can just leave the password
                                field empty and fill it later.
                              </p>
                            </div>
                            
                            <div>
                              <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Your Password (at least 8 characters, 1 uppercase and 1 special character)
                              </label>
                              <div className="relative">
                                <Field
                                  id="password"
                                  name="password"
                                  type={showPassword.new ? "text" : "password"}
                                  className="w-full py-2 px-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  placeholder="Enter new password"
                                />
                                <button
                                  type="button"
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                                  onClick={() => togglePasswordVisibility("new")}
                                >
                                  {showPassword.new ? (
                                    <FiEyeOff className="h-4 w-4" />
                                  ) : (
                                    <FiEye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Transfer Ownership */}
                          <div className="border-t border-gray-200 pt-6">
                            <button
                              type="button"
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Transfer ownership
                            </button>
                          </div>

                          {/* Notifications Section */}
                          <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-4">
                              Send a Notification
                            </h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  When a Document I Sent Is Completed
                                </span>
                                <div className="flex items-center">
                                  <span className="mr-2 text-xs font-medium text-blue-600">
                                    YES
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationChange("documentCompleted")}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                      notifications.documentCompleted ? "bg-blue-600" : "bg-gray-200"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        notifications.documentCompleted ? "translate-x-4" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  When a Document I Sent Is Viewed
                                </span>
                                <div className="flex items-center">
                                  <span className="mr-2 text-xs font-medium text-blue-600">
                                    YES
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationChange("documentViewed")}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                      notifications.documentViewed ? "bg-blue-600" : "bg-gray-200"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        notifications.documentViewed ? "translate-x-4" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  When Ordered Signing Has Started
                                </span>
                                <div className="flex items-center">
                                  <span className="mr-2 text-xs font-medium text-blue-600">
                                    YES
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationChange("signingStarted")}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                      notifications.signingStarted ? "bg-blue-600" : "bg-gray-200"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        notifications.signingStarted ? "translate-x-4" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-6">
                            <button
                              type="submit"
                              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </Form>
                      )}
                    </Formik>
                  </div>
                )}

                {activeTab === "api-keys" && <ApiKeyManagement />}

                {activeTab === "webhooks" && <WebhookManagement />}

                {activeTab === "workspace" && (
                  <div className="text-center py-12">
                    <FiSettings className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Workspace Settings</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Configure your workspace preferences and settings.
                    </p>
                  </div>
                )}

                {activeTab === "branding" && (
                  <div className="text-center py-12">
                    <FiGlobe className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Branding</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Customize your brand appearance and styling.
                    </p>
                  </div>
                )}

                {activeTab === "team" && (
                  <div className="text-center py-12">
                    <FiUsers className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Team Members</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Manage your team members and their permissions.
                    </p>
                  </div>
                )}

                {activeTab === "teams" && (
                  <div className="text-center py-12">
                    <FiUserPlus className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Teams</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Create and manage teams within your organization.
                    </p>
                  </div>
                )}

                {activeTab === "integrations" && (
                  <div className="text-center py-12">
                    <FiKey className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Integrations</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Connect with third-party services and tools.
                    </p>
                  </div>
                )}

                {activeTab === "billing" && (
                  <div className="text-center py-12">
                    <FiCreditCard className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Plans and Billing</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Manage your subscription and billing information.
                    </p>
                  </div>
                )}

                {activeTab === "api" && (
                  <div className="text-center py-12">
                    <FiShield className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">API</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Access API keys and developer documentation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;