import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    const messages = await prisma.message.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log('Users:', users.map(u => ({ id: u.id, phone: u.phone })));
    console.log('Recent Messages:', messages);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
