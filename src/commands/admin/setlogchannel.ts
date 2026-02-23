import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'setlogchannel',
    description: 'Set the channel for moderation logs.',
    category: 'Admin',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'channel',
            description: 'The channel to send logs to.',
            type: ApplicationCommandOptionType.Channel,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let channel: TextChannel;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const channelId = args[0]?.replace(/[<#!>]/g, '');
            channel = interaction.guild?.channels.cache.get(channelId!) as TextChannel;
            // If no arg, use current channel? No, explicit is better.
            if (!channel) {
                // Try current channel if they just said !setlogchannel
                if (args.length === 0) {
                    channel = interaction.channel as TextChannel;
                }
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            channel = chatInteraction.options.getChannel('channel', true) as TextChannel;
        }

        if (!channel || !channel.isTextBased()) return interaction.reply({ content: 'Invalid channel. Please tag a text channel.' });

        await client.database.prisma.guildConfig.upsert({
            where: { id: interaction.guild?.id! },
            create: { id: interaction.guild?.id!, prefix: '!', modLogChannelId: channel.id },
            update: { modLogChannelId: channel.id }
        });

        const successEmbed = EmbedUtils.success('Log Channel Updated', `Moderation logs will now be sent to ${channel}.`);

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [successEmbed] });
        } else {
            await interaction.reply({ embeds: [successEmbed] });
        }
    },
} as Command;
