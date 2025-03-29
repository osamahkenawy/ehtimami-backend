const nodemailer = require("nodemailer");
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = require("@config/config");
const fs = require("fs");
const path = require("path");
/**
 * Send an email to the school manager with login credentials
 */
const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"Ehtimami Support" <${EMAIL_USER}>`,
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}`);
    } catch (error) {
        console.error(`❌ Email failed: ${error.message}`);
    }
};
const getEmailTemplate = (templateName, variables) => {
    const templatePath = path.join(__dirname, "../emailTemplates", `${templateName}.html`);

    try {
        let templateContent = fs.readFileSync(templatePath, "utf-8");

        // Replace placeholders in the template
        Object.keys(variables).forEach((key) => {
            const regex = new RegExp(`{{${key}}}`, "g");
            templateContent = templateContent.replace(regex, variables[key]);
        });

        return templateContent;
    } catch (error) {
        console.error(`Error reading email template: ${templateName}`, error);
        return "";
    }
};


module.exports = { sendEmail , getEmailTemplate };
