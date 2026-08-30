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

      // One query for every member instead of one query per member -
      // matters once a group has more than a couple of people.
      const foundUsers = await User.find({ email: { $in: uniqueEmails } });
      const missingEmail = uniqueEmails.find(
        (email) => !foundUsers.some((u) => u.email === email)
      );
      if (missingEmail) {
        return res.status(404).json({ error: `User with email ${missingEmail} does not exist` });
      }

      const membersOut = foundUsers.map((u) => ({ email: u.email, name: u.name }));

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

      // Let everyone except the creator know they've been added. Fired
      // off in parallel since these are independent, best-effort writes.
      await Promise.all(
        membersOut
          .filter((member) => member.email !== currentUser.email)
          .map((member) =>
            notify(member.email, `You were added to the group "${group.title}" by ${currentUser.name}`, "group_added", group._id.toString())
          )
      );

      res.json({ group });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: "Some error occurred" });
    }
  },
);

router.delete("/deleteGroup/:id", fetchuser, async (req, res) => {
  try {
    var group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only group admin can delete group" });
    }

    group = await Group.findByIdAndDelete(req.params.id);
    res.json(group);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Some error occurred" });
  }
});

router.put("/addmember/:email/:groupid", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let group = await Group.findById(req.params.groupid);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const email = decodeURIComponent(req.params.email).trim().toLowerCase();
    const member = await User.findOne({ email });

    if (!member) {
      return res.status(404).json({ error: `User with email ${email} does not exist` });
    }
    if (!user || !group.members.some((m) => m.email === user.email)) {
      return res.status(403).json({ error: "You are not authorized to edit this group" });
    }
    if (group.members.some((m) => m.email === member.email)) {
      return res.status(409).json({ error: `Member with email ${email} already is part of the group` });
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
    res.status(500).json({ error: "Some error occurred" });
  }
});

router.put("/leavegroup/:groupid", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let group = await Group.findById(req.params.groupid);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!user || !group.members.some((m) => m.email === user.email)) {
      return res.status(403).json({ error: "You are not part of this group" });
    }

    // Can't leave while you still owe money or are owed money in this
    // group - those records would end up pointing at someone who's no
    // longer a member.
    const activeRecord = await Record.findOne({
      groupid: req.params.groupid,
      $or: [{ "from.email": user.email }, { "to.email": user.email }],
    });
    if (activeRecord) {
      return res.status(400).json({ error: "You have unsettled records in this group. Settle or remove them before leaving." });
    }

    const isAdmin = group.user.toString() === req.user.id;
    // Members are matched by email everywhere - matching by the whole
    // {email, name} object breaks the moment someone changes their name,
    // since Mongo would then be looking for an object that no longer
    // exists in the array.
    const remainingMembers = group.members.filter((m) => m.email !== user.email);

    if (isAdmin && remainingMembers.length > 0) {
      // The admin is leaving - hand the group off to whoever is next in
      // the members list, and keep doing that every time an admin
      // leaves, until someone stays or the group is empty.
      const nextAdminEmail = remainingMembers[0].email;
      const nextAdmin = await User.findOne({ email: nextAdminEmail });

      if (nextAdmin) {
        group = await Group.findByIdAndUpdate(
          req.params.groupid,
          { $pull: { members: { email: user.email } }, $set: { user: nextAdmin._id } },
          { new: true },
        );
        await notify(nextAdmin.email, `You are now the admin of "${group.title}"`, "admin_transferred", group._id.toString());
      } else {
        // Extremely unlikely (the member exists in the group but not as
        // a user account) - fall back to just removing the leaver.
        group = await Group.findByIdAndUpdate(
          req.params.groupid,
          { $pull: { members: { email: user.email } } },
          { new: true },
        );
      }
    } else if (isAdmin && remainingMembers.length === 0) {
      // Last person in the group leaving - nothing left to be admin of.
      await Group.findByIdAndDelete(req.params.groupid);
      return res.json({ group: null, deleted: true });
    } else {
      group = await Group.findByIdAndUpdate(
        req.params.groupid,
        { $pull: { members: { email: user.email } } },
        { new: true },
      );
    }

    res.json({ group });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Some error occurred" });
  }
});

router.get("/fetchallgroups", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Match on email only - matching the full {email, name} object would
    // silently stop working the moment this user renamed themselves,
    // since the stored member entry would no longer equal this object.
    const groups = await Group.find({ "members.email": user.email });

    res.json(groups);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Some error occurred" });
  }
});

router.get("/getGroup/:groupid", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const group = await Group.findById(req.params.groupid)

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (!user || !group.members.some((m) => m.email === user.email)) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    res.json(group)
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Some error occurred" });
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
      return res.status(404).json({ error: "Group not found" });
    }
    if (group.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the group admin can update this group" });
    }

    group = await Group.findByIdAndUpdate(
      req.params.groupid,
      { $set: { title: req.body.title.trim() } },
      { new: true },
    );
    res.json({ group });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Some error occurred" });
  }
});

module.exports = router;
