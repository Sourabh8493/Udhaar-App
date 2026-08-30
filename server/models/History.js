const mongoose = require("mongoose");
const { Schema } = mongoose;

// A read-only copy of a record, written the moment it gets settled
// ("Done"). Declined/deleted records never end up here - only ones that
// were actually paid off. Keeping this as its own collection (instead of
// just changing Record.status) means the active Records list only ever
// has to think about "pending" and "confirmed", and History never has to
// worry about accidentally being edited.
//
// History is a log, not a permanent ledger - the TTL index below removes
// entries automatically 30 days after they were settled, so old groups
// don't accumulate history forever.
const HistorySchema = new Schema({
  from: { type: Object, required: true },
  to: { type: Object, required: true },
  amount: { type: Number, required: true },
  note: { type: String, default: "General" },
  groupid: { type: String, required: true, index: true },
  createdDate: { type: Date, required: true }, // when the original record was created
  settledDate: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }, // 30 days
});

const History = mongoose.model("history", HistorySchema);
module.exports = History;
