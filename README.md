# Ezra Sign Clone - Frontend

This is the frontend application for the Ezra Sign Clone platform, built with React and Vite.

## Features

- User authentication (login, register, password reset)
- Document management (upload, view, edit, delete, download)
- E-signature functionality (add fields, send, sign)
- Template management
- Dashboard with document status tracking
- Responsive design

## Tech Stack

- React.js
- Redux Toolkit for state management
- React Router for navigation
- Formik + Yup for form validation
- Tailwind CSS for styling
- PDF.js for document rendering and interaction
- Axios for API communication

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Backend API running (see `/server` directory)

### Installation

1. Navigate to the client directory:

   ```
   cd docusign-clone/client
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

### Development

Start the development server:

```
npm run dev
```

The application will be available at http://localhost:3000.

### Building for Production

Build the application:

```
npm run build
```

Preview the production build locally:

```
npm run preview
```

## Project Structure

```
client/
├── public/                # Static assets
├── src/
│   ├── api/               # API client and interceptors
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page components
│   ├── redux/             # Redux store, slices, and actions
│   ├── styles/            # Global styles and Tailwind config
│   ├── utils/             # Helper functions
│   ├── App.jsx            # Main App component with routes
│   └── main.jsx           # Entry point
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
└── vite.config.js         # Vite configuration
```

## Key Features Implemented

1. **Authentication**

   - Login/Register
   - JWT authentication
   - Password reset

2. **Document Management**

   - Upload documents
   - List documents with filters
   - Delete documents

3. **E-Signature Workflow**
   - Add signature fields
   - Recipient management
   - Document signing
4. **Templates**
   - Create reusable templates
   - Use templates to create new documents

## License

This project is licensed under the MIT License.
