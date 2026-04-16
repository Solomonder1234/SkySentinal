import { EmbedBuilder, TextChannel } from 'discord.js';
import { SkyClient } from '../structures/SkyClient';
import { EmbedUtils } from '../../utils/EmbedUtils';

export class StaffComplianceService {
    private client: SkyClient;
    private checkInterval: NodeJS.Timeout | null = null;
    private readonly CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 Hours

    constructor(client: SkyClient) {
        this.client = client;
    }

    public start() {
        this.runCheck();
        this.checkInterval = setInterval(() => this.runCheck(), this.CHECK_INTERVAL_MS);
        this.client.logger.info('[StaffComplianceService] Automated compliance daemon initialized.');
    }

    public stop() {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    private async runCheck() {
        this.client.logger.info('[StaffComplianceService] Scanning for compliance deadlines...');
        const now = new Date();

        try {
            const pendingHires = await this.client.database.prisma.pendingStaffJoin.findMany();

            for (const hire of pendingHires as any[]) {
                const guild = this.client.guilds.cache.get(hire.guildId);
                if (!guild) continue;

                const diffHours = (hire.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

                // 1. Termination Condition (Deadline Passed)
                if (diffHours <= 0) {
                    await this.terminateHire(hire, guild);
                    continue;
                }

                // 2. 24-Hour Reminder
                if (diffHours <= 24 && !hire.reminded24h) {
                    await this.sendReminder(hire, guild, '24 hours', 'reminded24h');
                }
                // 3. 3-Day Reminder
                else if (diffHours <= 72 && !hire.reminded3d) {
                    await this.sendReminder(hire, guild, '3 days', 'reminded3d');
                }
            }
        } catch (err) {
            this.client.logger.error('[StaffComplianceService] Error during scan:', err);
        }
    }

    private async sendReminder(hire: any, guild: any, timeText: string, field: string) {
        const user = await this.client.users.fetch(hire.userId).catch(() => null);
        if (!user) return;

        const embed = new EmbedBuilder()
            .setTitle('⚠️ URGENT: Staff Compliance Reminder')
            .setColor('#F1C40F')
            .setDescription(
                `This is an automated notice regarding your staff position in **${guild.name}**.\n\n` +
                `You have **${timeText}** remaining to join the official staff server. Failure to comply will result in an automated termination of your credentials.\n\n` +
                `🔗 **Join Link:** https://discord.gg/URd5UBJ3Wz`
            )
            .setFooter({ text: 'SkySentinel Automated Compliance' })
            .setTimestamp();

        try {
            await user.send({ embeds: [embed] });
            await this.client.database.prisma.pendingStaffJoin.update({
                where: { id: hire.id },
                data: { [field]: true }
            });
            this.client.logger.info(`[StaffComplianceService] Sent ${timeText} reminder to ${user.tag}.`);
        } catch (err) {
            this.client.logger.warn(`[StaffComplianceService] Could not DM reminder to ${user.tag}.`);
        }
    }

    private async terminateHire(hire: any, guild: any) {
        const member = await guild.members.fetch(hire.userId).catch(() => null);
        const rolesToStrip = JSON.parse(hire.roles) as string[];

        this.client.logger.info(`[StaffComplianceService] Terminating hire for ${hire.userId} due to deadline expiration.`);

        if (member) {
            try {
                // Strip roles
                for (const roleId of rolesToStrip) {
                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(roleId).catch(() => null);
                    }
                }

                // DM User
                const dmEmbed = new EmbedBuilder()
                    .setTitle('💀 Termination Notice: Compliance Failure')
                    .setColor('#E74C3C')
                    .setDescription(
                        `Your staff position in **${guild.name}** has been automatically terminated.\n\n` +
                        `**Reason:** Failure to join the official staff server within the 7-day inauguration window.\n\n` +
                        `If you believe this is an error, please contact a Founder or Head of Staff.`
                    )
                    .setFooter({ text: 'SkySentinel Automated Enforcement' })
                    .setTimestamp();

                await member.send({ embeds: [dmEmbed] }).catch(() => null);
            } catch (err) {
                this.client.logger.error(`[StaffComplianceService] Failed to properly strip roles from ${member.id}:`, err);
            }
        }

        // Log to Mod Channel
        const config = await this.client.database.prisma.guildConfig.findUnique({ where: { id: guild.id } });
        const logChannelId = config?.modLogChannelId || '1371279072067321896';
        const logChannel = guild.channels.cache.get(logChannelId) as TextChannel;

        if (logChannel) {
            const logEmbed = EmbedUtils.error(
                '🛡️ Automated Staff Termination',
                `**Target:** <@${hire.userId}> (\`${hire.userId}\`)\n**Reason:** Compliance Failure (7-Day Join Deadline Missed)\n\n**Action:** All granted staff permissions have been automatically revoked.`
            ).setTimestamp();
            await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
        }

        // Delete the record
        await this.client.database.prisma.pendingStaffJoin.delete({ where: { id: hire.id } });
    }
}
