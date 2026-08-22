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
      return res.status(404).send("User not found");
    }

    const notifications = await Notification.find({ userEmail: user.email })
      .sort({ date: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Some error occurred");
  }
});

router.put("/markread/:id", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).send("Notification not found");
    }
    if (!user || notification.userEmail !== user.email) {
      return res.status(403).send("Not allowed to modify this notification");
    }

    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Some error occurred");
  }
});

router.put("/markallread", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    await Notification.updateMany({ userEmail: user.email, read: false }, { $set: { read: true } });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Some error occurred");
  }
});

module.exports = router;
