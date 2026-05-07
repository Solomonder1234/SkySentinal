import { SkyClient } from '../structures/SkyClient';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, EmbedBuilder } from 'discord.js';

export class GiveawayService {
    private client: SkyClient;
    private timer: NodeJS.Timeout | null = null;

    constructor(client: SkyClient) {
        this.client = client;
    }

    /**
     * Initialize the heartbeat to check for ended giveaways
     */
    public startHeartbeat() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.checkGiveaways(), 30000); // Check every 30 seconds
        this.client.logger.info('[GiveawayService] Heartbeat initialized.');

        // Immediate check on startup
        this.checkGiveaways();
    }

    /**
     * Main logic to start a new giveaway
     */
    public async startGiveaway(channel: TextChannel, hostId: string, durationMs: number, winners: number, prize: string) {
        const endsAt = new Date(Date.now() + durationMs);

        const embed = new EmbedBuilder()
            .setTitle('🎁 GIVEAWAY STARTING!')
            .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R> (<t:${Math.floor(endsAt.getTime() / 1000)}:f>)\n**Hosted By:** <@${hostId}>`)
            .setColor('#2B2D31')

            ;

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_giveaway_enter')
                .setLabel('🎉 Enter')
                .setStyle(ButtonStyle.Primary)
        );

        const message = await channel.send({ embeds: [embed], components: [row] });

        await this.client.database.prisma.giveaway.create({
            data: {
                id: message.id,
                guildId: channel.guild.id,
                channelId: channel.id,
                hostId,
                prize,
                winnerCount: winners,
                endsAt,
                status: 'OPEN'
            }
        });

        return message;
    }

    /**
     * Scan database for giveaways that should have ended
     */
    private async checkGiveaways() {
        try {
            const now = new Date();
            const expired = await this.client.database.prisma.giveaway.findMany({
                where: {
                    status: 'OPEN',
                    endsAt: { lte: now }
                }
            });

            for (const giveaway of expired) {
                await this.endGiveaway(giveaway.id);
            }
        } catch (error) {
            this.client.logger.error('[GiveawayService] Error in heartbeat:', error);
        }
    }

    /**
     * Logic to end a giveaway and select winners
     */
    public async endGiveaway(messageId: string) {
        const giveaway = await this.client.database.prisma.giveaway.findUnique({
            where: { id: messageId }
        });

        if (!giveaway || giveaway.status === 'ENDED') return;

        // Mark as ended immediately to prevent race conditions
        await this.client.database.prisma.giveaway.update({
            where: { id: messageId },
            data: { status: 'ENDED' }
        });

        const guild = this.client.guilds.cache.get(giveaway.guildId);
        const channel = guild?.channels.cache.get(giveaway.channelId) as TextChannel;
        if (!channel) return;

        const message = await channel.messages.fetch(messageId).catch(() => null);

        const entries: string[] = JSON.parse(giveaway.entries);
        const winners: string[] = [];

        if (entries.length > 0) {
            const count = Math.min(giveaway.winnerCount, entries.length);
            const pool = [...entries];
            for (let i = 0; i < count; i++) {
                const randomIndex = Math.floor(Math.random() * pool.length);
                const winner = pool.splice(randomIndex, 1)[0];
                if (winner) winners.push(winner);
            }
        }

        if (message && message.embeds[0]) {
            const endEmbed = EmbedBuilder.from(message.embeds[0])
                .setTitle('🎁 GIVEAWAY ENDED!')
                .setColor('#2B2D31')
                .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winners.length > 0 ? winners.map(w => `<@${w}>`).join(', ') : 'No winners (not enough entries)'}\n**Hosted By:** <@${giveaway.hostId}>`)

                ;

            await message.edit({ embeds: [endEmbed], components: [] });
        }

        if (winners.length > 0) {
            await channel.send(`🎊 Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won the **${giveaway.prize}**!`);
        } else {
            await channel.send(`😭 The giveaway for **${giveaway.prize}** ended, but there were no valid entries.`);
        }
    }

    /**
     * Reroll winners for an already ended giveaway
     */
    public async rerollGiveaway(messageId: string) {
        const giveaway = await this.client.database.prisma.giveaway.findUnique({
            where: { id: messageId }
        });

        if (!giveaway || giveaway.status !== 'ENDED') return null;

        const entries: string[] = JSON.parse(giveaway.entries);
        if (entries.length === 0) return null;

        const winner = entries[Math.floor(Math.random() * entries.length)];

        const guild = this.client.guilds.cache.get(giveaway.guildId);
        const channel = guild?.channels.cache.get(giveaway.channelId) as TextChannel;

        if (channel) {
            await channel.send(`🎉 **New Winner Rerolled:** <@${winner}>! You won the **${giveaway.prize}**!`);
        }

        return winner;
    }

    /**
     * Record a user's entry into a giveaway
     */
    public async handleEntry(messageId: string, userId: string): Promise<{ success: boolean; message: string }> {
        const giveaway = await this.client.database.prisma.giveaway.findUnique({
            where: { id: messageId }
        });

        if (!giveaway || giveaway.status !== 'OPEN') {
            return { success: false, message: 'This giveaway has already ended.' };
        }

        const entries: string[] = JSON.parse(giveaway.entries);
        if (entries.includes(userId)) {
            return { success: false, message: 'You have already entered this giveaway!' };
        }

        entries.push(userId);

        await this.client.database.prisma.giveaway.update({
            where: { id: messageId },
            data: { entries: JSON.stringify(entries) }
        });

        return { success: true, message: 'You have successfully entered the giveaway!' };
    }
}
