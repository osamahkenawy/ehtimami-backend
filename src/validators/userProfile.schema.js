// src/validators/userProfile.schema.js
const { z } = require("zod");

const updateUserProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),

  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  profile_banner: z.string().url().optional(),
  middleName: z.string().optional(),
  nickname: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url().optional(),
  social_links: z.any().optional(),
  preferences: z.any().optional(),
  interests: z.any().optional(),

  marital_status: z.enum(["SINGLE", "MARRIED", "DIVORCED"]).optional(),
  nationality: z.string().optional(),
  birth_date: z.string().optional(), // Convert to Date manually later
  join_date: z.string().optional(),
  gender: z.number().int().min(1).max(3).optional(), // 1=Male, 2=Female, 3=Other

  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  emergency_contacts: z.any().optional(),
  profile_visibility: z.enum(["public", "private", "school-only"]).optional(),
});

module.exports = { updateUserProfileSchema };
