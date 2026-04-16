import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, ChannelType, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

function parseDuration(duration: string): number {
    const regex = /(\d+)(s|m|h|d)/;
    const match = duration.match(regex);
    if (!match || !match[1] || !match[2]) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 0;
    }
}

export default {
    name: 'reminder',
    description: 'Set a reminder.',
    category: 'Utility',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.SendMessages,
    options: [
        {
            name: 'duration',
            description: 'When to remind you (e.g., 10m, 1h).',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'message',
            description: 'What to remind you about.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let durationStr: string;
        let messageStr: string;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (!args[0] || !args[1]) return interaction.reply({ content: 'Usage: !reminder <duration> <message>' });
            durationStr = args[0];
            messageStr = args.slice(1).join(' ');
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            durationStr = chatInteraction.options.getString('duration', true);
            messageStr = chatInteraction.options.getString('message', true);
        }

        const durationMs = parseDuration(durationStr);
        if (durationMs === 0) {
            return interaction.reply({ content: 'Invalid duration! Please use format like `10m`, `1h`, or `3d`. ⏱️' });
        }

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

            const embed = EmbedUtils.success('Reminder Synchronized', `I have recorded your reminder in the permanent database.\n\n**Duration:** ${durationStr}\n**Notification Date:** <t:${Math.floor(expiresAt.getTime() / 1000)}:F> (<t:${Math.floor(expiresAt.getTime() / 1000)}:R>)\n**Message:** ${messageStr}`);
            await interaction.reply({ embeds: [embed] });

        } catch (err) {
            client.logger.error('[Reminder Command] Error saving to DB:', err);
            await interaction.reply({ content: 'I encountered a firewall error synchronizing your reminder to the database! ❌', ephemeral: true });
        }
    },
} as Command;
