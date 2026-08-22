const Notification = require("../models/Notification");

// Best-effort notification creator. A failure here should never break the
// action that triggered it (adding a record shouldn't fail just because
// a notification couldn't be saved), so this always swallows its own
// errors instead of throwing.
const notify = async (userEmail, message, type, groupid) => {
  try {
    await Notification.create({ userEmail, message, type, groupid });
  } catch (error) {
    console.log("Failed to create notification:", error.message);
  }
};

module.exports = notify;
