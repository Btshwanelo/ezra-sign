import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  FiHome, 
  FiFileText, 
  FiCopy, 
  FiUser, 
  FiX, 
  FiMenu, 
  FiChevronLeft, 
  FiChevronRight,
  FiHelpCircle,
  FiSettings
} from "react-icons/fi";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [minimized, setMinimized] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'user';

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  const navItems = [
    { name: "Dashboard", icon: <FiHome size={18} />, path: "/dashboard" },
    {
      name: "Documents",
      icon: <FiFileText size={18} />,
      path: "/documents",
    },
    { name: "Templates", icon: <FiCopy size={18} />, path: "/templates" },
    { name: "Profile", icon: <FiUser size={18} />, path: "/profile" },
  ];

  // Add admin navigation item if user is admin
  if (isAdmin) {
    navItems.push({
      name: "Admin",
      icon: <FiSettings size={18} />,
      path: "/admin",
    });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900 bg-opacity-50 transition-opacity lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 bg-white shadow-sm transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${minimized ? "lg:w-16" : "lg:w-64"} w-64`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          {!minimized && (
            <div className="text-lg font-medium text-blue-600">
              Ezra Sign
            </div>
          )}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="text-slate-500 hover:text-slate-700 transition-colors lg:hidden"
            >
              <FiX size={20} />
            </button>
            <button
              onClick={toggleMinimize}
              className="text-slate-500 hover:text-slate-700 transition-colors hidden lg:block ml-auto"
            >
              {minimized ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
            </button>
          </div>
        </div>

        <nav className="mt-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    } ${minimized ? "justify-center" : ""}`
                  }
                  title={minimized ? item.name : ""}
                >
                  <span className={minimized ? "" : "mr-3"}>{item.icon}</span>
                  {!minimized && <span>{item.name}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {!minimized && (
          <div className="absolute bottom-0 w-full p-4 border-t border-slate-200">
            <div className="bg-slate-50 rounded-md p-3 text-center text-sm">
              <p className="font-medium text-slate-700 mb-1">Need Help?</p>
              <p className="text-slate-500 mb-2 text-xs">
                Check our documentation for assistance.
              </p>
              <a
                href="#"
                className="text-blue-600 text-xs font-medium hover:text-blue-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Documentation
              </a>
            </div>
          </div>
        )}
        
        {minimized && (
          <div className="absolute bottom-0 w-full p-2 border-t border-slate-200">
            <div className="flex justify-center p-2">
              <a
                href="#"
                className="text-slate-500 hover:text-blue-600 transition-colors"
                title="Help & Documentation"
              >
                <FiHelpCircle size={20} />
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;