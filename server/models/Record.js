const mongoose = require("mongoose");
const { Schema } = mongoose;

const RecordSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  from: { type: Object, required: true },
  to: { type: Object, required: true },
  amount: { type: Number, required: true, min: 0.01 },
  note: { type: String, default: "General", trim: true },
  status: {type: String, default: "pending"},
  groupid: { type: String, required: true, index: true },
  date: { type: Date, default: Date.now },
});

const Record = mongoose.model("record", RecordSchema);

module.exports = Record;
