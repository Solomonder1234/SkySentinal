import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, ChannelType, ChatInputCommandInteraction, Message, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'channel',
    description: 'Manage server channels.',
    category: 'Moderation',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    options: [
        {
            name: 'create',
            description: 'Create a new channel.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'name',
                    description: 'The name of the channel.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'type',
                    description: 'The type of channel.',
                    type: ApplicationCommandOptionType.Integer,
                    choices: [
                        { name: 'Text', value: ChannelType.GuildText },
                        { name: 'Voice', value: ChannelType.GuildVoice },
                        { name: 'Category', value: ChannelType.GuildCategory },
                        { name: 'Announcement', value: ChannelType.GuildAnnouncement }
                    ],
                    required: true,
                },
                {
                    name: 'category',
                    description: 'The category to place the channel in.',
                    type: ApplicationCommandOptionType.Channel,
                    channelTypes: [ChannelType.GuildCategory],
                    required: false,
                }
            ]
        },
        {
            name: 'delete',
            description: 'Delete a channel.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'The channel to delete.',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'The reason for deletion.',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                }
            ]
        },
        {
            name: 'info',
            description: 'Get information about a channel.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'The channel to get info about.',
                    type: ApplicationCommandOptionType.Channel,
                    required: false,
                }
            ]
        }
    ],
    run: async (client, interaction) => {
        let subcommand: string;
        let chanName: string | undefined;
        let chanType: number | undefined;
        let parentId: string | undefined;
        let targetChannel: any;
        let reason = 'No reason provided';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            subcommand = args[0]?.toLowerCase() || '';

            if (subcommand === 'create') {
                chanName = args[1] || '';
                chanType = ChannelType.GuildText; // Default for message prefix
                if (args[2]?.toLowerCase() === 'voice') chanType = ChannelType.GuildVoice;
                if (args[2]?.toLowerCase() === 'category') chanType = ChannelType.GuildCategory;
            } else if (subcommand === 'delete') {
                const mention = interaction.mentions.channels.first();
                targetChannel = mention || (args[1] ? interaction.guild?.channels.cache.get(args[1]) : undefined);
                reason = args.slice(2).join(' ') || reason;
            } else if (subcommand === 'info') {
                const mention = interaction.mentions.channels.first();
                targetChannel = mention || interaction.channel;
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            subcommand = chatInteraction.options.getSubcommand();
            chanName = chatInteraction.options.get('name')?.value as string;
            chanType = chatInteraction.options.get('type')?.value as number;
            parentId = chatInteraction.options.getChannel('category')?.id;
            targetChannel = chatInteraction.options.getChannel('channel');
            reason = chatInteraction.options.getString('reason') || reason;
        }

        if (subcommand === 'create') {
            if (!chanName) return interaction.reply({ content: 'Please provide a channel name.' });

            try {
                const newChan = await interaction.guild?.channels.create({
                    name: chanName,
                    type: chanType as any,
                    parent: parentId || null
                });
                return interaction.reply({ embeds: [EmbedUtils.success('Channel Created', `Successfully created ${newChan}.`)] });
            } catch (err: any) {
                return interaction.reply({ embeds: [EmbedUtils.error('Creation Failed', err.message)] });
            }
        }

        if (subcommand === 'delete') {
            if (!targetChannel) return interaction.reply({ content: 'Invalid channel.' });
            try {
                const name = targetChannel.name;
                await targetChannel.delete(reason);
                return interaction.reply({ embeds: [EmbedUtils.success('Channel Deleted', `Successfully deleted channel \`#${name}\`.\nReason: ${reason}`)] });
            } catch (err: any) {
                return interaction.reply({ embeds: [EmbedUtils.error('Deletion Failed', err.message)] });
            }
        }

        if (subcommand === 'info') {
            const chan = targetChannel || interaction.channel;
            if (!chan) return interaction.reply({ content: 'Channel not found.' });

            const embed = EmbedUtils.info(`Channel: #${chan.name}`, 'Comprehensive channel configuration and metadata summary.')
                .addFields([
                    { name: 'ID', value: `\`${chan.id}\``, inline: true },
                    { name: 'Type', value: `\`${ChannelType[chan.type]}\``, inline: true },
                    { name: 'Created At', value: `<t:${Math.floor(chan.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Topic', value: chan.topic || 'No topic set' }
                ])
                .setFooter({ text: `SkySentinel AV • ${chan.id}` });

            return interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
