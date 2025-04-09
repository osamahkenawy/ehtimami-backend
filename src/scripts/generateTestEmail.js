const nodemailer = require("nodemailer");

async function main() {
    const testAccount = await nodemailer.createTestAccount();

    console.log("✅ Test account created:");
    console.log(`EMAIL_USER=${testAccount.user}`);
    console.log(`EMAIL_PASS=${testAccount.pass}`);
    console.log(`EMAIL_HOST=${testAccount.smtp.host}`);
    console.log(`EMAIL_PORT=${testAccount.smtp.port}`);
    console.log(`Preview URL: https://ethereal.email/message/<message_id>`);
}

main().catch(console.error);
