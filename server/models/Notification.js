const mongoose = require("mongoose");
const { Schema } = mongoose;

// Simple notification: who it's for, what happened, has it been read.
// No push/email/sockets here - just a row the frontend polls for, kept
// deliberately plain so it's easy to follow.
const NotificationSchema = new Schema({
  userEmail: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true }, // e.g. "record_added", "group_added"
  groupid: { type: String },
  read: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

const Notification = mongoose.model("notification", NotificationSchema);
module.exports = Notification;
