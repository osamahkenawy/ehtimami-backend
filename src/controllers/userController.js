const { PrismaClient } = require("@prisma/client");
const { successResponse, errorResponse } = require("../utils/responseUtil");

const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                roles: { include: { role: true } },
                profile: true,
                school: true, // ✅ Fetch school information
                teacherClasses: {
                    include: { class: true }, // ✅ Fetch assigned classes (if teacher)
                },
            },
        });

        // 🔥 **Dynamically Format Response**
        const formattedUsers = users.map(user => ({
            userId: user.id, // ✅ Primary user ID
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            roles: user.roles.map(r => r.role.name), // ✅ Convert roles array into role names
            school: user.school ? {
                schoolId: user.school.id,
                school_name: user.school.school_name
            } : null,
            profile: user.profile
                ? { ...user.profile, profileId: user.profile.id } // ✅ Include profile ID
                : null,
            classes: user.teacherClasses.map(tc => ({
                id: tc.class.id,
                name: tc.class.name
            }))
        }));

        return successResponse(res, "Users fetched successfully", formattedUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};
const getUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return errorResponse(res, "Invalid user ID.");
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: { include: { role: true } },
                profile: true,
                school: true, // ✅ Fetch school info
                teacherClasses: {
                    include: { class: true }, // ✅ Fetch assigned classes
                },
            },
        });

        if (!user) {
            return errorResponse(res, "User not found.", 404);
        }

        // 🔥 **Dynamically Format Response**
        const formattedUser = {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            roles: user.roles.map(r => r.role.name),
            school: user.school ? {
                schoolId: user.school.id,
                school_name: user.school.school_name
            } : null,
            profile: user.profile
                ? { ...user.profile, profileId: user.profile.id }
                : null,
            classes: user.teacherClasses.map(tc => ({
                id: tc.class.id,
                name: tc.class.name
            }))
        };

        return successResponse(res, "User fetched successfully", formattedUser);
    } catch (error) {
        console.error("Error fetching user:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};
const getUserByProfileId = async (req, res) => {
    try {
        const profileId = parseInt(req.params.profileId);

        if (isNaN(profileId)) {
            return errorResponse(res, "Invalid profile ID.");
        }

        // 🔍 Find the user using `profileId`
        const profile = await prisma.userProfile.findUnique({
            where: { id: profileId },
            include: {
                user: {
                    include: {
                        roles: { include: { role: true } },
                        school: true,
                        teacherClasses: {
                            include: { class: true },
                        },
                    },
                },
            },
        });

        if (!profile || !profile.user) {
            return errorResponse(res, "User not found.", 404);
        }

        const user = profile.user;

        // 🔥 **Format Response Dynamically**
        const formattedUser = {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            roles: user.roles.map(r => r.role.name),
            school: user.school ? {
                schoolId: user.school.id,
                school_name: user.school.school_name,
                ...user.school
            } : null,
            profile: {
                profileId: profile.id, // ✅ Use `profileId`
                marital_status: profile.marital_status,
                nationality: profile.nationality,
                birth_date: profile.birth_date,
                join_date: profile.join_date,
                gender: profile.gender,
                address: profile.address,
                latitude: profile.latitude,
                longitude: profile.longitude,
                avatar: profile.avatar,
            },
            classes: user.teacherClasses.map(tc => ({
                id: tc.class.id,
                name: tc.class.name
            })),
        };

        return successResponse(res, "User fetched successfully by profile ID.", formattedUser);
    } catch (error) {
        console.error("Error fetching user by profile ID:", error);
        return errorResponse(res, "An unexpected error occurred.");
    }
};

module.exports = { getAllUsers, getUserById , getUserByProfileId };
