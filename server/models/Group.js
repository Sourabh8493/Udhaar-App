const mongoose = require("mongoose");
const { Schema } = mongoose;

const GroupSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  title: { type: String, required: true, trim: true },
  members: {type: Array, required: true}
});

const Group = mongoose.model("group", GroupSchema);
Group.createIndexes();

module.exports = Group;
