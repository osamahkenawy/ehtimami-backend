const { z } = require("zod");

const studentSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  schoolId: z.number(),
  grade: z.string().min(1),
  section: z.string().optional(),
  student_no: z.string().min(1)
});

const validateCreateStudent = (req, res, next) => {
  try {
    studentSchema.parse(req.body);
    next();
  } catch (err) {
    const message = err.errors?.[0]?.message || "Invalid student data";
    return res.status(400).json({ status: 400, message });
  }
};

module.exports = { validateCreateStudent };
