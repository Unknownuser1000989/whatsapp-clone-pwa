import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = (process.env.JWT_SECRET || 'your-secret-key') as string;

interface AuthenticatedSocket extends Socket {
    userId?: string;
}

export const setupSockets = (io: Server) => {
    // Authentication middleware for sockets
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log('User connected to socket:', socket.userId);

        // Join a room specifically for this user to receive private messages
        if (socket.userId) {
            socket.join(socket.userId);
        }

        socket.on('send_message', async (data: { receiverId: string; content: string }) => {
            const { receiverId, content } = data;
            const senderId = socket.userId;

            if (!senderId) return;

            try {
                const message = await prisma.message.create({
                    data: {
                        content,
                        senderId,
                        receiverId,
                    },
                    include: {
                        sender: { select: { name: true, phone: true } }
                    }
                });

                // Send to receiver
                io.to(receiverId).emit('receive_message', message);

                // Confirm to sender
                socket.emit('message_sent', message);

            } catch (err) {
                console.error('Error sending message:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.userId);
        });

        // --- WebRTC Signaling ---
        socket.on('call_user', (data: { receiverId: string; offer: any; type: 'video' | 'voice' }) => {
            console.log(`Call initiated from ${socket.userId} to ${data.receiverId}`);
            io.to(data.receiverId).emit('incoming_call', {
                callerId: socket.userId,
                offer: data.offer,
                type: data.type
            });
        });

        socket.on('call_accepted', (data: { callerId: string; answer: any }) => {
            console.log(`Call accepted by ${socket.userId} for ${data.callerId}`);
            io.to(data.callerId).emit('call_answered', {
                receiverId: socket.userId,
                answer: data.answer
            });
        });

        socket.on('call_rejected', (data: { callerId: string }) => {
            io.to(data.callerId).emit('call_rejected', {
                receiverId: socket.userId
            });
        });

        socket.on('webrtc_signal', (data: { toId: string; signal: any }) => {
            io.to(data.toId).emit('webrtc_signal', {
                fromId: socket.userId,
                signal: data.signal
            });
        });

        socket.on('end_call', (data: { toId: string }) => {
            io.to(data.toId).emit('call_ended', {
                fromId: socket.userId
            });
        });
    });
};
