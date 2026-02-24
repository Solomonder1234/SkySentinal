import { PrismaClient } from '@prisma/client';
import { SkyClient } from '../structures/SkyClient';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { TextChannel } from 'discord.js';

export class BumpService {
    private client: SkyClient;
    private prisma: PrismaClient;
    private timers: Map<string, NodeJS.Timeout> = new Map();

    constructor(client: SkyClient) {
        this.client = client;
        this.prisma = client.database.prisma;
    }

    /**
     * Initialize existing timers from the database on startup
     */
    public async init() {
        this.client.logger.info('[BumpService] Initializing bump timers...');
        const guilds = await (this.prisma.guildConfig as any).findMany({
            where: {
                enableBumpReminder: true,
                lastBumpAt: { not: null },
                bumpChannelId: { not: null }
            }
        });

        for (const guild of guilds) {
            if (!(guild as any).lastBumpAt) continue;

            const now = new Date();
            const lastBump = new Date(guild.lastBumpAt);
            const nextBump = new Date(lastBump.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

            if (nextBump > now) {
                const delay = nextBump.getTime() - now.getTime();
                this.scheduleReminder((guild as any).id, (guild as any).bumpChannelId!, delay);
                this.client.logger.info(`[BumpService] Rescheduled bump reminder for guild ${(guild as any).id} in ${Math.round(delay / 1000 / 60)} minutes.`);
            } else {
                // If it's already past the time, we should notify or just skip? 
                // Better to notify once if it's within a reasonable window (e.g., 30 mins)
                const overdue = now.getTime() - nextBump.getTime();
                if (overdue < 30 * 60 * 1000) {
                    this.sendReminder((guild as any).id, (guild as any).bumpChannelId!);
                }
            }
        }
    }

    /**
     * Start a new bump timer
     */
    public async startTimer(guildId: string, channelId: string) {
        const lastBumpAt = new Date();

        await (this.prisma.guildConfig as any).update({
            where: { id: guildId },
            data: { lastBumpAt, bumpChannelId: channelId }
        });

        // Clear existing timer if any
        if (this.timers.has(guildId)) {
            clearTimeout(this.timers.get(guildId));
        }

        const delay = 2 * 60 * 60 * 1000; // 2 hours
        this.scheduleReminder(guildId, channelId, delay);

        this.client.logger.info(`[BumpService] Started 2-hour bump timer for guild ${guildId}`);
    }

    private scheduleReminder(guildId: string, channelId: string, delay: number) {
        const timer = setTimeout(() => {
            this.sendReminder(guildId, channelId);
            this.timers.delete(guildId);
        }, delay);

        this.timers.set(guildId, timer);
    }

    private async sendReminder(guildId: string, channelId: string) {
        try {
            const channel = await this.client.channels.fetch(channelId).catch(() => null) as TextChannel;
            if (channel) {
                const embed = EmbedUtils.info(
                    '🔔 Disboard Bump Reminder',
                    'It\'s time to bump the server! Use `/bump` to keep our community growing! 🚀'
                ).setColor(0x2ecc71); // Green

                await channel.send({ content: '||@here||', embeds: [embed] });
                this.client.logger.info(`[BumpService] Sent bump reminder to guild ${guildId}`);
            }
        } catch (error) {
            this.client.logger.error(`[BumpService] Failed to send reminder for guild ${guildId}:`, error);
        }
    }
}
