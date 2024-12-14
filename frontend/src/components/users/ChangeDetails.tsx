import React, { useState } from "react";
import axiosInstance from "../utils/AxiosInstance";
import "../../css/UserProfile.css";
import ChangeAvatar from "./ChangeAvatar";
import { useNavigate } from "react-router-dom";

interface ChangeDetailsProps {
  username: string;
  firstName: string;
  email: string;
  twoFactorEnabled: boolean;
  avatarUrl: string;
  userId: number;
  onEditAvatar: () => void;
  onChangePassword: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const ChangeDetails: React.FC<ChangeDetailsProps> = ({
  username,
  firstName,
  email,
  twoFactorEnabled,
  avatarUrl,
  userId,
  onEditAvatar,
  onChangePassword,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    username,
    firstName,
    email,
    twoFactorEnabled,
  });

  const [formErrors, setFormErrors] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
  });

  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "username") {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      setFormErrors({
        ...formErrors,
        username: usernameRegex.test(value)
          ? ""
          : "Username must be 3-20 characters long and can only contain letters, numbers, and underscores",
      });
    }

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setFormErrors({
        ...formErrors,
        email: emailRegex.test(value) ? "" : "Invalid email address",
      });
    }
    if (name === "firstName") {
      const firstNameRegex = /^[A-Z][a-z]*$/; // First letter capital, rest lowercase
      setFormErrors({
        ...formErrors,
        firstName: firstNameRegex.test(value)
          ? ""
          : "First name must start with a capital letter and only contain lowercase letters afterward",
      });
    }
  };

  const handleCheckboxChange = () => {
    setFormData({ ...formData, twoFactorEnabled: !formData.twoFactorEnabled });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      formErrors.email ||
      formErrors.password ||
      !formData.username ||
      !formData.email
    ) {
      console.log("Please fix the errors before submitting.");
      return;
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      console.log(formData);
      const response = await axiosInstance.patch(
        `/users/${userId}/`,
        formData,
        config
      );
      if (response.status === 200 && response.data?.user_id) {
        onCancel();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="container d-flex align-items-center justify-content-center">
      {isEditingAvatar && (
        <div className="popup-overlay">
          <div className="popup-content">
            <ChangeAvatar
              avatarUrl={avatarUrl}
              userId={userId}
              onClose={() => setIsEditingAvatar(false)}
              onAvatarUpdated={(newAvatarUrl) => console.log("Avatar updated:", newAvatarUrl)}
            />
          </div>
        </div>
      )}
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
            onClick={() => setIsEditingAvatar(true)}
          >
            Edit
          </button>
        </div>
        <div className="profile-body p-4">
          <h2 className="profile-title mb-4">Change Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="d-flex flex-column mb-3">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                className={`form-control ${
                  formErrors.username ? "is-invalid" : ""
                }`}
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
                className={`form-control ${
                  formErrors.firstName ? "is-invalid" : ""
                }`}
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
              {formErrors.firstName && (
                <div className="invalid-feedback">{formErrors.firstName}</div>
              )}
            </div>
            <div className="d-flex flex-column mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                className={`form-control ${
                  formErrors.email ? "is-invalid" : ""
                }`}
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              {formErrors.email && (
                <div className="invalid-feedback">{formErrors.email}</div>
              )}
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
            <div className="d-flex justify-content-between mt-4">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onChangePassword}
              >
                Change Password
              </button>
              <div>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-success ms-2">
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangeDetails;
