import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AlertContext from "../context/AlertContext";
import { apiRequest, setAuthSession } from "../utils/api";

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate()
  const { showAlert } = useContext(AlertContext)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const json = await apiRequest("/api/auth/login", {
        method: "POST",
        auth: false,
        body: { email: credentials.email, password: credentials.password },
      });

      setAuthSession(json.authToken)
      navigate("/")
      showAlert("Logged In Successfully!", "success")
    } catch (error) {
      if (error.body && error.body.unverified) {
        showAlert("Please verify your email first", "danger")
        navigate("/verify-email", { state: { email: error.body.email } })
      } else {
        showAlert(error.message || "Invalid Credentials!", "danger")
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };
  return (
    <div className="container udhaar-page">
      <div className="card udhaar-auth-card">
        <div className="card-body">
          <div className="text-center">
          <div className="udhaar-auth-icon"><i className="bi bi-box-arrow-in-right"></i></div>
          <h4 className="mb-3">Log in</h4>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                aria-describedby="emailHelp"
                name="email"
                value={credentials.email}
                onChange={onChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                value={credentials.password}
                onChange={onChange}
                required
              />
              <div className="form-text text-end">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
