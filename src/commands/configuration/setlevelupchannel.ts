import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, ChannelType } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'setlevelupchannel',
    description: 'Set the channel for level-up announcements.',
    category: 'Configuration',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'channel',
            description: 'The channel for announcements (or "off" to use current channel).',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
        }
    ],
    run: async (client, interaction) => {
        const guildId = interaction.guildId!;
        let channelId: string | null = null;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (args[0]?.toLowerCase() === 'off') {
                channelId = null;
            } else {
                const channel = interaction.mentions.channels.first();
                channelId = channel?.id || args[0] || null;
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            const channel = chatInteraction.options.getChannel('channel');
            channelId = channel?.id || null;
        }

        await client.database.prisma.guildConfig.upsert({
            where: { id: guildId },
            create: { id: guildId, levelUpChannelId: channelId },
            update: { levelUpChannelId: channelId }
        });

        const embed = EmbedUtils.success(
            'Level Up Channel Updated',
            channelId ? `Level-up announcements will now be sent in <#${channelId}>.` : 'Level-up announcements will be sent in the channel where the message was sent.'
        );

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
