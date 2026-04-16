import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'remind24h',
    description: 'Set a 24-hour reminder instantly.',
    category: 'Utility',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.SendMessages,
    options: [
        {
            name: 'message',
            description: 'What to remind you about.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let messageStr: string;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (!args[0]) return interaction.reply({ content: 'Usage: !remind24h <message>' });
            messageStr = args.join(' ');
        } else {
            messageStr = (interaction as any).options.getString('message', true);
        }

        const durationMs = 24 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + durationMs);

        try {
            await (client.database.prisma as any).reminder.create({
                data: {
                    guildId: interaction.guildId!,
                    channelId: interaction.channelId,
                    userId: interaction instanceof Message ? interaction.author.id : interaction.user.id,
                    message: messageStr,
                    expiresAt: expiresAt
                }
            });

            const embed = EmbedUtils.success('24-Hour Reminder Set', `I have recorded your reminder.\n\n**Notification Date:** <t:${Math.floor(expiresAt.getTime() / 1000)}:F>\n**Message:** ${messageStr}`);
            await interaction.reply({ embeds: [embed] });

        } catch (err) {
            client.logger.error('[Remind24h Command] Error:', err);
            await interaction.reply({ content: 'Failed to sync reminder to database. ❌' });
        }
    },
} as Command;
