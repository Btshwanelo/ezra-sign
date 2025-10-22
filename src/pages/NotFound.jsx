import { Link } from "react-router-dom";
import { FiHome } from "react-icons/fi";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-3xl font-bold mt-4 mb-8">Page Not Found</h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center px-6 py-3">
          <FiHome className="mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
