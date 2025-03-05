const { z } = require("zod");

// ✅ Define Class Update Schema
const classUpdateSchema = z.object({
    id: z.string().refine((id) => !isNaN(Number(id)), {
        message: "Class ID must be a valid integer.",
    }),
    name: z.string().optional(),
    gradeLevel: z.string().optional(),
    capacity: z.number().int().positive().optional(),
    roomNumber: z.string().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
});

const classCreateSchema = z.object({
    name: z.string().min(1, "Class name is required."),
    gradeLevel: z.string().min(1, "Grade level is required."),
    capacity: z.number().int().positive().optional(),
    roomNumber: z.string().optional(),
    status: z.enum(["active", "inactive"]).default("active"),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    schoolId: z.number().int().positive("School ID must be a valid integer."),
    teacherId: z.number().int().positive().optional().nullable(),
    schedule: z.record(z.string(), z.string().optional()).optional(), // Validate schedule as an object
});
const validateClassCreate = (req, res, next) => {
    try {
        classCreateSchema.parse(req.body);
        next();
    } catch (error) {
        const errorMessage = error.errors?.[0]?.message || "Invalid request data.";
        return res.status(400).json({ status: 400, message: errorMessage });
    }
};
// ✅ Middleware to Validate Request
const validateClassUpdate = (req, res, next) => {
    try {
        // Validate params (id) and body
        classUpdateSchema.parse({ id: req.params.id, ...req.body });
        next();
    } catch (error) {
        const errorMessage = error.errors?.[0]?.message || "Invalid request data.";
        return res.status(400).json({ status: 400, message: errorMessage });
    }
};

// ✅ Export using CommonJS
module.exports = {
    validateClassCreate,
    validateClassUpdate,
};
