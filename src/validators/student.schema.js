const { z } = require("zod");

const profileSchema = z.object({
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  middleName: z.string().optional(),
  nickname: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().nullable().optional(),
  website: z.string().url().optional(),
  social_links: z.record(z.string()).optional(),
  preferences: z.record(z.any()).optional(),
  interests: z.array(z.string()).optional(),
  marital_status: z.enum(["SINGLE", "MARRIED", "DIVORCED"]).optional(),
  nationality: z.string().optional(),

  // ✅ Parse date strings to Date or null
  birth_date: z.string()
    .transform((val) => {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    })
    .optional(),

  join_date: z.string()
    .transform((val) => {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    })
    .optional(),

  gender: z.number().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  emergency_contacts: z.array(z.object({
    name: z.string(),
    phone: z.string()
  })).optional(),
  profile_visibility: z.string().optional()
});

const studentSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  password: z.string().optional(),
  phone: z.string().optional(), // ✅ ensure it's here
  schoolId: z.number(),
  grade: z.string(),
  section: z.string(),
  student_no: z.string(),
  classIds: z.array(z.number()).optional(),
  profile: profileSchema.optional()
});

const updateStudentSchema = studentSchema.partial().extend({
  email: z.string().email().optional(),
  phone: z.string().optional()
});

module.exports = {
  studentSchema,
  updateStudentSchema
};
