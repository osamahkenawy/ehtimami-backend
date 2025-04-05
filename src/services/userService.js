const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { updateUserProfileSchema } = require("@/validators/userProfile.schema");

const formatUser = (user) => ({
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    roles: user.roles.map((r) => r.role.name),
    is_verified: user.is_verified,
    phone: user.phone,
    school: user.schools[0]?.school || null,
    profile: user.profile
        ? { ...user.profile, profileId: user.profile.id }
        : null,
    classes: user.teacherClasses.map((tc) => ({
        id: tc.class.id,
        name: tc.class.name,
    })),
});

const getAllUsers = async () => {
    const users = await prisma.user.findMany({
        include: {
            roles: { include: { role: true } },
            profile: true,
            schools: { include: { school: true } },
            teacherClasses: { include: { class: true } },
        },
    });

    return users.map(formatUser);
};

const getUserById = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            roles: { include: { role: true } },
            profile: true,
            schools: { include: { school: true } },
            teacherClasses: { include: { class: true } },
        },
    });

    return user ? formatUser(user) : null;
};

const getUserByProfileId = async (profileId) => {
    const profile = await prisma.userProfile.findUnique({
        where: { id: profileId },
        include: {
            user: {
                include: {
                    roles: { include: { role: true } },
                    schools: { include: { school: true } },
                    teacherClasses: { include: { class: true } },
                    profile: true,
                },
            },
        },
    });

    return profile?.user ? formatUser(profile.user) : null;
};

const verifyUserById = async (userId, isVerified = true) => {
    if (isNaN(userId)) throw new Error("Invalid user ID.");

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { is_verified: isVerified },
    });

    return updatedUser;
};

/**
 * ✅ Unified update: User + Profile in one API
 */
const updateUserProfile = async (userId, rawPayload) => {
    if (isNaN(userId)) throw new Error("Invalid user ID.");
  
    // ✅ Validate & sanitize with Zod
    const payload = updateUserProfileSchema.parse(rawPayload);
  
    const {
      firstName,
      lastName,
      phone,
      email,
      ...profileFields
    } = payload;
  
    // ✅ Unique phone check
    if (phone) {
      const existing = await prisma.user.findFirst({
        where: {
          phone,
          NOT: { id: userId },
        },
      });
  
      if (existing) {
        const error = new Error("Phone number is already in use.");
        error.status = 400;
        throw error;
      }
    }
  
    // ✅ Convert dates
    if (profileFields.birth_date) profileFields.birth_date = new Date(profileFields.birth_date);
    if (profileFields.join_date) profileFields.join_date = new Date(profileFields.join_date);
  
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        email,
        profile: {
          upsert: {
            create: profileFields,
            update: profileFields,
          },
        },
      },
      include: { profile: true },
    });
  
    return updatedUser;
  };

module.exports = {
    getAllUsers,
    getUserById,
    getUserByProfileId,
    verifyUserById,
    updateUserProfile, // ✅ now handles both User + Profile updates
};
