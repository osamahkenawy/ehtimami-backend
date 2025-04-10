const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const { hashPassword } = require("@/services/authService");
const { sendEmail, getEmailTemplate } = require("@/utils/emailUtil");

const prisma = new PrismaClient();

const requestPasswordReset = async (email) => {
    if (!email || typeof email !== "string") {
        throw new Error("Email is required and must be a string");
    }
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) throw new Error("No user found with this email");

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 mins

    await prisma.passwordResetToken.create({
        data: {
            userId: user.id,
            token,
            expiresAt,
        },
    });

    const resetLink = `http://localhost:5173/auth/reset-password?token=${token}`;
    const html = getEmailTemplate("forgotPassword", {
        firstName: user.firstName,
        resetLink,
    });

    await sendEmail(email, "Reset your password", html);
};

const resetPasswordWithToken = async (token, newPassword) => {
    const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
        throw new Error("Invalid or expired token");
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    // ✅ Send confirmation email
    const confirmationHtml = getEmailTemplate("resetConfirmation", {
        firstName: resetToken.user.firstName,
        supportEmail: "support@ehtimami.com", // or dynamically pull from config
    });

    await sendEmail(resetToken.user.email, "Your password has been successfully reset", confirmationHtml);
};
module.exports = {
    requestPasswordReset,
    resetPasswordWithToken,
};
