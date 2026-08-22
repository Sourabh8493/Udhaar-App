const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const { body, validationResult } = require("express-validator");
const fetchuser = require("../middleware/fetchuser");
const User = require("../models/User");
const Record = require("../models/Record");
const notify = require("../utils/notify");

router.post(
  "/createGroup",
  fetchuser,
  [body("title", "Title must be atleast 1 character").trim().isLength({ min: 1 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { title, members } = req.body;
      if (!Array.isArray(members)) {
        return res.status(400).json({ error: "Members must be a list of emails" });
      }

      // De-duplicate emails (case-insensitive) before looking them up
      const uniqueEmails = [...new Set(members.map((m) => (m || "").trim().toLowerCase()).filter(Boolean))];

      const membersOut = []
      for (let i = 0; i < uniqueEmails.length; i++) {
        let member = await User.findOne({ email: uniqueEmails[i] });
        if (!member) {
          return res
            .status(404)
            .json({ error: `User with email ${uniqueEmails[i]} does not exist` });
        }

        membersOut.push({email: member.email, name: member.name})
      }

      const currentUser = await User.findById(req.user.id)
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Make sure the creator isn't added twice if they included their own email
      if (!membersOut.some((m) => m.email === currentUser.email)) {
        membersOut.push({
          email: currentUser.email,
          name: currentUser.name
        })
      }

      const group = await Group.create({
        title: title.trim(),
        user: req.user.id,
        members: membersOut,
      });

      // Let everyone except the creator know they've been added
      for (const member of membersOut) {
        if (member.email !== currentUser.email) {
          await notify(member.email, `You were added to the group "${group.title}" by ${currentUser.name}`, "group_added", group._id.toString());
        }
      }

      res.json({ group });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Some error occurred");
    }
  },
);

router.delete("/deleteGroup/:id", fetchuser, async (req, res) => {
  try {
    var group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).send("Group not found");
    }

    if (group.user.toString() !== req.user.id) {
      return res.status(403).send("Only group admin can delete group");
    }

    group = await Group.findByIdAndDelete(req.params.id);
    res.json(group);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Some error occurred");
  }
});

router.put("/addmember/:email/:groupid", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let group = await Group.findById(req.params.groupid);

    if (!group) {
      return res.status(404).send("Group not found");
    }

    const email = decodeURIComponent(req.params.email).trim().toLowerCase();
    const member = await User.findOne({ email });

    if (!member) {
      return res
        .status(404)
        .send(`User with email ${email} does not exist`);
    }
    if (!group.members.some((m) => {
      return m.email === user.email
    })) {
      return res.status(403).send("You are not authorized to edit this group");
    }
    if (group.members.some((m) => {
      return m.email === member.email
    })) {
      return res
        .status(409)
        .send(
          `Member with email ${email} already is part of the group`,
        );
    }
    group = await Group.findByIdAndUpdate(
      req.params.groupid,
      { $push: { members: {email: member.email, name: member.name} } },
      { returnDocument: "after" },
    );

    await notify(member.email, `You were added to the group "${group.title}" by ${user.name}`, "group_added", group._id.toString());

    res.json({ group });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Some error occurred");
  }
});

router.put("/leavegroup/:groupid", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let group = await Group.findById(req.params.groupid);

    if (!group) {
      return res.status(404).send("Group not found");
    }

    if (!group.members.some((m) => {
      return m.email === user.email
    })) {
      return res.status(403).send("You are not part of this group");
    }

    // Can't leave while you still owe money or are owed money in this
    // group - those records would end up pointing at someone who's no
    // longer a member.
    const activeRecord = await Record.findOne({
      groupid: req.params.groupid,
      $or: [{ "from.email": user.email }, { "to.email": user.email }],
    });
    if (activeRecord) {
      return res.status(400).send("You have unsettled records in this group. Settle or remove them before leaving.");
    }

    group = await Group.findByIdAndUpdate(
      req.params.groupid,
      { $pull: { members: {email: user.email, name: user.name} } },
      { returnDocument: "after" },
    );
    res.json({ group });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Some error occurred");
  }
});

router.get("/fetchallgroups", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const groups = await Group.find({ members: {email: user.email, name: user.name} });

    res.json(groups);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Some error occurred");
  }
});

router.get("/getGroup/:groupid", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const group = await Group.findById(req.params.groupid)

    if (!group) {
      return res.status(404).send("Group not found");
    }
    if (!user || !group.members.some((m) => m.email === user.email)) {
      return res.status(403).send("You are not a member of this group");
    }

    res.json(group)
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Some error occurred");
  }
})


// Admin-only: rename the group. Membership changes go through
// addmember/leavegroup instead, so this stays small and predictable.
router.put("/updateGroup/:groupid", fetchuser, [
  body("title", "Title must be atleast 1 character").trim().isLength({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let group = await Group.findById(req.params.groupid);
    if (!group) {
      return res.status(404).send("Group not found");
    }
    if (group.user.toString() !== req.user.id) {
      return res.status(403).send("Only the group admin can update this group");
    }

    group = await Group.findByIdAndUpdate(
      req.params.groupid,
      { $set: { title: req.body.title.trim() } },
      { new: true },
    );
    res.json({ group });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Some error occurred");
  }
});

module.exports = router;
