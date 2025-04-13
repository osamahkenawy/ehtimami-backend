const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { JWT_SECRET } = require("@config/config");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Hash password
const hashPassword = async (password) => {
    if (!password || typeof password !== "string") {
        throw new Error("Password must be a valid string");
    }
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
};

// ✅ Compare password
const comparePassword = async (password, hash) => {
    if (!password || !hash) {
        throw new Error("Password and hash are required");
    }

    return await bcrypt.compare(password, hash);
};

// ✅ Generate JWT Token (Now Includes All User Details)
const generateToken = (user) => {
    if (!user || !user.id || !user.email || !user.roles) {
        throw new Error("Invalid user object for token generation");
    }

    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in the configuration");
    }

    return jwt.sign(
        {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username || null,
            email: user.email,
            phone: user.phone || null,
            status: user.status,
            is_verified: user.is_verified,
             
            // ✅ Profile Details
            profile: user.profile
                ? {
                      bio: user.profile.bio || null,
                      avatar: user.profile.avatar || null,
                      profile_banner: user.profile.profile_banner || null,
                      nickname: user.profile.nickname || null,
                      occupation: user.profile.occupation || null,
                      company: user.profile.company || null,
                      website: user.profile.website || null,
                      social_links: user.profile.social_links || null,
                      preferences: user.profile.preferences || null,
                      interests: user.profile.interests || null,
                      marital_status: user.profile.marital_status || null,
                      nationality: user.profile.nationality || "Unknown",
                      birth_date: user.profile.birth_date || null,
                      gender: user.profile.gender || 1,
                      address: user.profile.address || null,
                      latitude: user.profile.latitude || null,
                      longitude: user.profile.longitude || null,
                      emergency_contacts: user.profile.emergency_contacts || null,
                      profile_visibility: user.profile.profile_visibility || "public",
                  }
                : null,

            // ✅ Role Details
            roles: user.roles.map(r => r.role.name),

            // ✅ School Assignments
            schools: user.schools
                ? user.schools.map(school => ({
                      id: school.school.id,
                      name: school.school.school_name,
                      type: school.school.school_type,
                      email: school.school.school_email,
                      phone: school.school.school_phone,
                      region: school.school.school_region || null,
                      city: school.school.school_city || null,
                      district: school.school.school_district || null,
                      education_level: school.school.education_level,
                      curriculum: school.school.curriculum,
                      status: school.school.status,
                  }))
                : [],

            // ✅ Parent & Children Relationships
            parent: user.parent ? { id: user.parent.id, name: `${user.parent.firstName} ${user.parent.lastName}` } : null,
            children: user.children ? user.children.map(child => ({ id: child.id, name: `${child.firstName} ${child.lastName}` })) : [],
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
};

const getAllRoles = async () => {
    return await prisma.role.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  };

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    getAllRoles
};
