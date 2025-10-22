import React from 'react'
import { FiHome } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const TemplateSuccess = () => {
  return (
    <div className="flex flex-col items-center h-full justify-center bg-gray-50 px-4">
          <div className="text-center">
            {/* <h2 className="text-3xl font-bold mt-4 mb-8">Success</h2> */}
            <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">
              Your template has been successfully updated.
            </p>
            <Link to="/templates" className="btn-primary inline-flex items-center px-6 py-3">
              <FiHome className="mr-2" />
              View Templates
            </Link>
          </div>
        </div>
  )
}

export default TemplateSuccess