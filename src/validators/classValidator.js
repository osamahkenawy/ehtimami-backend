const { z } = require("zod");

const classSchema = z.object({
    code: z.string().min(3, "Code must be at least 3 characters long"),
    name: z.string().min(2, "Class name must be at least 2 characters long"),
    gradeLevel: z.string().min(1, "Grade level is required"),
    subject: z.string().min(2, "Subject name is required").default("General"),
    semester: z.number().min(1).default(1),
    academic_year: z.string().default("2024-2025"),
    teaching_method: z.enum(["online", "in-person", "hybrid"]).default("in-person"),
    capacity: z.number().min(1).optional().default(30),
    max_students: z.number().min(1).optional().default(35),
    roomNumber: z.string().optional(),
    class_logo: z.string().optional(),
    status: z.enum(["active", "inactive"]).default("active"),
    schedule: z.record(z.string()).optional(),
    start_time: z.string().default("08:00:00"),
    end_time: z.string().default("10:00:00"),
    credits: z.number().min(1).optional().default(3),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    schoolId: z.number(),
    teacherId: z.number().nullable().optional(),
    studentIds: z.array(z.number()).optional()
  });
// ✅ Centralized Validation Messages
const messages = {
  REQUIRED: (field) => `${field} is required.`,
  POSITIVE: (field) => `${field} must be a positive number.`,
  INVALID_ID: (field) => `${field} must be a valid integer.`,
  ENUM: (field) => `${field} must be either 'active' or 'inactive'.`,
};

// ✅ Define Class Update Schema
const classUpdateSchema = z.object({
  id: z.string().refine((id) => !isNaN(Number(id)), {
    message: messages.INVALID_ID("Class ID"),
  }),
  name: z.string().optional(),
  gradeLevel: z.string().optional(),
  capacity: z.number().int().positive(messages.POSITIVE("Capacity")).optional(),
  roomNumber: z.string().optional(),
  status: z.enum(["active", "inactive"], {
    errorMap: () => ({ message: messages.ENUM("Status") })
  }).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

const classCreateSchema = z.object({
  name: z.string({ required_error: messages.REQUIRED("Class name") }).min(1, messages.REQUIRED("Class name")),
  gradeLevel: z.string({ required_error: messages.REQUIRED("Grade level") }).min(1, messages.REQUIRED("Grade level")),
  capacity: z.number().int().positive(messages.POSITIVE("Capacity")).optional(),
  roomNumber: z.string().optional(),
  status: z.enum(["active", "inactive"], {
    errorMap: () => ({ message: messages.ENUM("Status") })
  }).default("active"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  schoolId: z.number({ required_error: messages.REQUIRED("School ID") }).int().positive(messages.POSITIVE("School ID")),
  teacherId: z.number().int().positive(messages.POSITIVE("Teacher ID")).optional().nullable(),
  schedule: z.record(z.string(), z.string().optional()).optional(),
  studentIds: z.array(z.number()).optional() // ✅ support for studentIds
});

// ✅ Middleware to Validate Class Create Request
const validateClassCreate = (req, res, next) => {
  try {
    classCreateSchema.parse(req.body);
    next();
  } catch (error) {
    const errorMessage = error.errors?.[0]?.message || "Invalid request data.";
    return res.status(400).json({ status: 400, message: errorMessage });
  }
};

// ✅ Middleware to Validate Class Update Request
const validateClassUpdate = (req, res, next) => {
  try {
    classUpdateSchema.parse({ id: req.params.id, ...req.body });
    next();
  } catch (error) {
    const errorMessage = error.errors?.[0]?.message || "Invalid request data.";
    return res.status(400).json({ status: 400, message: errorMessage });
  }
};

// ✅ Export using CommonJS
module.exports = {
    classSchema,

  validateClassCreate,
  validateClassUpdate,
};
