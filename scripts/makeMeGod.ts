import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const ownerId = '753372101540577431';
    await prisma.userProfile.upsert({
        where: { id: ownerId },
        update: {
            level: 999999,
            xp: 999999999999n,
            balance: 999999999999n,
            bank: 999999999999n
        },
        create: {
            id: ownerId,
            level: 999999,
            xp: 999999999999n,
            balance: 999999999999n,
            bank: 999999999999n
        }
    });
    console.log('Database updated: Level Infinity achieved for owner.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
