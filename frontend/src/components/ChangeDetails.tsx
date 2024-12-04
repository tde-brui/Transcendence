import React, { useState } from "react";
import '../css/UserProfile.css';

interface ChangeDetailsProps {
  username: string;
  firstName: string;
  email: string;
  twoFactorEnabled: boolean;
  avatarUrl: string;
  onEditAvatar: () => void;
  onChangePassword: () => void;
  onSubmit: (updatedDetails: {
    username: string;
    firstName: string;
    email: string;
    twoFactorEnabled: boolean;
  }) => void;
}

const ChangeDetails: React.FC<ChangeDetailsProps> = ({
  username,
  firstName,
  email,
  twoFactorEnabled,
  avatarUrl,
  onEditAvatar,
  onChangePassword,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    username,
    firstName,
    email,
    twoFactorEnabled,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = () => {
    setFormData({ ...formData, twoFactorEnabled: !formData.twoFactorEnabled });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
	<div className="container d-flex align-items-center justify-content-center">
    <div className="card profile-card mt-4 ">
      <div className="profile-header d-flex flex-column align-items-center p-3">
        <img
          src={avatarUrl}
          alt="Avatar"
          className="rounded-circle"
          style={{ width: "100px", height: "100px", objectFit: "cover" }}
        />
        <button
          className="btn btn-primary mt-3"
          onClick={onEditAvatar}
        >
          Edit
        </button>
      </div>
      <div className="profile-body p-4">
        <h2 className="mb-4">Change Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="d-flex flex-column mb-3">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              className="form-control"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          <div className="d-flex flex-column mb-3">
            <label htmlFor="firstName" className="form-label">
              First Name
            </label>
            <input
              type="text"
              className="form-control"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
          <div className="d-flex flex-column mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="d-flex justify-content-center mb-3 form-check form-switch custom-form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              id="twoFactorEnabled"
              checked={formData.twoFactorEnabled}
              onChange={handleCheckboxChange}
            />
            <label
              className="form-check-label ms-4"
              htmlFor="twoFactorEnabled"
            >
              Enable Two-Factor Authentication
            </label>
          </div>
          <div className="d-flex justify-content-between mt-5">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onChangePassword}
            >
              Change Password
            </button>
            <button type="submit" className="btn btn-success">
              Save Changes
            </button>
          </div>
        </form>
      </div>
	  </div>
    </div>
  );
};

export default ChangeDetails;
