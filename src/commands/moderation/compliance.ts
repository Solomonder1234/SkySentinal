import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'compliance',
    description: 'View the Staff Onboarding Compliance Dashboard.',
    category: 'Moderation',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    run: async (client, interaction) => {
        if (!interaction.guild) return;

        // Restriction: HOS/Founder Only
        let hasPermission = false;
        if (interaction.member?.user.id === interaction.guild.ownerId || interaction.member?.user.id === '753372101540577431') {
            hasPermission = true;
        } else {
            const memberRoles = interaction.member?.roles as any;
            if (memberRoles.cache && memberRoles.cache.some((r: any) => ['founder', 'head of staff', 'hos'].includes(r.name.toLowerCase()))) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            return interaction.reply({ embeds: [EmbedUtils.error('Access Denied', 'This dashboard is restricted to **Head of Staff** and **Founder** clears.')], ephemeral: true });
        }

        try {
            const pendingHires = await client.database.prisma.pendingStaffJoin.findMany({
                where: { guildId: interaction.guild.id },
                orderBy: { expiresAt: 'asc' }
            });

            if (pendingHires.length === 0) {
                return interaction.reply({ embeds: [EmbedUtils.info('Compliance Dashboard', 'No pending staff hires are currently active. All personnel are in compliance. ✅')] });
            }

            const description = pendingHires.map((h: any) => {
                const diff = h.expiresAt.getTime() - Date.now();
                const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hoursLeft = Math.floor((diff / (1000 * 60 * 60)) % 24);
                
                let statusEmoji = '🟢';
                if (daysLeft < 1) statusEmoji = '🔴';
                else if (daysLeft < 3) statusEmoji = '🟡';

                return `${statusEmoji} <@${h.userId}> - **Expires in:** ${daysLeft}d ${hoursLeft}h\n` +
                       `↳ *Reminders:* ${h.reminded3d ? '✅ 3d' : '❌ 3d'} | ${h.reminded24h ? '✅ 24h' : '❌ 24h'}`;
            }).join('\n\n');

            const embed = EmbedUtils.info('🛡️ SkySentinel Staff Compliance Dashboard', description)
                .setFooter({ text: `Monitoring ${pendingHires.length} pending inauguration(s)` });

            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            client.logger.error('[Compliance Command] Error:', err);
            await interaction.reply({ content: 'Failed to access compliance database.', ephemeral: true });
        }
    },
} as Command;
