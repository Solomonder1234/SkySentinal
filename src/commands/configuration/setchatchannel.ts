import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, ChannelType, PermissionsBitField, TextChannel, ChatInputCommandInteraction, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'setchatchannel',
    description: 'Set the channel where the AI will automatically reply to all messages.',
    category: 'Configuration',
    type: ApplicationCommandType.ChatInput,
    userPermissions: [PermissionsBitField.Flags.ManageGuild],
    options: [
        {
            name: 'channel',
            description: 'The channel to use for AI chat (leave empty to turn off).',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false
        }
    ],
    run: async (client, interaction) => {
        if (!interaction.guildId) return;

        let channel: TextChannel | null = null;
        let isOff = false;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const input = (args[0] || '').toLowerCase();

            if (input === 'off' || input === 'none' || input === 'disable' || !input) {
                isOff = true;
            } else {
                const channelId = input.replace(/[<#>]/g, '');
                const fetchedChannel = interaction.guild?.channels.cache.get(channelId);

                if (!fetchedChannel || fetchedChannel.type !== ChannelType.GuildText) {
                    return interaction.reply({ content: 'Please ensure you provide a valid Text Channel or use `off`. Usage: `!setchatchannel #channel` or `!setchatchannel off`' });
                }
                channel = fetchedChannel as TextChannel;
            }
        } else {
            channel = (interaction as ChatInputCommandInteraction).options.getChannel('channel') as TextChannel | null;
            if (!channel) isOff = true;
        }

        await client.database.prisma.guildConfig.upsert({
            where: { id: interaction.guildId },
            create: { id: interaction.guildId, aiChatChannelId: isOff ? null : (channel?.id ?? null) },
            update: { aiChatChannelId: isOff ? null : (channel?.id ?? null) }
        });

        return interaction.reply({
            embeds: [EmbedUtils.success('Configuration Updated', isOff ? 'The auto-reply AI channel has been **DISABLED**.' : `The AI will now automatically reply to all messages in ${channel}.`)]
        });
    },
} as Command;
