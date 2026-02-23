import { PrismaClient } from '@prisma/client';
import { Logger } from '../../utils/Logger';

export class Database {
    public prisma: PrismaClient;
    private logger: Logger;

    constructor() {
        this.prisma = new PrismaClient();
        this.logger = new Logger();
    }

    public async connect() {
        try {
            await this.prisma.$connect();
            this.logger.info('Connected to database.');
        } catch (error) {
            this.logger.error('Failed to connect to database:', error);
            process.exit(1);
        }
    }

    public async disconnect() {
        await this.prisma.$disconnect();
        this.logger.info('Disconnected from database.');
    }

    public async getGuildConfig(guildId: string) {
        return await this.prisma.guildConfig.upsert({
            where: { id: guildId },
            create: { id: guildId, prefix: '!' },
            update: {}
        });
    }
}
