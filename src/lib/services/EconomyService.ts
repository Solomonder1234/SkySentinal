import { PrismaClient } from '@prisma/client';

export class EconomyService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async getUserProfile(userId: string) {
        let profile = await this.prisma.userProfile.findUnique({
            where: { id: userId },
            include: { inventory: true }
        });

        if (!profile) {
            profile = await this.prisma.userProfile.create({
                data: { id: userId },
                include: { inventory: true }
            });
        }

        return profile;
    }

    async getBalance(userId: string) {
        const profile = await this.getUserProfile(userId);
        return { wallet: profile.balance, bank: profile.bank };
    }

    async addWallet(userId: string, amount: number | bigint) {
        return this.prisma.userProfile.update({
            where: { id: userId },
            data: { balance: { increment: BigInt(amount) } }
        });
    }

    async removeWallet(userId: string, amount: number | bigint) {
        return this.prisma.userProfile.update({
            where: { id: userId },
            data: { balance: { decrement: BigInt(amount) } }
        });
    }

    async addBank(userId: string, amount: number | bigint) {
        return this.prisma.userProfile.update({
            where: { id: userId },
            data: { bank: { increment: BigInt(amount) } }
        });
    }

    async removeBank(userId: string, amount: number | bigint) {
        return this.prisma.userProfile.update({
            where: { id: userId },
            data: { bank: { decrement: BigInt(amount) } }
        });
    }

    async deposit(userId: string, amount: number | bigint) {
        const profile = await this.getUserProfile(userId);
        const bigAmount = BigInt(amount);
        if (profile.balance < bigAmount) return false;

        await this.prisma.userProfile.update({
            where: { id: userId },
            data: {
                balance: { decrement: bigAmount },
                bank: { increment: bigAmount }
            }
        });
        return true;
    }

    async withdraw(userId: string, amount: number | bigint) {
        const profile = await this.getUserProfile(userId);
        const bigAmount = BigInt(amount);
        if (profile.bank < bigAmount) return false;

        await this.prisma.userProfile.update({
            where: { id: userId },
            data: {
                bank: { decrement: bigAmount },
                balance: { increment: bigAmount }
            }
        });
        return true;
    }

    async seedShop(guildId: string) {
        const count = await this.prisma.shopItem.count({ where: { guildId } });
        if (count > 0) return;

        await this.prisma.shopItem.createMany({
            data: [
                { guildId, name: 'VIP Role', description: 'Gives you the VIP role!', price: 10000, roleId: 'VIP' }, // Placeholder Role ID
                { guildId, name: 'Laptop', description: 'A sleek laptop for working remotely.', price: 2000 },
                { guildId, name: 'Padlock', description: 'Keeps your wallet safe from robbers.', price: 500 },
                { guildId, name: 'Coffee', description: 'Keeps you awake.', price: 50 },
            ]
        });
        console.log(`[Economy] Seeded shop for guild ${guildId}`);
    }

    async getShopItems(guildId: string) {
        return this.prisma.shopItem.findMany({ where: { guildId } });
    }

    async buyItem(userId: string, guildId: string, itemName: string) {
        const item = await this.prisma.shopItem.findFirst({
            where: {
                guildId,
                name: { equals: itemName } // Case sensitive for now, maybe fix later
            }
        });

        if (!item) return { success: false, message: 'Item not found.' };

        const profile = await this.getUserProfile(userId);
        if (profile.balance < BigInt(item.price)) return { success: false, message: 'Insufficient funds.' };

        // Transaction
        await this.prisma.$transaction([
            this.prisma.userProfile.update({
                where: { id: userId },
                data: { balance: { decrement: BigInt(item.price) } }
            }),
            this.prisma.inventoryItem.create({
                data: {
                    userId,
                    itemId: item.id,
                    name: item.name,
                    amount: 1 // TODO: Handle stacking
                }
            })
        ]);

        return { success: true, item };
    }

    async getInventory(userId: string) {
        return this.prisma.inventoryItem.findMany({ where: { userId } });
    }
}
