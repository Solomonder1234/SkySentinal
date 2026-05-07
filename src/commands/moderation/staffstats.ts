import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Message, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'staffstats',
    description: 'View your staff activity and statistics.',
    category: 'Moderation',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'The staff member to view stats for (Defaults to you).',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        const targetUser = (interaction instanceof Message) 
            ? (interaction.mentions.users.first() || interaction.author) 
            : ((interaction as ChatInputCommandInteraction).options.getUser('user') || interaction.user);

        const userId = targetUser.id;
        const guildId = interaction.guild?.id!;

        // Timeframe: Last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // 1. Fetch Shift History
        const shifts = await client.prisma.staffShift.findMany({
            where: {
                userId,
                guildId,
                startTime: { gte: sevenDaysAgo },
                status: 'COMPLETED'
            }
        });

        const totalMinutes = shifts.reduce((acc: number, shift: any) => acc + (shift.duration || 0), 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        // 2. Fetch Moderation Actions (Cases)
        const cases = await client.prisma.case.count({
            where: {
                moderatorId: userId,
                guildId,
                createdAt: { gte: sevenDaysAgo }
            }
        });

        // 3. Current Shift Status
        const activeShift = await client.prisma.staffShift.findFirst({
            where: { userId, guildId, status: 'ACTIVE' }
        });

        const lastShift = shifts[0];
        const embed = new EmbedBuilder()
            .setTitle(`🛡️ Staff Activity Hub: ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '⏱️ Total Shift Time (7d)', value: `\`${hours}h ${minutes}m\``, inline: true },
                { name: '⚖️ Cases Logged (7d)', value: `\`${cases} actions\``, inline: true },
                { name: '📊 Active Status', value: activeShift ? '🟢 **On Shift**' : '🔴 **Off Shift**', inline: true },
                { name: '🗓️ Recent Activity', value: lastShift 
                    ? `Last shift was ${lastShift.startTime.toLocaleDateString()} for ${lastShift.duration} mins.` 
                    : 'No completed shifts this week.' }
            )
            .setColor('#2B2D31')

            ;

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
