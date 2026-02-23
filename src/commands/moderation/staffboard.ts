import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits, Message, EmbedBuilder, ColorResolvable, GuildMember } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'staffboard',
    description: 'Displays a real-time overview of server operations and staff activity.',
    category: 'Moderation',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator, // Only Admin+ can see the full dashboard
    run: async (client, interaction) => {
        // Only allow Founder/Co-Founder/HOS if roles are managed that way, or just stick to Administrator permission
        // For SkySentinel, we'll check for the "Supreme Authority" (Owner or Admin)
        const isOwner = interaction.guild?.ownerId === (interaction instanceof Message ? interaction.author.id : interaction.user.id);
        const member = interaction.member as GuildMember;
        const isAdmin = member?.permissions.has(PermissionFlagsBits.Administrator);

        if (!isOwner && !isAdmin) {
            const err = EmbedUtils.error('Access Denied', 'The Supreme Staff Dashboard is reserved for High Leadership (Administrator+).');
            return interaction.reply({ embeds: [err], ephemeral: true });
        }

        if (!(interaction instanceof Message)) await interaction.deferReply({ ephemeral: true });

        try {
            const guildId = interaction.guildId!;

            // 1. Fetch Applications Status
            const pendingApps = await client.database.prisma.application.count({
                where: { guildId, status: 'PENDING_REVIEW' }
            });
            const inProgressApps = await client.database.prisma.application.count({
                where: { guildId, status: 'IN_PROGRESS' }
            });

            // 2. Fetch Active Suspensions
            const activeSuspensions = await client.database.prisma.suspension.count({
                where: { guildId, active: true }
            });

            // 3. Fetch Recent Strikes (last 24 hours)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentStrikes = await client.database.prisma.case.count({
                where: {
                    guildId,
                    type: 'WARN',
                    createdAt: { gte: yesterday }
                }
            });

            // 4. System Health Data
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const formattedUptime = `${hours}h ${minutes}m`;

            const embed = new EmbedBuilder()
                .setTitle('📊 SkySentinel Supreme: Global Staff Dashboard')
                .setThumbnail(client.user?.displayAvatarURL() || null)
                .setColor('#2F3136' as ColorResolvable)
                .addFields(
                    {
                        name: '🛡️ Moderation Activity (24h)',
                        value: `*   **Recent Strikes:** \`${recentStrikes}\`\n*   **Active Suspensions:** \`${activeSuspensions}\``,
                        inline: false
                    },
                    {
                        name: '📝 Recruitment Pipeline',
                        value: `*   **Pending Review:** \`${pendingApps}\`\n*   **In Progress:** \`${inProgressApps}\``,
                        inline: false
                    },
                    {
                        name: '⚙️ System Architecture',
                        value: `*   **Version:** \`v${require('../../../package.json').version}\`\n*   **Uptime:** \`${formattedUptime}\`\n*   **AI Core:** \`Gemini-1.5-Flash (Active)\`\n*   **Vision Guard:** \`Online\``,
                        inline: false
                    }
                )
                .setFooter({ text: 'Confidential Staff Overview • Supreme Design Edition' })
                .setTimestamp();

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            client.logger.error('[StaffBoard] Dashboard Generation Failed:', error);
            const err = EmbedUtils.error('Internal System Failure', 'Failed to synchronize dashboard data with the central database.');
            if (interaction instanceof Message) return interaction.reply({ embeds: [err] });
            return interaction.editReply({ embeds: [err] });
        }
    },
} as Command;
