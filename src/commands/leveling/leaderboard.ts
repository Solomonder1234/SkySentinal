import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'leaderboard',
    description: 'Show the top 10 users by XP.',
    category: 'Leveling',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.SendMessages,
    aliases: ['top'],
    run: async (client, interaction) => {
        const topUsers = await client.database.prisma.userProfile.findMany({
            orderBy: { xp: 'desc' },
            take: 10
        });

        if (topUsers.length === 0) {
            return interaction.reply({ content: 'No one has earned XP yet!' });
        }

        const description = topUsers.map((user, index) => {
            return `${index + 1}. <@${user.id}> - **Lvl ${user.level.toLocaleString()}** (${user.xp.toLocaleString()} XP)`;
        }).join('\n');

        const embed = EmbedUtils.info('🏆 XP Leaderboard', description);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
