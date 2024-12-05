import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import axiosInstance from "./AxiosInstance";
import { useAuth } from "./AuthContext";

interface OTPBoxedProps {
  email: string;
}

const OTPBoxed: React.FC<OTPBoxedProps> = ({ email }) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { setUserId } = useAuth();


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { value } = e.target;
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value.slice(-1); // Only keep the last character
      setOtp(newOtp);

      // Move to the next input box
      if (value && index < inputRefs.current.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move to the previous input box on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    try {
      await axios.post(`http://localhost:8000/users/resend_otp/`, {
      });
      alert("A new OTP has been sent!");
    } catch (err) {
      setError("Error resending OTP.");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/users/verify_otp/`,
        {
          otp_code: fullOtp,
        }
      );
      console.error("response:", response);
      if (response.status === 200 && response.data?.user_id) {
        const userId = response.data.user_id;
        setUserId(userId);
        navigate("/");
      } else {
        throw new Error("OTP verification failed.");
      }
    } catch (err) {
      setError("Invalid OTP or verification failed.");
      console.error(err);
    }
  };

  const maskedEmail = email.replace(/(.{2}).*(@.*)/, "$1***$2");

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!email) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="card profile-card mx-auto">
        <div className="card-header profile-header text-center">
          <h4 className="profile-title text-white">Enter code</h4>
        </div>
        <div className="card-body profile-body">
          <p className="text-center mb-4 h6">
            An email has been sent to the email address{" "}
            <strong>{maskedEmail}</strong>. Enter the code to log in.
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <div className="otp-container">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  className="otp-box"
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  maxLength={1}
                />
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-block mt-3">
              Verify
            </button>
          </form>
          <button
            type="button"
            className="btn btn-link mt-3"
            onClick={handleResendCode}
          >
            Send New Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPBoxed;
