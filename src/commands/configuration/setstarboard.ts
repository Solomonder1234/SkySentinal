import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, ChannelType } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'setstarboard',
    description: 'Configure the starboard channel and threshold.',
    category: 'Configuration',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'channel',
            description: 'The channel to send starred messages to (or "off" to disable).',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
        },
        {
            name: 'threshold',
            description: 'The number of reactions required to star a message (default 5).',
            type: ApplicationCommandOptionType.Integer,
            minValue: 1,
            maxValue: 100,
            required: false,
        }
    ],
    run: async (client, interaction) => {
        const guildId = interaction.guildId!;
        let channelId: string | null = null;
        let threshold: number | null = null;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (args[0]) {
                if (args[0].toLowerCase() === 'off') {
                    channelId = null;
                } else {
                    const channelMention = interaction.mentions.channels.first();
                    if (channelMention) {
                        channelId = channelMention.id;
                    } else if (/^\d+$/.test(args[0])) {
                        channelId = args[0];
                    }
                }
            }
            if (args[1] && /^\d+$/.test(args[1])) {
                threshold = parseInt(args[1]);
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            const channel = chatInteraction.options.getChannel('channel');
            if (channel) channelId = channel.id;
            threshold = chatInteraction.options.getInteger('threshold');
        }

        const data: any = {};
        if (channelId !== null) data.starboardChannelId = channelId;
        else if (interaction instanceof Message && interaction.content.toLowerCase().includes('off')) data.starboardChannelId = null;

        if (threshold !== null) data.starboardThreshold = threshold;

        await client.database.prisma.guildConfig.upsert({
            where: { id: guildId },
            create: { id: guildId, ...data },
            update: data
        });

        const status = data.starboardChannelId ? `enabled in <#${data.starboardChannelId}>` : 'disabled';
        const thresh = data.starboardThreshold || 5;

        const embed = EmbedUtils.success(
            'Starboard Configured',
            `Starboard has been **${status}**. \nThreshold: **${thresh}** stars.`
        );

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
