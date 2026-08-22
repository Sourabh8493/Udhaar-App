import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertContext from "../context/AlertContext";
import { apiRequest } from "../utils/api";

const SignUp = () => {
  const [credentials, setCredentials] = useState({
    name: "",
    email: "",
    password: "",
    cpassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { showAlert } = useContext(AlertContext)

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (credentials.password !== credentials.cpassword) {
      showAlert("Password and Confirm Password don't match", "danger")
      return;
    }

    setIsSubmitting(true);
    try {
      const json = await apiRequest("/api/auth/createUser", {
        method: "POST",
        auth: false,
        body: {
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
        },
      });

      showAlert(json.message || "Account created! Please verify your email.", "success")
      navigate("/verify-email", { state: { email: json.email || credentials.email } });
    } catch (error) {
      showAlert(error.message || "Something went wrong", "danger");
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
          <div className="udhaar-auth-icon"><i className="bi bi-person-plus"></i></div>
          <h4 className="mb-3">Create an account</h4>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">
                Name
              </label>
              <input
                type="text"
                className="form-control"
                id="name"
                aria-describedby="name"
                name="name"
                value={credentials.name}
                onChange={onChange}
                placeholder="Enter your full name"
                minLength={3}
                required
              />
            </div>
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
              <div id="emailHelp" className="form-text">
                We'll never share your email with anyone else.
              </div>
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
                minLength={5}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="cpassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                className="form-control"
                id="cpassword"
                name="cpassword"
                value={credentials.cpassword}
                onChange={onChange}
                minLength={5}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
