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
        if (durationMs === 0 || durationMs > 24 * 60 * 60 * 1000) { // Limit to 24h for simple setTimeout
            return interaction.reply({ content: 'Invalid duration. Please use format like 10m, 1h. Max 24h.' });
        }

        const embed = EmbedUtils.success('Reminder Set', `I will remind you in **${durationStr}**: ${messageStr}`);
        await interaction.reply({ embeds: [embed] });

        setTimeout(async () => {
            const reminderEmbed = EmbedUtils.info('⏰ Reminder', `**You asked me to remind you:**\n${messageStr}`);
            if (interaction instanceof Message) {
                await interaction.reply({ content: `<@${interaction.author.id}>`, embeds: [reminderEmbed] });
            } else {
                // Assuming interaction channel still exists and we can send to it
                // or DM user? Let's try channel send if possible, else DM.
                if (interaction.channel && interaction.channel.type === ChannelType.GuildText) {
                    await (interaction.channel as TextChannel).send({ content: `<@${interaction.user.id}>`, embeds: [reminderEmbed] }).catch(() => { });
                }
            }
        }, durationMs);
    },
} as Command;
