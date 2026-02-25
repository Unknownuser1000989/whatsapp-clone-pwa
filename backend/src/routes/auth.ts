import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = (process.env.JWT_SECRET || 'your-secret-key') as string;

// Register
router.post('/register', async (req, res) => {
    const { phone, password, name } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({ where: { phone } });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { phone, password: hashedPassword, name }
        });

        res.status(201).json({ message: 'User created', userId: user.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, phone: user.phone, name: user.name } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List all users (for testing discovery)
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, phone: true, name: true }
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search user by phone or ID
router.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Search query required' });

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: String(query) },
                    { id: String(query) }
                ]
            },
            select: { id: true, phone: true, name: true }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get message history with another user
router.get('/messages/:otherId', async (req, res) => {
    const { otherId } = req.params;
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token as any, JWT_SECRET) as any;
        const myId = decoded.userId;

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: myId, receiverId: otherId },
                    { senderId: otherId, receiverId: myId }
                ]
            },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { name: true, phone: true, id: true } }
            }
        });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete chat history with another user
router.delete('/messages/:otherId', async (req, res) => {
    const { otherId } = req.params;
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token as any, JWT_SECRET) as any;
        const myId = decoded.userId;

        await prisma.message.deleteMany({
            where: {
                OR: [
                    { senderId: myId, receiverId: otherId },
                    { senderId: otherId, receiverId: myId }
                ]
            }
        });
        res.json({ message: 'Chat history deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user account (and all their messages)
router.delete('/user', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token as any, JWT_SECRET) as any;
        const myId = decoded.userId;

        // Delete all messages sent or received by the user
        await prisma.message.deleteMany({
            where: {
                OR: [
                    { senderId: myId },
                    { receiverId: myId }
                ]
            }
        });

        // Delete the user
        await prisma.user.delete({
            where: { id: myId }
        });

        res.json({ message: 'Account deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
