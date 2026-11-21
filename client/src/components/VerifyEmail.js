import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AlertContext from "../context/AlertContext";
import { apiRequest, setAuthSession } from "../utils/api";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert } = useContext(AlertContext);

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const json = await apiRequest("/api/auth/verifyEmail", {
        method: "POST",
        auth: false,
        body: { email, otp },
      });
      setAuthSession(json.authToken);
      showAlert("Email verified! Welcome to Udhaar.", "success");
      navigate("/");
    } catch (error) {
      showAlert(error.message, "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showAlert("Enter your email first", "danger");
      return;
    }
    setIsResending(true);
    try {
      const json = await apiRequest("/api/auth/resendOtp", {
        method: "POST",
        auth: false,
        body: { email },
      });
      showAlert(json.message || "OTP resent", "success");
    } catch (error) {
      showAlert(error.message, "danger");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="container udhaar-page">
      <div className="card udhaar-auth-card">
        <div className="card-body">
          <div className="text-center">
          <div className="udhaar-auth-icon"><i className="bi bi-envelope-check"></i></div>
          <h4 className="mb-3">Verify your email</h4>
          </div>
          <p className="text-muted">Enter the 6-digit OTP we emailed you to activate your account.</p>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>
          </form>
          <button
            type="button"
            className="btn btn-link mt-2 p-0"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? "Resending..." : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
