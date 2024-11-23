import React, { useState } from 'react';

type ChangeDetailsProps = {
  userId: number;
  user: {
    displayName: string;
    username: string;
    email: string;
  };
  onSave: (updatedUser: { displayName: string; username: string; email: string }) => void;
  onCancel: () => void;
};

const ChangeDetails: React.FC<ChangeDetailsProps> = ({ userId, user, onSave, onCancel }) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Check if all fields are filled
      if (!displayName || !username || !email) {
        setError("All fields are required.");
        return;
      }

      // Prepare data for the PUT request
      const updatedDetails = { displayName, username, email };

      // Send the PUT request to update user details
      const response = await fetch(`http://localhost:8000/users/${userId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedDetails),
      });

      if (!response.ok) {
        throw new Error("Failed to update user details.");
      }

      // Notify the parent component about the successful update
      onSave(updatedDetails);
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="change-details-container">
      <h3 className="text-center">Change Details</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="displayName" className="form-label">Display Name</label>
          <input
            type="text"
            className="form-control"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="d-flex justify-content-between">
          <button type="submit" className="btn btn-success">Save</button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default ChangeDetails;
