const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const formatUser = (user) => ({
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    roles: user.roles.map(r => r.role.name),
    is_verified: user.is_verified, // ✅ correct location
    school: user.schools[0]?.school
        ? {
            ...user.schools[0]?.school
          }
        : null,
    profile: user.profile
        ? { ...user.profile, profileId: user.profile.id }
        : null,
    classes: user.teacherClasses.map(tc => ({
        id: tc.class.id,
        name: tc.class.name
    }))
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
    if (isNaN(userId)) {
        throw new Error("Invalid user ID.");
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { is_verified: isVerified },
    });

    return updatedUser;
};
const updateUserProfile = async (userId, payload) => {
    if (isNaN(userId)) throw new Error("Invalid user ID.");

    const {
        phone,
        bio,
        avatar,
        profile_banner,
        middleName,
        nickname,
        occupation,
        company,
        website,
        social_links,
        preferences,
        interests,
        marital_status,
        nationality,
        birth_date,
        join_date,
        gender,
        address,
        latitude,
        longitude,
        emergency_contacts,
        profile_visibility,
    } = payload;

    // Build user-level update (e.g., phone)
    const dataToUpdate = {};
    if (typeof phone !== "undefined") dataToUpdate.phone = phone;

    // Fields to update in UserProfile (key => value)
    const profileFields = {
        bio,
        avatar,
        profile_banner,
        middleName,
        nickname,
        occupation,
        company,
        website,
        social_links,
        preferences,
        interests,
        marital_status,
        nationality,
        gender,
        address,
        latitude,
        longitude,
        emergency_contacts,
        profile_visibility,
    };

    // Convert date fields safely
    if (birth_date) profileFields.birth_date = new Date(birth_date);
    if (join_date) profileFields.join_date = new Date(join_date);

    // Filter out undefined values
    const profileUpdate = Object.entries(profileFields).reduce((acc, [key, value]) => {
        if (typeof value !== "undefined") {
            acc[key] = value;
        }
        return acc;
    }, {});

    // Run Prisma update
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            ...dataToUpdate,
            profile: {
                upsert: {
                    create: profileUpdate,
                    update: profileUpdate,
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
    updateUserProfile,
};
