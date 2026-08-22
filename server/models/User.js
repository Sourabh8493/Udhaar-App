const mongoose = require("mongoose");
const {Schema} = mongoose;

const UserSchema = new Schema({
    name: {type: String, required: true, trim: true},
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {type: String, required: true},
    date: {type: Date, default: Date.now},

    // Email verification
    isVerified: {type: Boolean, default: false},
    otp: {type: String, default: null},
    otpExpiry: {type: Date, default: null},

    // Forgot password
    resetOtp: {type: String, default: null},
    resetOtpExpiry: {type: Date, default: null},
});

const User = mongoose.model("user", UserSchema);
User.createIndexes();
module.exports = User;
