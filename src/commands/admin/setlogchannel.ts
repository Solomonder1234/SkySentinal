import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { LogCategory } from '../../utils/Logger';

const CATEGORIES = [
    { name: 'Moderation', value: LogCategory.Moderation },
    { name: 'Messages', value: LogCategory.Message },
    { name: 'Members', value: LogCategory.Member },
    { name: 'Server', value: LogCategory.Server },
    { name: 'Voice', value: LogCategory.Voice },
    { name: 'Joins', value: LogCategory.Join },
    { name: 'Watch', value: LogCategory.Watch },
];

export default {
    name: 'setlogchannel',
    description: 'Set various logging channels for the server.',
    category: 'Admin',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'category',
            description: 'The type of logs to send to this channel.',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: CATEGORIES,
        },
        {
            name: 'channel',
            description: 'The channel to send logs to.',
            type: ApplicationCommandOptionType.Channel,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let channel: TextChannel;
        let category: LogCategory;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (args.length < 2) {
                return interaction.reply({ 
                    embeds: [EmbedUtils.error('Invalid Usage', `Usage: \`!setlogchannel <category> <channel>\`\nCategories: ${CATEGORIES.map(c => c.name.toLowerCase()).join(', ')}`)] 
                });
            }

            const categoryInput = args[0]!.toLowerCase();
            const foundCategory = CATEGORIES.find(c => c.name.toLowerCase() === categoryInput);
            if (!foundCategory) return interaction.reply({ embeds: [EmbedUtils.error('Invalid Category', `Available categories: ${CATEGORIES.map(c => c.name.toLowerCase()).join(', ')}`)] });
            category = foundCategory.value as LogCategory;

            const channelId = args[1]!.replace(/[<#!>]/g, '');
            channel = interaction.guild?.channels.cache.get(channelId) as TextChannel;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            category = chatInteraction.options.getString('category', true) as LogCategory;
            channel = chatInteraction.options.getChannel('channel', true) as TextChannel;
        }

        if (!channel || !channel.isTextBased()) return interaction.reply({ content: 'Invalid channel. Please tag a text channel.' });

        const data: any = {};
        data[category] = channel.id;
        data.enableLogging = true;

        await client.database.prisma.guildConfig.upsert({
            where: { id: interaction.guild?.id! },
            create: { id: interaction.guild?.id!, prefix: '!', ...data },
            update: data
        });

        const categoryName = CATEGORIES.find(c => c.value === category)?.name;
        const successEmbed = EmbedUtils.success(
            'Logging Configuration Updated', 
            `**${categoryName}** logs will now be sent to ${channel}.\nLogging is now globally **ENABLED**.`
        );

        await interaction.reply({ embeds: [successEmbed] });
    },
} as Command;
