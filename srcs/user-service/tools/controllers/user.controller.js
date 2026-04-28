import prisma from '../conf/db.js';
import bcrypt from 'bcrypt';

export const getUsers = async (request, reply) => {
    try {
        const users = await prisma.user.findMany(); 
        return reply.code(200).send({ message: 'All users fetched successfully!', data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return reply.code(500).send({ error: 'An error occurred while fetching users.', details: error.message });
    }
};

export const userInfo = async (req, res) => {
    try {

        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).send({ error: "Unauthorized: User ID not provided by gateway." });
        }

        const userWithProfileData = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                achievements: { include: { achievement: true } },
                recentActivities: { orderBy: { createdAt: "desc" }, take: 5 },
            },
        });

        if (!userWithProfileData) {
            return res.status(404).send({ error: "User not found." });
        }

        const medals = { gold: 0, silver: 0, bronze: 0 };
        let totalAchievements = 0;

        userWithProfileData.achievements?.forEach((ua) => {
            const tier = ua.achievement.tier.toLowerCase();
            const count = ua.count ?? 1;
            if (medals[tier] !== undefined) {
                medals[tier] += count;
                totalAchievements += count;
            }
        });

        const { password, twoFactorSecret, ...user } = userWithProfileData;

        return res.status(200).send({ data: { ...user, medals, totalAchievements } });
    } catch (error) {
        console.error("Error fetching user info:", error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
};

export const getUser = async (request, reply) => {
    try {
        const { id } = request.params;
        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) return reply.code(404).send({ message: `User with ID ${id} not found.` });

        return reply.code(200).send({ message: `User with ID ${id} fetched successfully!`, data: user });
    } catch (error) {
        console.error('Error fetching user:', error);
        return reply.code(500).send({ error: 'An error occurred while fetching the user.', details: error.message });
    }
};

export const leaderboard = async (req, reply) => { 
    try {
        const users = await prisma.user.findMany({ orderBy: [{ level: 'desc' }, { xp: 'desc' }] });
        return reply.code(200).send({ message: 'Leaderboard fetched successfully!', data: users });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return reply.code(500).send({ error: 'An error occurred while fetching the leaderboard.', details: error.message });
    }
};

export const searchUsersByName = async (request, reply) => {
    try {
        const { name } = request.query;
        if (!name) return reply.code(400).send({ message: 'Name query parameter is required.' });

        const users = await prisma.user.findMany({
            where: { name: { startsWith: name.toLowerCase() } },
        });

        if (!users.length) return reply.code(404).send({ message: `No users found starting with "${name}".` });

        return reply.code(200).send({ message: `Users starting with "${name}" fetched successfully!`, data: users });
    } catch (error) {
        console.error('Error searching users:', error);
        return reply.code(500).send({ error: 'An error occurred while searching for users.', details: error.message });
    }
};

export const addUser = async (request, reply) => {
    try {
        const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body ?? {});
        const { name, email } = body;

        if (!name || !email) return reply.code(400).send({ error: 'Name and email are required.' });

        const newUser = await prisma.user.create({ data: { name, email } });
        return reply.code(201).send({ message: 'User created successfully!', data: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return reply.code(409).send({ error: 'Email already in use.' });
        }
        return reply.code(500).send({ error: 'An error occurred while creating the user.', details: error.message });
    }
};

export const updateUser = async (request, reply) => {
    try {
        const { id } = request.params;
        const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body ?? {});
        const { name, email, password } = body;

        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { ...(name && { name }), ...(email && { email }), ...(hashedPassword && { password: hashedPassword }) },
        });

        return reply.code(200).send({ message: `User with ID ${id} updated successfully!`, data: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        return reply.code(500).send({ error: "An error occurred while updating the user.", details: error.message });
    }
};

export const deleteUser = async (request, reply) => {
    try {
        const { id } = request.params;
        const deletedUser = await prisma.user.delete({ where: { id } });
        return reply.code(200).send({ message: `User with ID ${id} deleted successfully!`, data: deletedUser });
    } catch (error) {
        console.error('Error deleting user:', error);
        return reply.code(500).send({ error: 'An error occurred while deleting the user.', details: error.message });
    }
};
