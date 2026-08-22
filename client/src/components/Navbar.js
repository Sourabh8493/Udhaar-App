import React, { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeContext from "../context/ThemeContext";
import GroupContext from "../context/GroupContext";
import NotificationContext from "../context/NotificationContext";

const timeAgo = (dateStr) => {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Navbar = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useContext(ThemeContext)
  const { currentUser } = useContext(GroupContext)
  const { notifications, unreadCount, getNotifications, markRead, markAllRead } = useContext(NotificationContext)

  const isLoggedIn = !!localStorage.getItem("token")

  useEffect(() => {
    if (isLoggedIn) {
      getNotifications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  const initials = currentUser && currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "?"

  return (
    <div>
      <nav className="navbar navbar-expand-lg bg-body-tertiary udhaar-navbar">
        <div className="container-fluid">
          <Link className="navbar-brand udhaar-brand" to="/">
            <i className="bi bi-wallet2"></i>
            Udhaar
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link active" aria-current="page" to="/">
                  Home
                </Link>
              </li>
            </ul>
          </div>

          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="udhaar-icon-btn"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              <i className={theme === "dark" ? "bi bi-sun" : "bi bi-moon-stars"}></i>
            </button>

            {isLoggedIn && (
              <div className="dropdown">
                <button
                  type="button"
                  className="udhaar-icon-btn"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <i className="bi bi-bell"></i>
                  {unreadCount > 0 && (
                    <span className="udhaar-badge-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </button>
                <div className="dropdown-menu dropdown-menu-end udhaar-notif-dropdown">
                  <div className="d-flex justify-content-between align-items-center px-2 pb-2">
                    <strong>Notifications</strong>
                    {unreadCount > 0 && (
                      <button type="button" className="btn btn-sm btn-link p-0" onClick={markAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-muted small px-2 mb-1">You're all caught up.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`udhaar-notif-item ${!n.read ? "unread" : ""}`}
                        onClick={() => !n.read && markRead(n._id)}
                      >
                        <div className="small">{n.message}</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>{timeAgo(n.date)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {!isLoggedIn ? (
              <div className="d-flex gap-1">
                <Link to="/login" className="btn btn-outline-success mx-1" role="button">Login</Link>
                <Link to="/signup" className="btn btn-outline-success mx-1" role="button">SignUp</Link>
              </div>
            ) : (
              <div className="dropdown">
                <button
                  type="button"
                  className="btn btn-light d-flex align-items-center gap-2 border-0"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="udhaar-avatar">{initials}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/info">
                      <i className="bi bi-person-circle me-2"></i>
                      Your profile
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
