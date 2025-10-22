import { Outlet } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../redux/slices/authSlice";
import { NavLink } from "react-router-dom";
import { 
  FiHome, 
  FiFileText, 
  FiCopy, 
  FiSend,
  FiUsers,
  FiBell, 
  FiUser, 
  FiLogOut, 
  FiSettings,
  FiSearch,
  FiPlus
} from "react-icons/fi";

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navItems = [
    { name: "Documents", icon: <FiFileText size={16} />, path: "/documents" },
    { name: "Templates", icon: <FiCopy size={16} />, path: "/templates" },
    // { name: "Bulk Sending", icon: <FiSend size={16} />, path: "/bulk-sending" },
    // { name: "Contacts", icon: <FiUsers size={16} />, path: "/contacts" },
  ];

  return (
    <nav className="bg-blue-600 text-white ">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center">
              <div className="text-xl font-bold">Ezra Sign</div>
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-700 text-white"
                        : "text-blue-100 hover:bg-blue-700 hover:text-white"
                    }`
                  }
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right side - Search, Actions, User Menu */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            {/* <div className="hidden lg:flex items-center">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  className="block w-64 pl-10 pr-3 py-2 border-0 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-25 text-sm"
                />
              </div>
            </div> */}

            {/* New Document Button */}
            {/* <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center">
              <FiPlus className="mr-2" size={16} />
              <span className="hidden sm:inline">New Document</span>
            </button> */}

            {/* Upgrade Button */}
            {/* <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-400 transition-colors">
              Upgrade
            </button> */}

            {/* Notifications */}
            <button className="text-blue-100 hover:text-white focus:outline-none relative">
              <FiBell size={20} />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            {/* Settings */}
            <button className="text-blue-100 hover:text-white focus:outline-none">
              <FiSettings size={20} />
            </button>

            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none bg-blue-700 rounded-full p-1 hover:bg-blue-800 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-xl z-20 border">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FiUser className="mr-2" size={16} />
                    Profile
                  </Link>
                  
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FiSettings className="mr-2" size={16} />
                      Admin
                    </Link>
                  )}
                  
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      <FiLogOut className="mr-2" size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="md:hidden pb-4">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-700 text-white"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};