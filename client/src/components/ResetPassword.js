import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AlertContext from "../context/AlertContext";
import { apiRequest } from "../utils/api";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert } = useContext(AlertContext);

  const [form, setForm] = useState({
    email: location.state?.email || "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      showAlert("Passwords don't match", "danger");
      return;
    }

    setIsSubmitting(true);
    try {
      const json = await apiRequest("/api/auth/resetPassword", {
        method: "POST",
        auth: false,
        body: { email: form.email, otp: form.otp, newPassword: form.newPassword },
      });
      showAlert(json.message || "Password reset successfully!", "success");
      navigate("/login");
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
          <div className="udhaar-auth-icon"><i className="bi bi-shield-lock"></i></div>
          <h4 className="mb-3">Reset password</h4>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={form.email}
                onChange={onChange}
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
                name="otp"
                value={form.otp}
                onChange={onChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">New password</label>
              <input
                type="password"
                className="form-control"
                name="newPassword"
                minLength={5}
                value={form.newPassword}
                onChange={onChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm new password</label>
              <input
                type="password"
                className="form-control"
                name="confirmPassword"
                minLength={5}
                value={form.confirmPassword}
                onChange={onChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
