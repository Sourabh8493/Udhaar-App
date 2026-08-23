const express = require("express");
const User = require("../models/User");
const router = express.Router()
const {body, validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser")
const generateOtp = require("../utils/generateOtp")
const sendEmail = require("../utils/sendEmail")
const Group = require("../models/Group")
const Record = require("../models/Record")
const sendEmailResend = require("../utils/sendEmailResend")

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d"
const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes

const signToken = (userId) => {
    const data = { user: { id: userId } }
    return jwt.sign(data, JWT_SECRET, { expiresIn: JWT_EXPIRE })
}

// Best-effort email send: logs but never throws, so a flaky mail server
// never turns into a 500 for the user mid-signup.
const sendOtpEmail = async (to, otp, purpose) => {
    const subject = purpose === "reset" ? "Udhaar - Password Reset OTP" : "Udhaar - Verify your email"
    const text = `Your OTP is ${otp}. It will expire in 10 minutes. If you did not request this, you can safely ignore this email.`
    try {
        await sendEmail({ to, subject, text })
    } catch (error) {
        console.log("Failed to send OTP email:", error.message)
    }
}

router.post("/createUser", [
    body("name", "Enter a valid name").isLength({min:3}),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be atleast 5 chars").isLength({min:5})
], async (req, res)=>{
    let success = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success, errors: errors.array()})
    }

    try {
        const email = req.body.email.trim().toLowerCase()
        let user = await User.findOne({email})
        if (user) {
            return res.status(400).json({success, error: "Please enter a unique email"})
        }

        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt)

        const otp = generateOtp()

        user = await User.create({
            name: req.body.name.trim(),
            email,
            password: secPass,
            isVerified: false,
            otp,
            otpExpiry: new Date(Date.now() + OTP_TTL_MS),
        })

        await sendOtpEmail(user.email, otp, "verify")

        success = true
        // No authToken yet - account is only usable after OTP verification
        res.json({success, email: user.email, message: "Account created. Please check your email for a verification OTP."})

    } catch(error) {
        console.log(error.message);
        res.status(500).json({success:false, error: "Some error occured"})
    }
})

router.post("/verifyEmail", [
    body("email", "Enter a valid email").isEmail(),
    body("otp", "Enter the OTP").isLength({min:6, max:6}),
], async (req, res) => {
    let success = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success, errors: errors.array()})
    }

    try {
        const email = req.body.email.trim().toLowerCase()
        const user = await User.findOne({email})

        if (!user) {
            return res.status(400).json({success, error: "Account not found"})
        }
        if (user.isVerified) {
            return res.status(400).json({success, error: "Account is already verified"})
        }
        if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(400).json({success, error: "OTP has expired. Please request a new one."})
        }
        if (user.otp !== req.body.otp) {
            return res.status(400).json({success, error: "Incorrect OTP"})
        }

        user.isVerified = true
        user.otp = null
        user.otpExpiry = null
        await user.save()

        const authToken = signToken(user.id)
        success = true
        res.json({success, authToken})
    } catch (error) {
        console.log(error.message);
        res.status(500).json({success:false, error: "Some error occured"})
    }
})

router.post("/resendOtp", [
    body("email", "Enter a valid email").isEmail(),
], async (req, res) => {
    let success = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success, errors: errors.array()})
    }

    try {
        const email = req.body.email.trim().toLowerCase()
        const user = await User.findOne({email})

        if (!user) {
            return res.status(400).json({success, error: "Account not found"})
        }
        if (user.isVerified) {
            return res.status(400).json({success, error: "Account is already verified"})
        }

        const otp = generateOtp()
        user.otp = otp
        user.otpExpiry = new Date(Date.now() + OTP_TTL_MS)
        await user.save()

        await sendOtpEmail(user.email, otp, "verify")

        success = true
        res.json({success, message: "A new OTP has been sent to your email."})
    } catch (error) {
        console.log(error.message);
        res.status(500).json({success:false, error: "Some error occured"})
    }
})

router.post("/login", [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password cannot be blank").exists()
], async (req, res)=>{
    let success = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success, errors: errors.array()})
    } 

    const email = req.body.email.trim().toLowerCase();
    const {password} = req.body;
    try {
        let user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({success, error: "Please try to login with correct credentials"})
        }

        const passCompare = await bcrypt.compare(password, user.password)
        if (!passCompare) {
            return res.status(400).json({success, error: "Please try to login with correct credentials"})
        }

        if (!user.isVerified) {
            return res.status(403).json({success, error: "Please verify your email before logging in", unverified: true, email: user.email})
        }

        const authToken = signToken(user.id)

        success = true
        res.json({success, authToken})

    } catch(error) {
        console.log(error.message);
        res.status(500).json({success:false, error: "Some error occured"})
    }
})

router.post("/forgotPassword", [
    body("email", "Enter a valid email").isEmail(),
], async (req, res) => {
    let success = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success, errors: errors.array()})
    }

    try {
        const email = req.body.email.trim().toLowerCase()
        const user = await User.findOne({email})

        // Always respond with success so this endpoint can't be used to
        // enumerate which emails have accounts.
        if (user) {
            const otp = generateOtp()
            user.resetOtp = otp
            user.resetOtpExpiry = new Date(Date.now() + OTP_TTL_MS)
            await user.save()
            await sendOtpEmail(user.email, otp, "reset")
        }

        success = true
        res.json({success, message: "If an account with that email exists, a reset OTP has been sent."})
    } catch (error) {
        console.log(error.message);
        res.status(500).json({success:false, error: "Some error occured"})
    }
})

router.post("/resetPassword", [
    body("email", "Enter a valid email").isEmail(),
    body("otp", "Enter the OTP").isLength({min:6, max:6}),
    body("newPassword", "Password must be atleast 5 chars").isLength({min:5}),
], async (req, res) => {
    let success = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success, errors: errors.array()})
    }

    try {
        const email = req.body.email.trim().toLowerCase()
        const user = await User.findOne({email})

        if (!user) {
            return res.status(400).json({success, error: "Account not found"})
        }
        if (!user.resetOtp || !user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
            return res.status(400).json({success, error: "OTP has expired. Please request a new one."})
        }
        if (user.resetOtp !== req.body.otp) {
            return res.status(400).json({success, error: "Incorrect OTP"})
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.newPassword, salt)
        user.resetOtp = null
        user.resetOtpExpiry = null
        await user.save()

        success = true
        res.json({success, message: "Password reset successfully. Please log in."})
    } catch (error) {
        console.log(error.message);
        res.status(500).json({success:false, error: "Some error occured"})
    }
})

router.post("/getUser", fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password -otp -otpExpiry -resetOtp -resetOtpExpiry")
        if (!user) {
            return res.status(404).json({error: "User not found"})
        }
        res.json(user)
    } catch (error) {
        console.log(error.message);
        res.status(500).json({error: "Some error occured"})
    }
})

router.post("/getUserByEmail/:email", fetchuser, async (req, res) => {
    try {
        const user = await User.findOne({email: req.params.email.trim().toLowerCase()}).select("-password -otp -otpExpiry -resetOtp -resetOtpExpiry")
        if (!user) {
            return res.status(404).json({error: "User not found"})
        }

        res.json(user)
    } catch (error) {
        console.log(error.message);
        res.status(500).json({error: "Some error occured"})
    }
})

// Update the logged-in user's own name. Email is intentionally not
// editable here since it's how other people already reference this
// user inside groups/records - changing it would silently break those
// links.
router.put("/updateProfile", fetchuser, [
    body("name", "Enter a valid name").trim().isLength({min:3}),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success:false, errors: errors.array()})
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { name: req.body.name.trim() } },
            { new: true }
        ).select("-password -otp -otpExpiry -resetOtp -resetOtpExpiry")

        res.json({success:true, user})
    } catch (error) {
        console.log(error.message);
        res.status(500).json({success:false, error: "Some error occured"})
    }
})

router.put("/changePassword", fetchuser, [
    body("currentPassword", "Current password is required").exists(),
    body("newPassword", "Password must be atleast 5 chars").isLength({min:5}),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success:false, errors: errors.array()})
    }

    try {
        const user = await User.findById(req.user.id)
        if (!user) {
            return res.status(404).json({success:false, error: "User not found"})
        }

        const passCompare = await bcrypt.compare(req.body.currentPassword, user.password)
        if (!passCompare) {
            return res.status(400).json({success:false, error: "Current password is incorrect"})
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.newPassword, salt)
        await user.save()

        res.json({success:true, message: "Password changed successfully"})
    } catch (error) {
        console.log(error.message);
        res.status(500).json({success:false, error: "Some error occured"})
    }
})

// Deleting your account is blocked while you still own groups, since
// those groups would otherwise be left with no admin. You need to
// delete (or hand off - not supported yet) those groups first. Groups
// you're just a member of are fine - we simply remove you from them.
router.delete("/deleteAccount", fetchuser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) {
            return res.status(404).json({success:false, error: "User not found"})
        }

        const ownedGroups = await Group.find({ user: req.user.id })
        if (ownedGroups.length > 0) {
            return res.status(400).json({
                success:false,
                error: `You still own ${ownedGroups.length} group(s). Please delete them before deleting your account.`
            })
        }

        const activeRecord = await Record.findOne({
            $or: [{ "from.email": user.email }, { "to.email": user.email }],
        })
        if (activeRecord) {
            return res.status(400).json({
                success:false,
                error: "You still have unsettled records with other people. Please settle or remove them first."
            })
        }

        await Group.updateMany(
            { members: { $elemMatch: { email: user.email } } },
            { $pull: { members: { email: user.email } } }
        )

        await User.findByIdAndDelete(req.user.id)

        res.json({success:true, message: "Account deleted"})
    } catch (error) {
        console.log(error.message);
        res.status(500).json({success:false, error: "Some error occured"})
    }
})

router.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "sourabhsontakke28@gmail.com",
      subject: "Test Email",
      text: "Testing email",
    });

    res.send("Email sent");
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});

module.exports = router
