import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupContext from "../context/GroupContext";
import AlertContext from "../context/AlertContext";
import { isSessionValid, clearAuthSession } from "../utils/api";

const Info = () => {
  const navigate = useNavigate();
  const { currentUser, getUserDetails, updateProfile, changePassword, deleteAccount } = useContext(GroupContext);
  const { showAlert } = useContext(AlertContext);

  const [name, setName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isSessionValid()) {
      clearAuthSession();
      navigate("/login");
      return;
    }
    getUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.name) {
      setName(currentUser.name);
    }
  }, [currentUser]);

  const handleNameSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === currentUser.name) {
      return;
    }
    setIsSavingName(true);
    await updateProfile(name.trim());
    setIsSavingName(false);
  };

  const onPasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showAlert("New passwords don't match", "danger");
      return;
    }
    if (!window.confirm("Change your password?")) {
      return;
    }
    setIsSavingPassword(true);
    const success = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    setIsSavingPassword(false);
    if (success) {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) {
      return;
    }
    if (!window.confirm("Are you absolutely sure? You will lose access immediately.")) {
      return;
    }
    setIsDeleting(true);
    const success = await deleteAccount();
    setIsDeleting(false);
    if (success) {
      clearAuthSession();
      navigate("/login");
    }
  };

  const initials = currentUser && currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "";

  return (
    <div className="container udhaar-page">
      <div className="d-flex align-items-center gap-3 mb-4">
        <span className="udhaar-avatar" style={{ width: "3.5rem", height: "3.5rem", fontSize: "1.4rem" }}>
          {initials || <i className="bi bi-person"></i>}
        </span>
        <div>
          <h2 className="udhaar-section-title mb-0">{currentUser.name || "Your profile"}</h2>
          <div className="text-muted">{currentUser.email}</div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title mb-3"><i className="bi bi-person me-2"></i>Name</h5>
          <form onSubmit={handleNameSave} className="d-flex gap-2 flex-wrap">
            <input
              type="text"
              className="form-control"
              style={{ maxWidth: "320px" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={3}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={isSavingName || name.trim() === currentUser.name}>
              {isSavingName ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title mb-3"><i className="bi bi-shield-lock me-2"></i>Change password</h5>
          <form onSubmit={handlePasswordSave}>
            <div className="row g-2">
              <div className="col-12 col-md-4">
                <input
                  type="password"
                  className="form-control"
                  name="currentPassword"
                  placeholder="Current password"
                  value={passwordForm.currentPassword}
                  onChange={onPasswordChange}
                  required
                />
              </div>
              <div className="col-12 col-md-4">
                <input
                  type="password"
                  className="form-control"
                  name="newPassword"
                  placeholder="New password"
                  minLength={5}
                  value={passwordForm.newPassword}
                  onChange={onPasswordChange}
                  required
                />
              </div>
              <div className="col-12 col-md-4">
                <input
                  type="password"
                  className="form-control"
                  name="confirmNewPassword"
                  placeholder="Confirm new password"
                  minLength={5}
                  value={passwordForm.confirmNewPassword}
                  onChange={onPasswordChange}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-3" disabled={isSavingPassword}>
              {isSavingPassword ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>

      <div className="card border-danger-subtle">
        <div className="card-body">
          <h5 className="card-title mb-2 text-danger"><i className="bi bi-exclamation-triangle me-2"></i>Danger zone</h5>
          <p className="text-muted small">
            Deleting your account is permanent. You'll need to delete any groups you own and settle
            any records you're part of first.
          </p>
          <button type="button" className="btn btn-outline-danger" onClick={handleDeleteAccount} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Info;
