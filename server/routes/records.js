const express = require("express");
const router = express.Router();
const Record = require("../models/Record");
const {body, validationResult} = require("express-validator");
const fetchuser = require("../middleware/fetchuser");
const User = require("../models/User")
const Group = require("../models/Group")
const History = require("../models/History")
const notify = require("../utils/notify")

router.get("/fetchallrecords/:grpid", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const group = await Group.findById(req.params.grpid);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (!user || !group.members.some((m) => m.email === user.email)) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const records = await Record.find({ groupid: req.params.grpid });
    res.json(records);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Some error occurred" });
  }
});

router.get("/history/:grpid", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const group = await Group.findById(req.params.grpid);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (!user || !group.members.some((m) => m.email === user.email)) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const history = await History.find({ groupid: req.params.grpid }).sort({ settledDate: -1 });
    res.json(history);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Some error occurred" });
  }
});

router.post(
  "/addrecord",
  fetchuser,
  [
    body("amount", "Amount should be a number greater than 0").isFloat({
      min: 0.01,
    }),
    body("note", "Note must be atleast 2 characters").trim().isLength({ min: 2 }),
    body("to", "Recipient email is required").isEmail(),
    body("groupid", "Group is required").isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { groupid, to, amount, note } = req.body;
      const user = await User.findById(req.user.id)
      const payer = await User.findOne({email: to.trim().toLowerCase()})

      if (!payer) {
        return res.status(404).json({ error: `User with email ${to} does not exist` });
      }
      if (user.email === payer.email) {
        return res.status(400).json({ error: "You cannot create a record against yourself" });
      }

      const group = await Group.findById(groupid);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      const isMember = (email) => group.members.some((m) => m.email === email);
      if (!isMember(user.email) || !isMember(payer.email)) {
        return res.status(400).json({ error: "Both users must be members of this group" });
      }

      const record = new Record({
        from: {email: user.email, name: user.name},
        to: {email: payer.email, name: payer.name},
        note: note.trim(),
        amount,
        status: "pending",
        user: req.user.id,
        groupid: groupid
      });
      const savedRecord = await record.save();

      await notify(payer.email, `${user.name} added a record of ₹${amount} against you in "${group.title}"`, "record_added", groupid);

      res.json(savedRecord);
    } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: "Some error occurred" });
    }
  },
);

router.delete("/deleterecord/:id",fetchuser, async (req, res) => {
  try {
    var record = await Record.findById(req.params.id)

    if (!record) {
      return res.status(404).json({ error: "Record not found" })
    }

    if (record.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Please authenticate with valid credentials" })
    }
    if (record.status === "confirmed") {
      return res.status(400).json({ error: "This record is confirmed - mark it as Done to settle it instead of deleting it" })
    }

    record = await Record.findByIdAndDelete(req.params.id)
    res.json({"message":"Deleted Successfully", "record":record})
  } catch(error) {
    console.log(error.message)
    res.status(500).json({ error: "Some error occurred" })
  }
})

router.delete("/declinerecord/:id",fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    var record = await Record.findById(req.params.id)

    if (!record) {
      return res.status(404).json({ error: "Record not found" })
    }
    if (!user || record.to.email !== user.email) {
      return res.status(403).json({ error: "Only the recipient of this record can decline it" })
    }
    if (record.status !== "pending") {
      return res.status(400).json({ error: "Only pending records can be declined" })
    }

    record = await Record.findByIdAndDelete(req.params.id)

    const creator = await User.findById(record.user);
    if (creator) {
      await notify(creator.email, `${user.name} declined the record of ₹${record.amount} you added`, "record_declined", record.groupid);
    }

    res.json({"message":"Deleted Successfully", "record":record})
  } catch(error) {
    console.log(error.message)
    res.status(500).json({ error: "Some error occurred" })
  }
})

// Marking a confirmed record "Done" moves it into read-only history
// instead of just deleting it, so the group keeps a record of who
// actually paid whom and when.
router.put("/settlerecord/:id", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const record = await Record.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    if (!user || record.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the person who created the record can mark it as done" });
    }
    if (record.status !== "confirmed") {
      return res.status(400).json({ error: "Only confirmed records can be settled" });
    }

    await History.create({
      from: record.from,
      to: record.to,
      amount: record.amount,
      note: record.note,
      groupid: record.groupid,
      createdDate: record.date,
      settledDate: new Date(),
    });

    await Record.findByIdAndDelete(req.params.id);

    await notify(record.to.email, `${user.name} marked the record of ₹${record.amount} as settled`, "record_settled", record.groupid);

    res.json({ message: "Settled successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Some error occurred" });
  }
});

router.put("/updaterecord/:id", fetchuser, async (req, res) => {
  try {
    const { to, amount, note, status } = req.body;
    const user = await User.findById(req.user.id);

    var record = await Record.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Confirming/declining a debt is the recipient's call; editing the
    // record's own details stays with whoever created it.
    if (status) {
      if (!user || record.to.email !== user.email) {
        return res.status(403).json({ error: "Only the recipient can confirm this record" });
      }
      if (record.status === "confirmed") {
        return res.status(400).json({ error: "This record is already settled" });
      }
    } else {
      if (record.user.toString() !== req.user.id) {
        return res.status(403).json({ error: "Not allowed to edit this record" });
      }
      if (record.status !== "pending") {
        return res.status(400).json({ error: "Only pending records can be edited" });
      }
    }

    const newRecord = {};
    if (to) {
      newRecord.to = to;
    }
    if (amount) {
      newRecord.amount = amount;
    }
    if (note) {
      newRecord.note = note.trim()
    }
    if (status) {
      newRecord.status = status
    }

    record = await Record.findByIdAndUpdate(
      req.params.id,
      { $set: newRecord },
      { new: true },
    );

    if (status === "confirmed") {
      const creator = await User.findById(record.user);
      if (creator) {
        await notify(creator.email, `${user.name} confirmed the record of ₹${record.amount}`, "record_confirmed", record.groupid);
      }
    }

    res.json({ record });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Some error occured" });
  }
});

module.exports = router
