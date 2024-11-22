import React, { useState } from "react";
import axios from "axios";
import { useAuth} from "./AuthContext";
import { useNavigate } from "react-router-dom";
import OTPBoxed from "./OTPBoxed";
import './css/UserProfile.css';

const LoginPage: React.FC = () => {
	const { setUserId } = useAuth();
	const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({
    username: "",
    password: "",
  });

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpUserId, setOtpUserId] = useState<number | null>(null);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validation logic
    if (name === "username") {
      setFormErrors({
        ...formErrors,
        username: value.trim() === "" ? "Username is required" : "",
      });
    }

    if (name === "password") {
      setFormErrors({
        ...formErrors,
        password: value.trim() === "" ? "Password is required" : "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formErrors.username || formErrors.password || !formData.username || !formData.password) {
      alert("Please fix the errors before submitting.");
      return;
    }

    try {
		const config = {
		  headers: {
			"Content-Type": "application/json",
		  },
		};
  
		const response = await axios.post("http://localhost:8000/users/login/", formData, config);


		if (response.status === 200 && response.data?.user_id) {
			const userId = response.data.user_id;
			setUserId(userId); // Set the userId in AuthContext
			// alert(`Login successful! User ID: ${userId}`);
			navigate('/');
		  // Optionally navigate to another page
		} 
		else if (response.status === 202 && response.data?.user_id) {
			const userId = response.data.user_id;
			setUserId(userId);
			setOtpUserId(userId);
        	setIsOtpSent(true);
		  alert("OTP sent to your email.");
		}
		else {
		  alert("Unexpected response from the server.");
		}
	  } catch (error) {
		console.error("Error during login:", error);
		alert("Invalid username or password.");
	  }
	};

	return (
		<div className="container d-flex align-items-center justify-content-center vh-100">
		  {!isOtpSent ? (
			<div className="card profile-card mx-auto">
			  <div className="card-header profile-header text-center">
				<h4 className="profile-title text-white">Login</h4>
			  </div>
			  <div className="card-body profile-body">
				<form onSubmit={handleSubmit} noValidate>
				  <div className="form-group">
					<label htmlFor="username"></label>
					<div className="input-group mb-3">
					  <div className="input-group-prepend">
						<span className="input-group-text">@</span>
					  </div>
					  <input
						type="text"
						className={`form-control ${formErrors.username ? "is-invalid" : ""}`}
						id="username"
						name="username"
						placeholder="Username"
						value={formData.username}
						onChange={handleChange}
						required
					  />
					  {formErrors.username && (
						<div className="invalid-feedback">{formErrors.username}</div>
					  )}
					</div>
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
	
				  <button type="submit" className="btn btn-primary btn-block mt-2">
					Login
				  </button>
				</form>
			  </div>
			  <div className="card-footer text-center">
				<p className="small">
				  Don't have an account? <a href="/register">Register</a>
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

export default LoginPage;
