const crypto = require("crypto")

// Generates a secure 6-digit numeric OTP using crypto instead of Math.random
const generateOtp = () => {
    return crypto.randomInt(100000, 1000000).toString()
}

module.exports = generateOtp
