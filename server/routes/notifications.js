const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Latest 50 notifications for the logged-in user, newest first.
router.get("/fetchmine", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const notifications = await Notification.find({ userEmail: user.email })
      .sort({ date: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Some error occurred" });
  }
});

// Marking a notification "read" removes it - once you've seen it there's
// no reason to keep it around, and this is what stops the list from
// piling up forever. Anything you never open still gets cleaned up
// automatically after a couple of days via the TTL index on the model.
router.put("/markread/:id", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    if (!user || notification.userEmail !== user.email) {
      return res.status(403).json({ error: "Not allowed to modify this notification" });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification cleared" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Some error occurred" });
  }
});

router.put("/markallread", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await Notification.deleteMany({ userEmail: user.email });
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Some error occurred" });
  }
});

module.exports = router;
