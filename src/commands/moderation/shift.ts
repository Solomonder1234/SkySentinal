import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'shift',
    description: 'Manage your staff shift.',
    category: 'Moderation',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'action',
            description: 'Start or end your shift.',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Start Shift', value: 'start' },
                { name: 'End Shift', value: 'end' },
            ],
        },
    ],
    run: async (client, interaction) => {
        const action = interaction instanceof Message 
            ? interaction.content.split(' ')[1]?.toLowerCase() 
            : (interaction as ChatInputCommandInteraction).options.getString('action', true);

        if (action !== 'start' && action !== 'end') {
            return interaction.reply({ content: 'Invalid action. Use `/shift start` or `/shift end`.' });
        }

        const userId = interaction.member?.user.id!;
        const guildId = interaction.guild?.id!;

        if (action === 'start') {
            // Check if they already have an active shift
            const activeShift = await client.prisma.staffShift.findFirst({
                where: { userId, guildId, status: 'ACTIVE' }
            });

            if (activeShift) {
                return interaction.reply({ embeds: [EmbedUtils.error('Shift Error', 'You already have an active shift running!')] });
            }

            await client.prisma.staffShift.create({
                data: {
                    userId,
                    guildId,
                    startTime: new Date(),
                    status: 'ACTIVE'
                }
            });

            return interaction.reply({ embeds: [EmbedUtils.success('Shift Started', 'You are now **clocked in**. Your activity and duration are being tracked.')] });
        } else {
            // End Shift
            const activeShift = await client.prisma.staffShift.findFirst({
                where: { userId, guildId, status: 'ACTIVE' }
            });

            if (!activeShift) {
                return interaction.reply({ embeds: [EmbedUtils.error('Shift Error', 'You do not have an active shift to end.')] });
            }

            const endTime = new Date();
            const durationMs = endTime.getTime() - activeShift.startTime.getTime();
            const durationMinutes = Math.floor(durationMs / 60000);

            await client.prisma.staffShift.update({
                where: { id: activeShift.id },
                data: {
                    endTime,
                    duration: durationMinutes,
                    status: 'COMPLETED'
                }
            });

            return interaction.reply({ 
                embeds: [EmbedUtils.info('Shift Completed', `You have **clocked out**.\n\n**Duration:** ${durationMinutes} minutes.`)] 
            });
        }
    },
} as Command;
