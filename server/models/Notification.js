const mongoose = require("mongoose");
const { Schema } = mongoose;

// Simple notification: who it's for, what happened, has it been read.
// No push/email/sockets here - just a row the frontend polls for, kept
// deliberately plain so it's easy to follow.
//
// Notifications are meant to be short-lived: the routes delete them the
// moment they're read, and this TTL index is the safety net for ones
// that never get opened - Mongo's background TTL sweep removes any
// document older than 2 days automatically, no cron job needed.
const NotificationSchema = new Schema({
  userEmail: { type: String, required: true, index: true },
  message: { type: String, required: true },
  type: { type: String, required: true }, // e.g. "record_added", "group_added"
  groupid: { type: String },
  read: { type: Boolean, default: false },
  date: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 2 }, // 2 days
});

const Notification = mongoose.model("notification", NotificationSchema);
module.exports = Notification;
