const nodemailer = require("nodemailer")

// Simple, single-purpose mail helper. Kept intentionally small so it's
// easy to swap the transport later without touching call sites.
const sendEmail = async ({ to, subject, text, html }) => {
    const transporter = nodemailer.createTransport({
        // host: process.env.EMAIL_HOST,
        // port: Number(process.env.EMAIL_PORT) || 587,
        // secure: Number(process.env.EMAIL_PORT) === 465,
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        text,
        html,
    })
}

module.exports = sendEmail
