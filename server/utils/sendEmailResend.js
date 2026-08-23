const {Resend} = require("resend")

const resend = new Resend(process.env.RESEND_API_KEY)

const sendEmailResend = async ({to, subject, text}) => {
    await resend.emails.send({
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        text: text
    })
}

module.exports = sendEmailResend