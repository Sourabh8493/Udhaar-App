const mongoose = require("mongoose");
const { Schema } = mongoose;

const GroupSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  title: { type: String, required: true, trim: true },
  members: {type: Array, required: true}
});

// Every group lookup for a logged-in user goes through "which groups is
// this email a member of" (fetchallgroups) - index it so that stays fast
// as the members collection grows, instead of scanning every group.
GroupSchema.index({ "members.email": 1 });

const Group = mongoose.model("group", GroupSchema);

module.exports = Group;
