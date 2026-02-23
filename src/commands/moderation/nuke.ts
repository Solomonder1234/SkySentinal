import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'nuke',
    description: 'Nuke (recreate) a channel.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    options: [
        {
            name: 'channel',
            description: 'The channel to nuke (defaults to current).',
            type: ApplicationCommandOptionType.Channel,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let channel: TextChannel;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const channelId = args[0]?.replace(/[<#!>]/g, '');

            if (channelId) {
                const fetched = interaction.guild?.channels.cache.get(channelId);
                if (fetched && fetched.isTextBased()) {
                    channel = fetched as TextChannel;
                } else {
                    channel = interaction.channel as TextChannel;
                }
            } else {
                channel = interaction.channel as TextChannel;
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            channel = (chatInteraction.options.getChannel('channel') as TextChannel) || (interaction.channel as TextChannel);
        }

        if (!channel || !channel.isTextBased()) return;

        // Confirmation (skip for !nuke for speed, or maybe add later)
        // For now, straight nuke

        try {
            const position = channel.position;
            const newChannel = await channel.clone({ position });
            await channel.delete();

            const successEmbed = EmbedUtils.success('Channel Nuked', `💥 **${newChannel.name}** has been nuked.`);
            const gifUrl = 'https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif'; // Optional fun additions
            successEmbed.setImage(gifUrl);

            await newChannel.send({ embeds: [successEmbed] });

        } catch (error) {
            client.logger.error(`Failed to nuke channel ${channel.name}:`, error);
            const errorEmbed = EmbedUtils.error('Nuke Failed', 'An error occurred while nuking the channel.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
