import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertContext from "../context/AlertContext";
import { apiRequest } from "../utils/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showAlert } = useContext(AlertContext);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const json = await apiRequest("/api/auth/forgotPassword", {
        method: "POST",
        auth: false,
        body: { email },
      });
      showAlert(json.message || "If an account exists, an OTP has been sent.", "success");
      navigate("/reset-password", { state: { email } });
    } catch (error) {
      showAlert(error.message, "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container udhaar-page">
      <div className="card udhaar-auth-card">
        <div className="card-body">
          <div className="text-center">
          <div className="udhaar-auth-icon"><i className="bi bi-key"></i></div>
          <h4 className="mb-3">Forgot password</h4>
          </div>
          <p className="text-muted">Enter your email and we'll send you a reset OTP.</p>
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
            <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending...
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
