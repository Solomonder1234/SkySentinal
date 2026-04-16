import { TextChannel, EmbedBuilder } from 'discord.js';
import { SkyClient } from '../structures/SkyClient';
import { EmbedUtils } from '../../utils/EmbedUtils';

export class ReminderService {
    private client: SkyClient;
    private checkInterval: NodeJS.Timeout | null = null;
    private readonly CHECK_INTERVAL_MS = 60 * 1000; // 1 Minute

    constructor(client: SkyClient) {
        this.client = client;
    }

    public start() {
        if (this.checkInterval) clearInterval(this.checkInterval);
        this.checkInterval = setInterval(() => this.runCheck(), this.CHECK_INTERVAL_MS);
        this.client.logger.info('[ReminderService] Heartbeat initialized.');
        
        // Immediate check on startup
        this.runCheck();
    }

    public stop() {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    private async runCheck() {
        const now = new Date();
        try {
            // Fetch all reminders that are due
            const dueReminders = await (this.client.database.prisma as any).reminder.findMany({
                where: {
                    expiresAt: { lte: now }
                }
            });

            if (dueReminders.length === 0) return;

            this.client.logger.info(`[ReminderService] Processing ${dueReminders.length} due reminder(s)...`);

            for (const reminder of dueReminders) {
                await this.deliverReminder(reminder);
            }
        } catch (err) {
            this.client.logger.error('[ReminderService] Error scanning for due reminders:', err);
        }
    }

    private async deliverReminder(reminder: any) {
        try {
            const guild = this.client.guilds.cache.get(reminder.guildId);
            const user = await this.client.users.fetch(reminder.userId).catch(() => null);
            
            if (!user) {
                // User left or vanished, just delete record
                await (this.client.database.prisma as any).reminder.delete({ where: { id: reminder.id } });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('⏰ SkySentinel Reminder')
                .setColor('#3498DB')
                .setDescription(`**You asked me to remind you about:**\n\n> ${reminder.message}`)
                .setFooter({ text: 'Automated Logistical Reminder' })
                .setTimestamp(reminder.createdAt);

            let delivered = false;

            // Attempt 1: Send to original channel
            if (guild) {
                const channel = guild.channels.cache.get(reminder.channelId) as TextChannel;
                if (channel && channel.isTextBased()) {
                    await channel.send({ content: `<@${user.id}>`, embeds: [embed] }).then(() => { delivered = true; }).catch(() => {});
                }
            }

            // Attempt 2: DM if channel failed
            if (!delivered) {
                await user.send({ embeds: [embed] }).then(() => { delivered = true; }).catch(() => {});
            }

            // Always delete from DB after delivery attempt (or if all attempts failed)
            await (this.client.database.prisma as any).reminder.delete({ where: { id: reminder.id } });
            
            if (delivered) {
                this.client.logger.info(`[ReminderService] Delivered reminder to ${user.tag} (${reminder.id}).`);
            } else {
                this.client.logger.warn(`[ReminderService] Failed to deliver reminder ${reminder.id} to user ${user.id}.`);
            }
        } catch (err) {
            this.client.logger.error(`[ReminderService] Fatal error delivering reminder ${reminder.id}:`, err);
        }
    }
}
