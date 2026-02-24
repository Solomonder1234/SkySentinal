import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, ChannelType, TextChannel, ChatInputCommandInteraction, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'setbumpreminder',
    description: 'Configure the Disboard bump reminder.',
    category: 'Configuration',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    options: [
        {
            name: 'enabled',
            description: 'Whether to enable the bump reminder.',
            type: ApplicationCommandOptionType.Boolean,
            required: true,
        },
        {
            name: 'channel',
            description: 'The channel to send reminders in.',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
        }
    ],
    run: async (client, interaction) => {
        let enabled: boolean;
        let channelId: string | null = null;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (!args[0]) return interaction.reply({ content: '❌ Usage: `!setbumpreminder <true|false> [#channel]`' });
            enabled = args[0].toLowerCase() === 'true';

            const channelMention = (interaction as Message).mentions.channels.first();
            channelId = channelMention?.id || interaction.channelId;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            enabled = chatInteraction.options.getBoolean('enabled', true);
            const channel = chatInteraction.options.getChannel('channel') as TextChannel | null;
            channelId = channel?.id || chatInteraction.channelId;
        }

        if (enabled && !channelId) {
            return interaction.reply({ content: '❌ You must specify a channel or run this command in the desired channel to enable reminders.', ephemeral: true });
        }

        await client.database.prisma.guildConfig.upsert({
            where: { id: interaction.guildId! },
            create: {
                id: interaction.guildId!,
                enableBumpReminder: enabled,
                bumpChannelId: enabled ? channelId : null
            },
            update: {
                enableBumpReminder: enabled,
                bumpChannelId: enabled ? channelId : null
            }
        });

        const statusLabel = enabled ? 'ENABLED' : 'DISABLED';
        const embed = EmbedUtils.success(
            'Disboard Bump Reminder Updated',
            `The bump reminder has been **${statusLabel}**. ${enabled ? `\nReminders will be sent in <#${channelId}> 2 hours after a successful bump.` : ''}`
        );

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
