import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, TextChannel, GuildChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'unlock',
    description: 'Unlock a channel.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    options: [
        {
            name: 'channel',
            description: 'The channel to unlock (defaults to current).',
            type: ApplicationCommandOptionType.Channel,
            required: false,
        },
        {
            name: 'reason',
            description: 'Reason for unlocking.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let channel: TextChannel | GuildChannel;
        let reason = 'No reason provided';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const channelId = args[0]?.replace(/[<#!>]/g, '');

            if (channelId) {
                const fetched = interaction.guild?.channels.cache.get(channelId);
                if (fetched && fetched.isTextBased()) {
                    channel = fetched as TextChannel;
                    reason = args.slice(1).join(' ') || reason;
                } else {
                    channel = interaction.channel as TextChannel;
                    reason = args.join(' ') || reason;
                }
            } else {
                channel = interaction.channel as TextChannel;
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            channel = (chatInteraction.options.getChannel('channel') as TextChannel) || (interaction.channel as TextChannel);
            reason = chatInteraction.options.getString('reason') || reason;
        }

        if (!channel || !channel.isTextBased()) return;

        try {
            await (channel as TextChannel).permissionOverwrites.edit(interaction.guild!.roles.everyone, {
                SendMessages: null, // Reset to default (usually true if not denied elsewhere, or inherits)
            });

            const successEmbed = EmbedUtils.success('Channel Unlocked', `🔓 **${channel.name}** has been unlocked.\nReason: ${reason}`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }

        } catch (error) {
            client.logger.error(`Failed to unlock channel ${channel.name}:`, error);
            const errorEmbed = EmbedUtils.error('Unlock Failed', 'An error occurred while unlocking the channel.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
