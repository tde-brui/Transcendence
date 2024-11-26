import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import OTPBoxed from "../components/OTPBoxed";
import axios from "axios";
import '../css/UserProfile.css';

const RegisterPage: React.FC = () => {

const { setUserId } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    two_factor_enabled: false,
  });

  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpUserId, setOtpUserId] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value, // Handle checkbox
    });

    // Validation logic
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setFormErrors({
        ...formErrors,
        email: emailRegex.test(value) ? "" : "Invalid email address",
      });
    }

    if (name === "password") {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      setFormErrors({
        ...formErrors,
        password: passwordRegex.test(value)
          ? ""
          : "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number and a special character",
      });
    }

    if (name === "confirmPassword") {
      setFormErrors({
        ...formErrors,
        confirmPassword:
          value !== formData.password ? "Passwords do not match" : "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      formErrors.email ||
      formErrors.password ||
      formErrors.confirmPassword ||
      !formData.username ||
      !formData.email ||
      !formData.password
    ) {
      alert("Please fix the errors before submitting.");
      return;
    }

    // Exclude confirmPassword from the data to be sent
    const { confirmPassword, ...dataToSend } = formData;

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      console.log(dataToSend);
      const response = await axios.post("http://localhost:8000/users/register/", dataToSend, config);
      if (response.status === 200 && response.data?.user_id) {
		setUserId(response.data.user_id);
		setTimeout(() => navigate("/"), 2000);
	  }
	  else if (response.status === 202 && response.data?.user_id)
		{
		const userId = response.data.user_id;
        setUserId(userId);
        setOtpUserId(userId);
        setIsOtpSent(true);
	  }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred during registration.");
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
		{!isOtpSent ? (
      <div className="card profile-card mx-auto">
        <div className="card-header profile-header text-center">
          <h4 className="profile-title text-white">Register</h4>
        </div>
        <div className="card-body profile-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username"></label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">@</span>
                </div>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email"></label>
              <input
                type="email"
                className={`form-control ${formErrors.email ? "is-invalid" : ""}`}
                id="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {formErrors.email && (
                <div className="invalid-feedback">{formErrors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password"></label>
              <input
                type="password"
                className={`form-control ${formErrors.password ? "is-invalid" : ""}`}
                id="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {formErrors.password && (
                <div className="invalid-feedback">{formErrors.password}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword"></label>
              <input
                type="password"
                className={`form-control ${
                  formErrors.confirmPassword ? "is-invalid" : ""
                }`}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {formErrors.confirmPassword && (
                <div className="invalid-feedback">
                  {formErrors.confirmPassword}
                </div>
              )}
            </div>

            <div className="d-flex mt-3 justify-content-center">
              <input
                type="checkbox"
                className="form-check-input checkmark"
                id="two_factor_enabled"
                name="two_factor_enabled"
                checked={formData.two_factor_enabled}
                onChange={handleChange}
              />
              <label className="form-check-label ps-2 text-secondary" htmlFor="two_factor_enabled">
                Enable 2FA
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block mt-3">
              Register
            </button>
          </form>
        </div>
        <div className="card-footer text-center">
          <p className="small">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
			) : (
		otpUserId !== null && (
		  <OTPBoxed
			userId={otpUserId}
		  />
		)
	)}
	</div>
  );
};

export default RegisterPage;
