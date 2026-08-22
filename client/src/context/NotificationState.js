import React, { useContext, useState } from "react";
import NotificationContext from "./NotificationContext";
import AlertContext from "./AlertContext";
import { apiRequest } from "../utils/api";

const NotificationState = (props) => {
  const [notifications, setNotifications] = useState([]);

  const alertContext = useContext(AlertContext);
  const showAlert = alertContext ? alertContext.showAlert : () => {};

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotifications = async () => {
    try {
      const json = await apiRequest("/api/notifications/fetchmine");
      setNotifications(Array.isArray(json) ? json : []);
    } catch (error) {
      // Notifications failing to load shouldn't interrupt the rest of
      // the app, so no alert here - just leave the list as-is.
      console.log(error.message);
    }
  };

  const markRead = async (id) => {
    try {
      await apiRequest(`/api/notifications/markread/${id}`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (error) {
      showAlert(error.message, "danger");
    }
  };

  const markAllRead = async () => {
    try {
      await apiRequest("/api/notifications/markallread", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      showAlert(error.message, "danger");
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, getNotifications, markRead, markAllRead }}
    >
      {props.children}
    </NotificationContext.Provider>
  );
};

export default NotificationState;
