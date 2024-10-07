import React, { Component } from "react";

class Contact extends Component {
  render() {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <h3 className="text-3xl font-semibold text-blue-600 mb-4">SPA App - Contact</h3>
        <p className="text-gray-700 mb-6">
          Please feel free to contact us with any questions or inquiries you may have. We are always happy to help!
        </p>
        <h4 className="text-2xl font-semibold mb-4">Contact Details:</h4>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>
            <strong>Email:</strong> info@example.com
          </li>
          <li>
            <strong>Phone:</strong> 1-800-555-1234
          </li>
          <li>
            <strong>Address:</strong> 123 Main St, Anytown USA
          </li>
        </ul>
      </div>
    );
  }
}

export default Contact;
