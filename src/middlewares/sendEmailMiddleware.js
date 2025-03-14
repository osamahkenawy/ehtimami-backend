const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "Gmail", // Use your email service (e.g., Gmail, SendGrid, SMTP)
    auth: {
        user: process.env.EMAIL_USER, // Store in .env
        pass: process.env.EMAIL_PASS  // Store in .env
    }
});

/**
 * ✅ Function to send an email
 */
const sendEmail = async (to, subject, htmlContent) => {
    try {
        await transporter.sendMail({
            from: `"School System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent
        });
        console.log(`✅ Email sent to ${to}`);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
};

module.exports = { sendEmail };
