const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// ✅ Create a new user with roles
app.post("/users", async (req, res) => {
    try {
        const { firstName, lastName, email, password, roleIds, bio, avatar } = req.body;

        if (!firstName || !lastName || !email || !password || !roleIds) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password,
                profile: bio || avatar ? { create: { bio, avatar } } : undefined,
                roles: { create: roleIds.map(roleId => ({ roleId })) },
            },
            include: {
                roles: { include: { role: true } },
                profile: true,
            },
        });

        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message || "An unknown error occurred." });
    }
});

// ✅ Assign roles to an existing user
app.post("/users/:userId/roles", async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { roleIds } = req.body;

        if (isNaN(userId) || !roleIds || !Array.isArray(roleIds)) {
            return res.status(400).json({ error: "Invalid user ID or roles." });
        }

        await prisma.userAccessRoles.createMany({
            data: roleIds.map(roleId => ({
                userId,
                roleId,
            })),
            skipDuplicates: true,
        });

        res.json({ message: "Roles assigned successfully." });
    } catch (error) {
        res.status(400).json({ error: error.message || "An unknown error occurred." });
    }
});

// ✅ Fetch all users with their roles
app.get("/users", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: { roles: { include: { role: true } }, profile: true },
        });

        res.json(users);
    } catch (error) {
        res.status(400).json({ error: error.message || "An unknown error occurred." });
    }
});

// ✅ Fetch a user by ID
app.get("/users/:userId", async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { roles: { include: { role: true } }, profile: true },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message || "An unknown error occurred." });
    }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
